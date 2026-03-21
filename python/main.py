import argparse
import json
import os
import random
import shutil
import subprocess
from pathlib import Path

from edge_tts_audio import build_timed_tts_audio
from groq_generate_assets import generate_assets_from_prompts


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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render a vocab video through Remotion."
    )
    parser.add_argument(
        "--asset",
        type=Path,
        default=Path("assets/list_word_info"),
        help="Path to the word JSON asset or a directory of JSON assets.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output video path. Defaults to output/<asset-name>.mp4.",
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="Run npm install inside the remotion project before rendering.",
    )
    parser.add_argument(
        "--no-tts",
        action="store_true",
        help="Skip TTS generation.",
    )
    parser.add_argument(
        "--generate-assets",
        action="store_true",
        help="Generate vocab JSON assets via Groq before rendering.",
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
        "--prompt-count",
        type=int,
        default=10,
        help="Number of vocab items to request per prompt.",
    )
    parser.add_argument(
        "--overwrite-assets",
        action="store_true",
        help="Overwrite existing JSON assets with the same name.",
    )
    return parser.parse_args()


def load_asset(asset_path: Path) -> dict:
    with asset_path.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if isinstance(data, list):
        if not data:
            raise RuntimeError(f"Asset list is empty: {asset_path}")
        if not isinstance(data[0], dict):
            raise RuntimeError(f"Asset list first item is not an object: {asset_path}")
        return data[0]
    if not isinstance(data, dict):
        raise RuntimeError(f"Invalid asset JSON: {asset_path}")
    return data


def load_asset_raw(asset_path: Path) -> dict | list:
    with asset_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def resolve_asset_path(asset_path: Path) -> Path:
    if asset_path.is_dir():
        candidates = sorted(asset_path.glob("*.json"))
        if candidates:
            return candidates[0]
    return asset_path


def _sanitize_slug(text: str) -> str:
    return "".join(ch for ch in text.strip().lower().replace(" ", "_") if ch.isalnum() or ch in "_-") or "word"


def load_assets_from_dir(assets_dir: Path) -> list[dict]:
    json_files = sorted(assets_dir.glob("*.json"))
    if not json_files:
        raise RuntimeError(f"No JSON assets found in {assets_dir}.")
    assets: list[dict] = []
    for json_path in json_files:
        data = load_asset_raw(json_path)
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    assets.append(item)
                else:
                    raise RuntimeError(f"Invalid item in {json_path}: expected object.")
        elif isinstance(data, dict):
            assets.append(data)
        else:
            raise RuntimeError(f"Invalid JSON in {json_path}: expected object or array.")
    return assets


def parse_voice_pool(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []
    return [voice.strip() for voice in raw_value.split(",") if voice.strip()]


def clear_sound_mp3(sound_dir: Path) -> None:
    if not sound_dir.exists():
        return
    for path in sound_dir.glob("*.mp3"):
        if path.is_file():
            path.unlink()


def clear_output_videos(output_dir: Path) -> None:
    if not output_dir.exists():
        return
    for path in output_dir.glob("*.mp4"):
        if path.is_file():
            path.unlink()


def tts_output_path(asset: dict, sound_dir: Path) -> Path:
    audio_file = asset.get("audioFile")
    if isinstance(audio_file, str) and audio_file.strip():
        return sound_dir / audio_file.strip()
    word = asset.get("word", "")
    return sound_dir / f"{_sanitize_slug(str(word))}.mp3"


def find_matching_audio(project_root: Path, asset_path: Path, audio_file: str | None = None) -> Path | None:
    candidate_extensions = (".mp3", ".wav", ".m4a", ".aac")
    sound_dir = project_root / "assets" / "sound"
    candidates: list[Path] = []

    if audio_file:
        audio_path = Path(audio_file)
        if not audio_path.suffix:
            for extension in candidate_extensions:
                candidates.append((sound_dir / f"{audio_path.name}{extension}").resolve())
        else:
            candidates.append((sound_dir / audio_path.name).resolve())
    else:
        stem = asset_path.stem
        for extension in candidate_extensions:
            candidates.append((sound_dir / f"{stem}{extension}").resolve())

    for candidate in candidates:
        if candidate.exists() and candidate.stat().st_size > 0:
            return candidate
    return None


def prepare_audio(project_root: Path, asset_data: dict, remotion_dir: Path) -> str | None:
    audio_file = asset_data.get("audioFile")
    if isinstance(audio_file, str) and audio_file.strip():
        audio_file_value = audio_file.strip()
    else:
        word = asset_data.get("word", "")
        audio_file_value = f"{_sanitize_slug(str(word))}.mp3"
    source_audio = find_matching_audio(project_root, Path(audio_file_value), audio_file_value)
    if source_audio is None:
        return None

    runtime_dir = remotion_dir / "public" / "runtime"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    target_audio = runtime_dir / source_audio.name
    shutil.copy2(source_audio, target_audio)
    return f"runtime/{source_audio.name}"


def collect_background_images(remotion_dir: Path) -> list[str]:
    source_dir = remotion_dir / "public" / "back_ground"
    if not source_dir.exists():
        return []
    valid_exts = {".png", ".jpg", ".jpeg", ".webp", ".jfif"}
    images: list[str] = []
    for path in sorted(source_dir.iterdir()):
        if path.is_file() and path.suffix.lower() in valid_exts:
            images.append(f"back_ground/{path.name}")
    return images


def run_command(command: list[str], cwd: Path) -> None:
    subprocess.run(command, cwd=cwd, check=True)


def npm_command() -> str:
    return "npm.cmd" if os.name == "nt" else "npm"


def find_browser_executable() -> str:
    candidates = [
        Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
        Path("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"),
        Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
        Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    raise RuntimeError("No local Chrome or Edge executable was found for Remotion.")


def ensure_node_version() -> None:
    result = subprocess.run(
        ["node", "-v"],
        check=True,
        capture_output=True,
        text=True,
    )
    raw_version = result.stdout.strip().lstrip("v")
    major = int(raw_version.split(".")[0])
    if major < 18:
        raise RuntimeError(
            f"Detected Node.js {raw_version}. Remotion requires Node.js 18 or newer."
        )


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parent.parent
    remotion_dir = project_root / "remotion"
    load_dotenv(project_root / ".env")
    asset_path = resolve_asset_path((project_root / args.asset).resolve())
    output_dir = (project_root / "output").resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.install:
        run_command([npm_command(), "install"], cwd=remotion_dir)

    # generate_assets_from_prompts(
    #     prompt_dir=project_root / args.prompt_dir,
    #     assets_dir=project_root / "assets",
    #     count=args.prompt_count,
    #     overwrite=args.overwrite_assets,
    #     prompt_glob=args.prompt_glob,
    # )

    ensure_node_version()
    if not args.no_tts:
        assets_dir = project_root / "assets" / "list_word_info"
        sound_dir = project_root / "assets" / "sound"
        json_assets = load_assets_from_dir(assets_dir)
        sound_dir.mkdir(parents=True, exist_ok=True)
        clear_sound_mp3(sound_dir)
        clear_output_videos(output_dir)
        background_images = collect_background_images(remotion_dir)
        voice_pool = parse_voice_pool(os.getenv("EDGE_TTS_VOICE"))

        for data in json_assets:
            data["renderSeed"] = random.randint(0, 1_000_000_000)
            if voice_pool:
                data["ttsVoice"] = voice_pool[data["renderSeed"] % len(voice_pool)]
            data["backgroundImages"] = background_images
            tts_output = tts_output_path(data, sound_dir)
            build_timed_tts_audio(
                asset_data=data,
                output_path=tts_output,
                project_root=project_root,
            )
            asset_data = data
            asset_data["audioStaticPath"] = prepare_audio(project_root, asset_data, remotion_dir)
            output_path = (output_dir / f"{tts_output.stem}.mp4").resolve()
            render_command = [
                npm_command(),
                "run",
                "render",
                "--",
                str(output_path),
                "--browser-executable",
                find_browser_executable(),
                "--props",
                json.dumps(asset_data, ensure_ascii=False),
            ]
            run_command(render_command, cwd=remotion_dir)


if __name__ == "__main__":
    main()
