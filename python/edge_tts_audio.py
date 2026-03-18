import asyncio
import os
import subprocess
import tempfile
from pathlib import Path


class EdgeTTSError(RuntimeError):
    pass


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise EdgeTTSError(f"Missing required environment variable: {name}")
    return value


def _ffmpeg_paths(project_root: Path) -> tuple[Path, Path]:
    ffmpeg = (
        project_root
        / "remotion"
        / "node_modules"
        / "@remotion"
        / "compositor-win32-x64-msvc"
        / "ffmpeg.exe"
    )
    ffprobe = (
        project_root
        / "remotion"
        / "node_modules"
        / "@remotion"
        / "compositor-win32-x64-msvc"
        / "ffprobe.exe"
    )
    if not ffmpeg.exists() or not ffprobe.exists():
        raise FileNotFoundError("ffmpeg/ffprobe not found in remotion node_modules.")
    return ffmpeg, ffprobe


def _run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def _duration_seconds(ffprobe: Path, audio_path: Path) -> float:
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


async def _edge_tts_save(
    text: str,
    output_path: Path,
    voice: str,
    rate: str,
    pitch: str,
    volume: str,
) -> None:
    try:
        import edge_tts  # type: ignore
    except Exception as exc:  # pragma: no cover - import guard
        raise EdgeTTSError("edge-tts module not found. Run: pip install edge-tts") from exc

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch,
        volume=volume,
    )
    await communicate.save(str(output_path))


def edge_tts_to_file(
    text: str,
    output_path: Path,
    voice: str,
    rate: str | None = None,
    pitch: str | None = None,
    volume: str | None = None,
) -> None:
    rate_value = rate or "+0%"
    pitch_value = pitch or "+0Hz"
    volume_value = volume or "+0%"
    asyncio.run(
        _edge_tts_save(
            text=text,
            output_path=output_path,
            voice=voice,
            rate=rate_value,
            pitch=pitch_value,
            volume=volume_value,
        )
    )


def build_timed_tts_audio(
    asset_data: dict,
    output_path: Path,
    project_root: Path,
    word_fast_end: float = 2.5,
    word_slow_start: float = 3.0,
    word_slow_end: float = 8.5,
    word_emph_end: float = 11.0,
    example_start: float = 11.0,
    example_end: float = 14.5,
    total_duration: float = 15.0,
    repeat_gap: float = 0.2,
) -> None:
    word = asset_data.get("word", "").strip()
    example = asset_data.get("exampleEn", "").strip()
    if not word:
        raise ValueError("Asset JSON is missing 'word'.")
    if not example:
        raise ValueError("Asset JSON is missing 'exampleEn'.")

    print(f"TTS prompt -> word: \"{word}\" | example: \"{example}\"")

    voice = _require_env("EDGE_TTS_VOICE")
    rate = os.getenv("EDGE_TTS_RATE")
    rate_word_fast = os.getenv("EDGE_TTS_RATE_WORD_FAST") or rate
    rate_word_slow = os.getenv("EDGE_TTS_RATE_WORD_SLOW") or rate
    rate_word_emph = os.getenv("EDGE_TTS_RATE_WORD_EMPH") or rate
    rate_word_emph_second = os.getenv("EDGE_TTS_RATE_WORD_EMPH_SECOND") or rate_word_emph
    rate_example = os.getenv("EDGE_TTS_RATE_EXAMPLE") or rate
    pitch = os.getenv("EDGE_TTS_PITCH")
    pitch_word_emph = os.getenv("EDGE_TTS_PITCH_WORD_EMPH") or pitch
    pitch_word_emph_second = os.getenv("EDGE_TTS_PITCH_WORD_EMPH_SECOND") or pitch_word_emph
    volume = os.getenv("EDGE_TTS_VOLUME")
    volume_word_emph = os.getenv("EDGE_TTS_VOLUME_WORD_EMPH") or volume
    volume_word_emph_second = os.getenv("EDGE_TTS_VOLUME_WORD_EMPH_SECOND") or volume_word_emph
    emph_gain = os.getenv("EDGE_TTS_WORD_EMPH_GAIN")
    emph_gain = float(emph_gain) if emph_gain else None
    base_sound = (
        project_root
        / "assets"
        / "ref_sound"
        / "base_sound.mp3"
    )

    ffmpeg, ffprobe = _ffmpeg_paths(project_root)

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp = Path(tmp_dir)
        word_fast_raw = tmp / "word_fast.mp3"
        word_fast_trimmed = tmp / "word_fast_trimmed.mp3"
        word_slow_low = tmp / "word_slow_low.mp3"
        word_slow_high = tmp / "word_slow_high.mp3"
        word_slow_pattern = tmp / "word_slow_pattern.mp3"
        word_slow_trimmed = tmp / "word_slow_trimmed.mp3"
        word_slow_fade = tmp / "word_slow_fade.mp3"
        word_emph_raw = tmp / "word_emph.mp3"
        word_emph_second_raw = tmp / "word_emph_second.mp3"
        word_emph_padded = tmp / "word_emph_padded.mp3"
        example_raw = tmp / "example.mp3"
        silence_25 = tmp / "silence_25.mp3"
        example_trimmed = tmp / "example_trimmed.mp3"
        example_pad = tmp / "example_pad.mp3"
        tail_silence = tmp / "tail_silence.mp3"
        concat_list = tmp / "concat.txt"
        tts_only = tmp / "tts_only.mp3"

        def render_word_segment(
            target_path: Path,
            duration: float,
            rate_value: str | None,
            pitch_value: str | None,
            volume_value: str | None,
            separator: str = ". ",
            prompt: str | None = None,
        ) -> None:
            repeats = 6
            while True:
                if prompt is None:
                    word_prompt = (separator.join([word] * repeats)).strip()
                else:
                    word_prompt = prompt
                edge_tts_to_file(
                    word_prompt,
                    target_path,
                    voice=voice,
                    rate=rate_value,
                    pitch=pitch_value,
                    volume=volume_value,
                )
                if _duration_seconds(ffprobe, target_path) >= duration or repeats >= 40:
                    break
                repeats += 4

        def trim_segment(input_path: Path, output_path: Path, duration: float, gain: float | None = None) -> None:
            temp_output = None
            if input_path.resolve() == output_path.resolve():
                temp_output = output_path.with_name(f"{output_path.stem}_tmp{output_path.suffix}")
                output_path = temp_output
            cmd = [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(input_path),
                "-t",
                f"{duration}",
            ]
            if gain:
                cmd.extend(["-af", f"volume={gain}"])
            cmd.extend(
                [
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(output_path),
                ]
            )
            _run(cmd)
            if temp_output:
                temp_output.replace(input_path)

        def apply_filter(input_path: Path, output_path: Path, filter_value: str) -> None:
            temp_output = None
            if input_path.resolve() == output_path.resolve():
                temp_output = output_path.with_name(f"{output_path.stem}_tmp{output_path.suffix}")
                output_path = temp_output
            _run(
                [
                    str(ffmpeg),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(input_path),
                    "-af",
                    filter_value,
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(output_path),
                ]
            )
            if temp_output:
                temp_output.replace(input_path)

        def ensure_duration(input_path: Path, duration: float) -> None:
            temp_output = input_path.with_name(f"{input_path.stem}_dur{input_path.suffix}")
            _run(
                [
                    str(ffmpeg),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(input_path),
                    "-af",
                    f"apad=pad_dur=2,atrim=0:{duration}",
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(temp_output),
                ]
            )
            temp_output.replace(input_path)

        def parse_rate(rate_value: str | None) -> int:
            if not rate_value:
                return 0
            cleaned = rate_value.strip().replace("%", "")
            try:
                return int(cleaned)
            except ValueError:
                return 0

        def render_emph_two_reads(duration: float) -> Path:
            base_rate = parse_rate(rate_word_emph)
            base_rate_second = parse_rate(rate_word_emph_second)
            for step in range(0, 9):
                rate_value = f"{base_rate + step * 10:+d}%"
                rate_value_second = f"{base_rate_second + step * 10:+d}%"
                edge_tts_to_file(
                    f"{word}.",
                    word_emph_raw,
                    voice=voice,
                    rate=rate_value,
                    pitch=pitch_word_emph,
                    volume=volume_word_emph,
                )
                edge_tts_to_file(
                    f"{word}.",
                    word_emph_second_raw,
                    voice=voice,
                    rate=rate_value_second,
                    pitch=pitch_word_emph_second,
                    volume=volume_word_emph_second,
                )
                concat_list.write_text(
                    "\n".join(
                        [
                            f"file '{word_emph_raw.as_posix()}'",
                            f"file '{word_emph_second_raw.as_posix()}'",
                        ]
                    ),
                    encoding="utf-8",
                )
                _run(
                    [
                        str(ffmpeg),
                        "-hide_banner",
                        "-loglevel",
                        "error",
                        "-y",
                        "-f",
                        "concat",
                        "-safe",
                        "0",
                        "-i",
                        str(concat_list),
                        "-c:a",
                        "libmp3lame",
                        "-q:a",
                        "2",
                        str(word_emph_padded),
                    ]
                )
                if _duration_seconds(ffprobe, word_emph_padded) <= duration:
                    return word_emph_padded
            return word_emph_padded

        fast_duration = max(0.0, word_fast_end)
        slow_duration = max(0.0, word_slow_end - word_slow_start)
        emph_duration = max(0.0, word_emph_end - word_slow_end)

        render_word_segment(word_fast_raw, fast_duration, rate_word_fast, pitch, volume, separator=" - ")
        trim_segment(word_fast_raw, word_fast_trimmed, fast_duration, gain=1.15)
        ensure_duration(word_fast_trimmed, fast_duration)

        # Build alternating low/high pitch word clips for the slow segment.
        # Use two reads per prompt to increase density.
        low_prompt = f"{word}.. {word}.."
        high_prompt = f"{word}.. {word}.."
        render_word_segment(word_slow_low, slow_duration, rate_word_slow, pitch, volume, prompt=low_prompt)
        render_word_segment(word_slow_high, slow_duration, rate_word_slow, pitch_word_emph, volume, prompt=high_prompt)
        concat_list.write_text(
            "\n".join(
                [
                    f"file '{word_slow_low.as_posix()}'",
                    f"file '{word_slow_high.as_posix()}'",
                    f"file '{word_slow_low.as_posix()}'",
                ]
            ),
            encoding="utf-8",
        )
        _run(
            [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_list),
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(word_slow_pattern),
            ]
        )
        _run(
            [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-stream_loop",
                "-1",
                "-i",
                str(word_slow_pattern),
                "-t",
                f"{slow_duration}",
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(word_slow_trimmed),
            ]
        )
        ensure_duration(word_slow_trimmed, slow_duration)

        emph_tail = 0.12
        emph_content_duration = max(0.1, emph_duration - emph_tail)

        emph_source = render_emph_two_reads(emph_content_duration)
        emph_actual = _duration_seconds(ffprobe, emph_source)
        if emph_actual > emph_content_duration:
            tempo = max(0.5, min(2.0, emph_actual / emph_content_duration))
            apply_filter(
                emph_source,
                word_emph_padded,
                f"atempo={tempo}",
            )
            emph_source = word_emph_padded
            emph_actual = _duration_seconds(ffprobe, emph_source)

        if emph_actual + 0.01 < emph_content_duration:
            pad = emph_content_duration - emph_actual
            padded_tmp = word_emph_padded.with_name(
                f"{word_emph_padded.stem}_tmp{word_emph_padded.suffix}"
            )
            _run(
                [
                    str(ffmpeg),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(emph_source),
                    "-f",
                    "lavfi",
                    "-i",
                    "anullsrc=r=44100:cl=stereo",
                    "-t",
                    f"{pad}",
                    "-filter_complex",
                    "[0:a][1:a]concat=n=2:v=0:a=1",
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(padded_tmp),
                ]
            )
            padded_tmp.replace(word_emph_padded)
        else:
            word_emph_padded = emph_source

        if emph_gain:
            apply_filter(word_emph_padded, word_emph_padded, f"volume={emph_gain}")

        # Add a short tail silence to avoid cutting the last syllable before exampleEn.
        tail_tmp = word_emph_padded.with_name(
            f"{word_emph_padded.stem}_tail{word_emph_padded.suffix}"
        )
        _run(
            [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(word_emph_padded),
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=44100:cl=stereo",
                "-t",
                f"{emph_tail}",
                "-filter_complex",
                "[0:a][1:a]concat=n=2:v=0:a=1",
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(tail_tmp),
            ]
        )
        tail_tmp.replace(word_emph_padded)
        ensure_duration(word_emph_padded, emph_duration)
        edge_tts_to_file(example, example_raw, voice=voice, rate=rate_example, pitch=pitch, volume=volume)

        _run(
            [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=44100:cl=stereo",
                "-t",
                f"{word_slow_start - word_fast_end}",
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(silence_25),
            ]
        )
        ensure_duration(silence_25, word_slow_start - word_fast_end)

        example_max = max(0.0, example_end - example_start)
        _run(
            [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(example_raw),
                "-t",
                f"{example_max}",
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(example_trimmed),
            ]
        )
        ensure_duration(example_trimmed, example_max)

        example_actual = _duration_seconds(ffprobe, example_trimmed)
        pad_duration = max(0.0, example_max - example_actual)
        if pad_duration > 0.0:
            _run(
                [
                    str(ffmpeg),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-f",
                    "lavfi",
                    "-i",
                    "anullsrc=r=44100:cl=stereo",
                    "-t",
                    f"{pad_duration}",
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(example_pad),
                ]
            )
        else:
            example_pad = None

        tail_duration = max(0.0, total_duration - example_end)
        _run(
            [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=44100:cl=stereo",
                "-t",
                f"{tail_duration}",
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(tail_silence),
            ]
        )

        parts = [
            word_fast_trimmed,
            silence_25,
            word_slow_trimmed,
            word_emph_padded,
            example_trimmed,
        ]
        if example_pad:
            parts.append(example_pad)
        parts.append(tail_silence)

        concat_list.write_text(
            "\n".join([f"file '{p.as_posix()}'" for p in parts]),
            encoding="utf-8",
        )

        _run(
            [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_list),
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(tts_only),
            ]
        )

        # Ensure total duration matches expected length.
        tts_padded = tts_only.with_name(f"{tts_only.stem}_pad{tts_only.suffix}")
        _run(
            [
                str(ffmpeg),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(tts_only),
                "-af",
                f"apad=pad_dur=2,atrim=0:{total_duration}",
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(tts_padded),
            ]
        )
        tts_padded.replace(tts_only)

        if base_sound.exists():
            _run(
                [
                    str(ffmpeg),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(tts_only),
                    "-stream_loop",
                    "-1",
                    "-i",
                    str(base_sound),
                    "-t",
                    f"{total_duration}",
                    "-filter_complex",
                    "[1:a]volume=0.55[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=0",
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(output_path),
                ]
            )
        else:
            tts_only.replace(output_path)
