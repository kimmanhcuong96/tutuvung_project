# Vocab Video Pipeline

Project nay duoc tach thanh 3 phan:

- `python/main.py`: entrypoint goi Remotion render
- `remotion/`: HTML/CSS/React template de render video
- `assets/`: JSON + audio cho tung tu

Template hien tai render theo khung tham chieu `1024x576`.

## Cau truc

```text
python/main.py
remotion/src/Video.tsx
remotion/src/Word.tsx
remotion/src/index.tsx
assets/abandon.json
assets/abandon.mp3
output/abandon.mp4
```

Audio duoc map truc tiep theo ten file JSON.
Vi du: `assets/abandon.json` se dung `assets/abandon.mp3`.

Neu khong truyen `--output`, file render mac dinh se la `output/<ten-json>.mp4`.

## Chay render

Can `Node.js >= 18`.

```bash
cd remotion
npm install
cd ..
python python/main.py --asset assets/abandon.json --output output/abandon.mp4
```

## Tao TTS bang Microsoft Edge TTS

Can cai dat:

```bash
pip install edge-tts
```

Set cac bien moi truong trong `.env`:

- `EDGE_TTS_VOICE` (vi du: `en-US-JennyNeural`)
- (tuy chon) `EDGE_TTS_RATE` (vi du: `+10%`)
- (tuy chon) `EDGE_TTS_RATE_WORD` (chi ap dung cho `word`)
- (tuy chon) `EDGE_TTS_RATE_EXAMPLE` (chi ap dung cho `exampleEn`)
- (tuy chon) `EDGE_TTS_PITCH` (vi du: `+0Hz`)
- (tuy chon) `EDGE_TTS_RATE_WORD_FAST` / `EDGE_TTS_RATE_WORD_SLOW` / `EDGE_TTS_RATE_WORD_EMPH`
- (tuy chon) `EDGE_TTS_PITCH_WORD_EMPH`
- (tuy chon) `EDGE_TTS_WORD_EMPH_GAIN` (vi du: `1.4`)

Chay:

```bash
python python/main.py --asset assets/abandon.json --output output/abandon.mp4
```

Edge TTS (edge-tts) su dung tham so `rate/pitch/volume` tuong ung voi prosody.
Code trong `python/edge_tts_audio.py` se pass `rate/pitch/volume` truc tiep theo cac bien `EDGE_TTS_*`.

## Phan tich vocal reference (tuy chon)

Khong can cai them thu vien. Dung `ffprobe` da co trong remotion.

Chay:

```bash
python python/analyze_vocal_ref.py "C:\Users\kimma\Downloads\vocal_ref_sound.mp3"
```

Neu co file SRT:

```bash
python python/analyze_vocal_ref.py "C:\Users\kimma\Downloads\vocal_ref_sound.mp3" --srt "C:\Users\kimma\Downloads\vocal_ref_sound.srt"
```
