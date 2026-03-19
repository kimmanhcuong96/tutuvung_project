import argparse
import json
import os
import re
import urllib.request
from pathlib import Path


class GroqAssetsError(RuntimeError):
    pass


def load_dotenv(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return

    for line in dotenv_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise GroqAssetsError(f"Missing required environment variable: {name}")
    return value


def _groq_base_url() -> str:
    return (os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1").rstrip("/")


def _groq_model() -> str:
    return os.getenv("MODEL_NAME") or os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"


def _groq_temperature() -> float:
    value = os.getenv("GROQ_TEMPERATURE")
    if not value:
        return 0.2
    try:
        return float(value)
    except ValueError:
        return 0.2


def _sanitize_slug(text: str) -> str:
    cleaned = text.strip().lower()
    cleaned = re.sub(r"\s+", "_", cleaned)
    cleaned = re.sub(r"[^a-z0-9_-]+", "", cleaned)
    return cleaned or "word"


def _extract_count_from_prompt(prompt_text: str) -> int | None:
    patterns = [
        r"\bGenerate\s+(\d+)\b",
        r"\bReturn\s+exactly\s+(\d+)\b",
        r"\bReturn\s+(\d+)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, prompt_text, flags=re.IGNORECASE)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                continue
    return None


def _build_schema(count: int) -> dict:
    return {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "minItems": count,
                "maxItems": count,
                "items": {
                    "type": "object",
                    "properties": {
                        "word": {"type": "string"},
                        "phonetic": {"type": "string"},
                        "meaning": {"type": "string"},
                        "exampleEn": {"type": "string"},
                        "exampleVi": {"type": "string"},
                        "audioFile": {"type": "string"},
                    },
                    "required": [
                        "word",
                        "phonetic",
                        "meaning",
                        "exampleEn",
                        "exampleVi",
                        "audioFile",
                    ],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["items"],
        "additionalProperties": False,
    }


def _build_messages(prompt_text: str, count: int) -> list[dict]:
    system = (
        "You generate English vocabulary data for Vietnamese learners. "
        "Return JSON only, with no extra text."
    )
    user = (
        f"{prompt_text.strip()}\n\n"
        f"Return exactly {count} items. Each item must include: "
        "word, phonetic (IPA), meaning (Vietnamese), exampleEn, exampleVi, "
        "and audioFile where audioFile is word + '.mp3'."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _call_groq(prompt_text: str, count: int, response_format: dict | None) -> dict:
    provider = (os.getenv("LLM_PROVIDER") or "groq").strip().lower()
    if provider != "groq":
        raise GroqAssetsError(f"Unsupported LLM_PROVIDER value: {provider}")
    api_key = _require_env("GROQ_API_KEY")
    model = _groq_model()
    url = f"{_groq_base_url()}/chat/completions"
    payload: dict = {
        "model": model,
        "temperature": _groq_temperature(),
        "messages": _build_messages(prompt_text, count),
    }
    if response_format is not None:
        payload["response_format"] = response_format
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) vocab-tiktok-project",
    }
    request = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:  # pragma: no cover - network guard
        body = exc.read().decode("utf-8", errors="replace")
        raise GroqAssetsError(
            f"Groq API request failed with HTTP {exc.code}: {body}"
        ) from exc
    except Exception as exc:  # pragma: no cover - network guard
        raise GroqAssetsError("Groq API request failed.") from exc
    return json.loads(raw.decode("utf-8"))


def _call_groq_with_fallback(prompt_text: str, count: int) -> dict:
    json_schema_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "vocab_items",
            "strict": True,
            "schema": _build_schema(count),
        },
    }
    try:
        return _call_groq(prompt_text, count, json_schema_format)
    except GroqAssetsError as exc:
        message = str(exc)
        if "response format `json_schema`" not in message and "response_format" not in message:
            raise
    json_object_format = {"type": "json_object"}
    return _call_groq(prompt_text, count, json_object_format)


def _extract_items(response: dict) -> list[dict]:
    try:
        content = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:  # pragma: no cover - defensive guard
        raise GroqAssetsError("Unexpected Groq response format.") from exc
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise GroqAssetsError("Groq response was not valid JSON.") from exc
    if isinstance(parsed, str):
        try:
            parsed = json.loads(parsed)
        except json.JSONDecodeError:
            pass
    if isinstance(parsed, dict):
        if "items" in parsed:
            items = parsed["items"]
        elif "data" in parsed:
            items = parsed["data"]
        elif all(isinstance(value, dict) for value in parsed.values()):
            items = list(parsed.values())
        elif all(key in parsed for key in ["word", "phonetic", "meaning", "exampleEn", "exampleVi"]):
            items = [parsed]
        else:
            items = parsed
    else:
        items = parsed
    if isinstance(items, list):
        return items
    snippet = content[:500].replace("\n", " ")
    raise GroqAssetsError(
        "Groq response JSON did not include a list of items. "
        f"Content snippet: {snippet}"
    )


def _validate_item(item: dict) -> dict:
    required = ["word", "phonetic", "meaning", "exampleEn", "exampleVi"]
    missing = [key for key in required if not isinstance(item.get(key), str) or not item.get(key).strip()]
    if missing:
        raise GroqAssetsError(f"Missing required fields in item: {', '.join(missing)}")
    word = item["word"].strip()
    base_name = _sanitize_slug(word)
    audio_file = f"{base_name}.mp3"
    return {
        "word": word,
        "phonetic": item["phonetic"].strip(),
        "meaning": item["meaning"].strip(),
        "exampleEn": item["exampleEn"].strip(),
        "exampleVi": item["exampleVi"].strip(),
        "audioFile": audio_file.strip(),
    }


def _write_asset(item: dict, assets_dir: Path, overwrite: bool) -> Path:
    base_name = _sanitize_slug(item["word"])
    target = assets_dir / f"{base_name}.json"
    if target.exists() and not overwrite:
        index = 2
        while True:
            candidate = assets_dir / f"{base_name}_{index}.json"
            if not candidate.exists():
                target = candidate
                break
            index += 1
    target.write_text(json.dumps(item, ensure_ascii=False, indent=2), encoding="utf-8")
    return target


def generate_assets_from_prompts(
    prompt_dir: Path,
    assets_dir: Path,
    count: int,
    overwrite: bool,
    prompt_glob: str,
) -> list[Path]:
    if not prompt_dir.exists():
        raise GroqAssetsError(f"Prompt directory not found: {prompt_dir}")
    prompt_files = sorted(prompt_dir.glob(prompt_glob))
    if not prompt_files:
        raise GroqAssetsError(f"No prompt files found in {prompt_dir} (glob: {prompt_glob}).")

    assets_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for prompt_file in prompt_files:
        prompt_text = prompt_file.read_text(encoding="utf-8").strip()
        if not prompt_text:
            raise GroqAssetsError(f"Prompt file is empty: {prompt_file}")
        prompt_count = _extract_count_from_prompt(prompt_text)
        effective_count = prompt_count or count
        response = _call_groq_with_fallback(prompt_text, effective_count)
        items = _extract_items(response)
        if len(items) > effective_count:
            items = items[:effective_count]
        for item in items:
            normalized = _validate_item(item)
            written.append(_write_asset(normalized, assets_dir, overwrite))
    return written


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate vocab JSON assets using Groq."
    )
    parser.add_argument(
        "--prompt-dir",
        type=Path,
        default=Path("prompts"),
        help="Directory containing .txt prompt files.",
    )
    parser.add_argument(
        "--prompt-glob",
        type=str,
        default="*.txt",
        help="Glob pattern for prompt files inside prompt-dir.",
    )
    parser.add_argument(
        "--assets-dir",
        type=Path,
        default=Path("assets"),
        help="Output directory for generated JSON assets.",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="Number of vocab items to request per prompt.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing JSON assets with the same name.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parent.parent
    load_dotenv(project_root / ".env")
    prompt_dir = (project_root / args.prompt_dir).resolve()
    assets_dir = (project_root / args.assets_dir).resolve()
    written = generate_assets_from_prompts(
        prompt_dir=prompt_dir,
        assets_dir=assets_dir,
        count=args.count,
        overwrite=args.overwrite,
        prompt_glob=args.prompt_glob,
    )
    print(f"Generated {len(written)} assets in {assets_dir}.")


if __name__ == "__main__":
    main()
