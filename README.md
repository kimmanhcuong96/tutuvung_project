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
