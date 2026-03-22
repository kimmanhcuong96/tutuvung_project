import asyncio
import math
import os
import subprocess
import tempfile
import time
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
    for attempt in range(3):
        try:
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
            return
        except Exception as exc:
            if exc.__class__.__name__ == "NoAudioReceived":
                print(f"[edge-tts] NoAudioReceived for voice: {voice}")
            if exc.__class__.__name__ != "NoAudioReceived" or attempt == 2:
                raise
            time.sleep(0.5)


def _tts_engine() -> str:
    return (os.getenv("TTS_ENGINE") or "edge").strip().lower()


def _tts_to_file(
        text: str,
        output_path: Path,
        voice: str,
        rate: str | None = None,
        pitch: str | None = None,
        volume: str | None = None,
) -> None:
    engine = _tts_engine()
    if engine == "azure":
        from azure_tts_audio import azure_tts_to_file

        azure_tts_to_file(
            text=text,
            output_path=output_path,
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )
        return
    if engine != "edge":
        raise EdgeTTSError(f"Unsupported TTS_ENGINE value: {engine}")
    edge_tts_to_file(
        text=text,
        output_path=output_path,
        voice=voice,
        rate=rate,
        pitch=pitch,
        volume=volume,
    )


def build_timed_tts_audio(
        asset_data: dict,
        output_path: Path,
        project_root: Path,
        word_fast_end: float = 2.8,
        word_slow_start: float = 3.5,
        word_slow_end: float = 9.5,
        example_start: float = 10.5,
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

    engine = _tts_engine()
    if engine == "azure":
        voice = _require_env("AZURE_TTS_VOICE")
        rate = os.getenv("AZURE_TTS_RATE")
        rate_word_fast = os.getenv("AZURE_TTS_RATE_WORD_FAST") or rate
        rate_word_slow = os.getenv("AZURE_TTS_RATE_WORD_SLOW") or rate
        rate_word_emph = os.getenv("AZURE_TTS_RATE_WORD_EMPH") or rate
        rate_word_emph_second = os.getenv("AZURE_TTS_RATE_WORD_EMPH_SECOND") or rate_word_emph
        rate_example = os.getenv("AZURE_TTS_RATE_EXAMPLE") or rate
        pitch = os.getenv("AZURE_TTS_PITCH")
        pitch_word_emph = os.getenv("AZURE_TTS_PITCH_WORD_EMPH") or pitch
        pitch_word_emph_second = os.getenv("AZURE_TTS_PITCH_WORD_EMPH_SECOND") or pitch_word_emph
        volume = os.getenv("AZURE_TTS_VOLUME")
        volume_word_emph = os.getenv("AZURE_TTS_VOLUME_WORD_EMPH") or volume
        volume_word_emph_second = os.getenv("AZURE_TTS_VOLUME_WORD_EMPH_SECOND") or volume_word_emph
        emph_gain = os.getenv("AZURE_TTS_WORD_EMPH_GAIN")
    elif engine == "edge":
        voice = asset_data.get("ttsVoice") or _require_env("EDGE_TTS_VOICE")
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
    else:
        raise EdgeTTSError(f"Unsupported TTS_ENGINE value: {engine}")
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
        print(f"TTS temp dir: {tmp}")
        word_fast_raw = tmp / "word_fast.mp3"
        word_fast_trimmed = tmp / "word_fast_trimmed.mp3"
        word_slow_low = tmp / "word_slow_low.mp3"
        word_slow_pattern = tmp / "word_slow_pattern.mp3"
        word_slow_trimmed = tmp / "word_slow_trimmed.mp3"
        word_slow_fade = tmp / "word_slow_fade.mp3"
        example_raw = tmp / "example.mp3"
        spelling_raw = tmp / "spelling.mp3"
        pronounce_raw = tmp / "pronounce.mp3"
        spelling_pronounce = tmp / "spelling_pronounce.mp3"
        example_combined = tmp / "example_combined.mp3"
        silence_25 = tmp / "silence_25.mp3"
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
                prompt: str | None = None
        ) -> None:
            print('debug prompt: ', prompt)
            print('word: ', word)
            print('rate ', rate_value)
            if prompt is None:
                word_prompt = word
            else:
                word_prompt = prompt
            _tts_to_file(
                word_prompt,
                target_path,
                voice=voice,
                rate=rate_value,
                pitch=pitch_value,
                volume=volume_value,
            )
            repeats = 1
            unit_word_duration = _duration_seconds(ffprobe, target_path)
            if unit_word_duration <= duration:
                repeats = max(1, math.floor(duration / unit_word_duration))
                if repeats == 1:
                    rate_value = "+100%"
                    repeats = 3
                if repeats == 2:
                    rate_value = "+78%"
                    repeats = 3
            word_prompt = (separator.join([word] * repeats)).strip()
            print('repeats: ', repeats)
            _tts_to_file(
                word_prompt,
                target_path,
                voice=voice,
                rate=rate_value,
                pitch=pitch_value,
                volume=volume_value,
            )

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

        def trim_silence_edges(input_path: Path, output_path: Path) -> None:
            try:
                apply_filter(
                    input_path,
                    output_path,
                    "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-40dB:"
                    "stop_periods=1:stop_duration=0.05:stop_threshold=-40dB",
                )
            except subprocess.CalledProcessError:
                return

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

        def adjust_percent(value: str | None, delta: int) -> str | None:
            if value is None:
                return None
            cleaned = value.strip().replace("%", "")
            try:
                base = int(cleaned)
            except ValueError:
                return value
            return f"{base + delta:+d}%"

        fast_duration = max(0.0, word_fast_end)
        slow_duration = max(0.0, word_slow_end - word_slow_start)

        # create first 2.5 second mp3
        fast_promt = f"{word}"
        render_word_segment(word_fast_raw, fast_duration, rate_word_fast, pitch, "+20%", prompt=fast_promt,
                            separator=" - ")
        trim_segment(word_fast_raw, word_fast_trimmed, fast_duration, gain=1.15)
        ensure_duration(word_fast_trimmed, fast_duration)

        # Build alternating low/high pitch word clips for the slow segment.
        # Use two reads per prompt to increase density.
        steady_prompt = f"{word}...? - {word}..."
        render_word_segment(word_slow_low, slow_duration, rate_word_slow, pitch, volume, prompt=steady_prompt)
        trim_silence_edges(word_slow_low, word_slow_low)
        concat_list.write_text(
            "\n".join(
                [
                    f"file '{word_slow_low.as_posix()}'"
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

        spelling_text = " ".join(list(word))
        _tts_to_file(spelling_text, spelling_raw, voice=voice, rate="+20%", pitch="+5Hz", volume=volume)
        _tts_to_file(
            f"{word}.",
            pronounce_raw,
            voice=voice,
            rate="+70%",
            pitch="+10Hz",
            volume=adjust_percent("0", 50),
        )
        apply_filter(pronounce_raw, pronounce_raw, "volume=1.5")
        try:
            pronounce_duration = _duration_seconds(ffprobe, pronounce_raw)
            fade_start = max(0.0, pronounce_duration - 0.18)
            apply_filter(pronounce_raw, pronounce_raw, f"afade=t=out:st={fade_start}:d=0.18")
        except subprocess.CalledProcessError:
            pass
        _tts_to_file(example, example_raw, voice=voice, rate=rate_example, pitch=pitch, volume=volume)
        trim_silence_edges(spelling_raw, spelling_raw)
        trim_silence_edges(pronounce_raw, pronounce_raw)
        trim_silence_edges(example_raw, example_raw)

        spelling_pronounce_ready = False
        try:
            _run(
                [
                    str(ffmpeg),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(spelling_raw),
                    "-i",
                    str(pronounce_raw),
                    "-filter_complex",
                    "[0:a][1:a]acrossfade=d=0.15:c1=tri:c2=tri",
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(spelling_pronounce),
                ]
            )
            spelling_pronounce_ready = True
        except subprocess.CalledProcessError:
            spelling_pronounce_ready = False

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

        concat_parts = []
        if spelling_pronounce_ready:
            concat_parts.append(spelling_pronounce)
        else:
            concat_parts.extend([spelling_raw, pronounce_raw])
        concat_parts.append(example_raw)
        concat_list.write_text(
            "\n".join([f"file '{p.as_posix()}'" for p in concat_parts]),
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
                str(example_combined),
            ]
        )
        example_max = max(0.0, example_end - example_start)

        example_actual = _duration_seconds(ffprobe, example_combined)
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
        print("example : ", _duration_seconds(ffprobe, example_combined))
        example_combined_duration = _duration_seconds(ffprobe, example_combined)
        legal_duration = total_duration - word_slow_end + 1.3
        print("alloww duration: ", legal_duration)
        if example_combined_duration > legal_duration:
            increase_rate = min(
                1.99,
                round(example_combined_duration / legal_duration, 2),
            )
            print('increase_rate: ', round(example_combined_duration / legal_duration, 2))
            fast_example = example_combined.with_name(
                f"{example_combined.stem}_fast{example_combined.suffix}"
            )
            _run(
                [
                    str(ffmpeg),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-i",
                    str(example_combined),
                    "-filter:a",
                    f"atempo={float(increase_rate):.2f}",
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(fast_example),
                ]
            )
            fast_example.replace(example_combined)
        parts = [
            word_fast_trimmed,
            silence_25,
            word_slow_trimmed,
            example_combined,
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
        apply_filter(tts_only, tts_only, "volume=1.4")

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
                    "[1:a]volume=0.35[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=0",
                    "-c:a",
                    "libmp3lame",
                    "-q:a",
                    "2",
                    str(output_path),
                ]
            )
        else:
            tts_only.replace(output_path)
