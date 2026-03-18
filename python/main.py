import argparse
import json
import os
import shutil
import subprocess
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render a vocab video through Remotion."
    )
    parser.add_argument(
        "--asset",
        type=Path,
        default=Path("assets/abandon.json"),
        help="Path to the word JSON asset.",
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
    return parser.parse_args()


def load_asset(asset_path: Path) -> dict:
    with asset_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def find_matching_audio(asset_path: Path) -> Path | None:
    stem = asset_path.stem
    candidate_extensions = (".mp3", ".wav", ".m4a", ".aac")

    for extension in candidate_extensions:
        candidate = (asset_path.parent / f"{stem}{extension}").resolve()
        if candidate.exists() and candidate.stat().st_size > 0:
            return candidate

    return None


def prepare_audio(asset_path: Path, remotion_dir: Path) -> str | None:
    source_audio = find_matching_audio(asset_path)
    if source_audio is None:
        return None

    runtime_dir = remotion_dir / "public" / "runtime"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    target_audio = runtime_dir / source_audio.name
    shutil.copy2(source_audio, target_audio)
    return f"runtime/{source_audio.name}"


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
    asset_path = (project_root / args.asset).resolve()
    output_arg = args.output or Path(f"output/{asset_path.stem}.mp4")
    output_path = (project_root / output_arg).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    ensure_node_version()

    asset_data = load_asset(asset_path)
    asset_data["audioStaticPath"] = prepare_audio(asset_path, remotion_dir)

    if args.install:
        run_command([npm_command(), "install"], cwd=remotion_dir)

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
