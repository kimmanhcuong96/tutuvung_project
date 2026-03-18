# Vocab Video Pipeline

Project nay duoc tach thanh 3 phan:

- `python/main.py`: entrypoint goi Remotion render
- `remotion/`: HTML/CSS/React template de render video
- `assets/`: JSON + audio cho tung tu

Template hien tai render ra video doc `1080x1920` de dang upload TikTok.

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

## Chay render

Can `Node.js >= 18`.

```bash
cd remotion
npm install
cd ..
python python/main.py --asset assets/abandon.json --output output/abandon.mp4
```
