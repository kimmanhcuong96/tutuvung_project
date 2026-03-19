import os
import urllib.request
from pathlib import Path


class AzureTTSError(RuntimeError):
    pass


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise AzureTTSError(f"Missing required environment variable: {name}")
    return value


def _speech_endpoint(region: str) -> str:
    return f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"


def _prosody_tag(text: str, rate: str | None, pitch: str | None, volume: str | None) -> str:
    attrs: list[str] = []
    if rate:
        attrs.append(f'rate="{rate}"')
    if pitch:
        attrs.append(f'pitch="{pitch}"')
    if volume:
        attrs.append(f'volume="{volume}"')
    if not attrs:
        return text
    return f"<prosody {' '.join(attrs)}>{text}</prosody>"


def _build_ssml(text: str, voice: str, rate: str | None, pitch: str | None, volume: str | None) -> str:
    content = _prosody_tag(text, rate, pitch, volume)
    return (
        "<speak version='1.0' xml:lang='en-US'>"
        f"<voice name='{voice}'>"
        f"{content}"
        "</voice>"
        "</speak>"
    )


def azure_tts_to_file(
    text: str,
    output_path: Path,
    voice: str,
    rate: str | None = None,
    pitch: str | None = None,
    volume: str | None = None,
) -> None:
    key = _require_env("AZURE_TTS_KEY")
    region = _require_env("AZURE_TTS_REGION")
    output_format = os.getenv("AZURE_TTS_OUTPUT_FORMAT") or "audio-24khz-48kbitrate-mono-mp3"

    ssml = _build_ssml(text, voice, rate, pitch, volume)
    endpoint = _speech_endpoint(region)
    headers = {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": output_format,
        "User-Agent": "vocab-tiktok-project",
    }
    data = ssml.encode("utf-8")

    request = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            audio = response.read()
    except Exception as exc:  # pragma: no cover - network guard
        raise AzureTTSError("Azure TTS request failed.") from exc

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(audio)
