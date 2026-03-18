import argparse
import re
import subprocess
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Analyze a vocal reference file.")
    parser.add_argument("audio", type=Path, help="Path to the reference audio file.")
    parser.add_argument(
        "--srt",
        type=Path,
        default=None,
        help="Optional SRT file to compute words-per-second per segment.",
    )
    return parser.parse_args()


def ffprobe_duration(ffprobe: Path, audio_path: Path) -> float:
    result = subprocess.run(
        [
            str(ffprobe),
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def parse_srt(path: Path) -> list[tuple[float, float, str]]:
    content = path.read_text(encoding="utf-8", errors="replace")
    blocks = re.split(r"\n\s*\n", content.strip())
    entries: list[tuple[float, float, str]] = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if len(lines) < 2:
            continue
        time_line = lines[1] if "-->" in lines[1] else lines[0]
        match = re.match(
            r"(\d+:\d+:\d+,\d+)\s*-->\s*(\d+:\d+:\d+,\d+)", time_line
        )
        if not match:
            continue

        def to_seconds(ts: str) -> float:
            h, m, rest = ts.split(":")
            s, ms = rest.split(",")
            return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000

        start = to_seconds(match.group(1))
        end = to_seconds(match.group(2))
        text = " ".join(lines[2:]) if "-->" in lines[1] else " ".join(lines[1:])
        entries.append((start, end, text))
    return entries


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parent.parent
    ffprobe = (
        project_root
        / "remotion"
        / "node_modules"
        / "@remotion"
        / "compositor-win32-x64-msvc"
        / "ffprobe.exe"
    )
    if not ffprobe.exists():
        raise FileNotFoundError("ffprobe not found in remotion node_modules.")

    audio_path = args.audio.resolve()
    if not audio_path.exists():
        raise FileNotFoundError(audio_path)

    duration = ffprobe_duration(ffprobe, audio_path)
    print(f"Duration: {duration:.3f}s")

    if args.srt:
        srt_path = args.srt.resolve()
        entries = parse_srt(srt_path)
        for start, end, text in entries:
            words = [w for w in re.split(r"\s+", text) if w]
            word_count = len(words)
            segment = max(0.001, end - start)
            wps = word_count / segment
            print(f"{start:.3f}-{end:.3f}s | {word_count} words | {wps:.2f} wps | {text}")


if __name__ == "__main__":
    main()
