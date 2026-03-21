import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type WordProps = {
  word: string;
  phonetic: string;
  meaning: string;
  exampleEn: string;
  exampleVi: string;
  other_meaning?: OtherMeaningItem[];
  backgroundImages?: string[];
  renderSeed?: number;
};

type OtherMeaningItem = {
  word: string;
  phonetic: string;
  meaning: string;
};

const displayFont = '"Segoe UI", Arial, sans-serif';
const bodyFont = '"Segoe UI", Arial, sans-serif';

const backgroundColorSets = [
  {core: "rgba(34,14,62,0.72)", mid: "rgba(12,3,28,1)", deep: "rgba(6,0,18,1)"},
  {core: "rgba(72,156,220,0.75)", mid: "rgba(52,118,180,0.98)", deep: "rgba(36,92,150,0.98)"},
  {core: "rgba(92,198,200,0.72)", mid: "rgba(62,160,164,0.98)", deep: "rgba(44,128,132,0.98)"},
  {core: "rgba(108,206,160,0.72)", mid: "rgba(78,170,130,0.98)", deep: "rgba(58,138,106,0.98)"},
  {core: "rgba(196,196,120,0.74)", mid: "rgba(166,166,96,0.98)", deep: "rgba(136,136,78,0.98)"},
  {core: "rgba(190,160,110,0.74)", mid: "rgba(160,132,92,0.98)", deep: "rgba(132,108,74,0.98)"},
  {core: "rgba(150,180,120,0.72)", mid: "rgba(122,150,98,0.98)", deep: "rgba(98,122,78,0.98)"},
  {core: "rgba(120,150,170,0.74)", mid: "rgba(98,122,140,0.98)", deep: "rgba(78,98,114,0.98)"},
  {core: "rgba(142,132,198,0.74)", mid: "rgba(116,106,162,0.98)", deep: "rgba(94,86,132,0.98)"},
  {core: "rgba(160,180,200,0.74)", mid: "rgba(132,150,168,0.98)", deep: "rgba(106,122,138,0.98)"},
];

const backgroundVariants = [
  {
    overlay: "radial-gradient(circle at 50% 50%, rgba(82,28,140,0.12), rgba(0,0,0,0) 64%)",
    wavePrimary: "rgba(222,111,255,0.52)",
    waveSecondary: "rgba(171,108,255,0.28)",
    waveShadow: "rgba(203,111,255,0.55)",
  },
  {
    overlay: "radial-gradient(circle at 40% 45%, rgba(130,210,235,0.2), rgba(255,255,255,0) 60%)",
    wavePrimary: "rgba(150,220,240,0.55)",
    waveSecondary: "rgba(100,170,210,0.32)",
    waveShadow: "rgba(150,220,240,0.46)",
  },
  {
    overlay: "radial-gradient(circle at 60% 40%, rgba(140,230,210,0.2), rgba(255,255,255,0) 62%)",
    wavePrimary: "rgba(150,220,210,0.52)",
    waveSecondary: "rgba(102,170,160,0.32)",
    waveShadow: "rgba(150,220,210,0.45)",
  },
  {
    overlay: "radial-gradient(circle at 45% 45%, rgba(230,210,140,0.2), rgba(255,255,255,0) 62%)",
    wavePrimary: "rgba(220,200,140,0.52)",
    waveSecondary: "rgba(180,160,110,0.32)",
    waveShadow: "rgba(220,200,140,0.44)",
  },
  {
    overlay: "radial-gradient(circle at 55% 45%, rgba(200,210,220,0.2), rgba(255,255,255,0) 62%)",
    wavePrimary: "rgba(190,200,210,0.5)",
    waveSecondary: "rgba(140,150,165,0.32)",
    waveShadow: "rgba(190,200,210,0.44)",
  },
  {
    overlay: "radial-gradient(circle at 50% 40%, rgba(210,170,140,0.2), rgba(255,255,255,0) 62%)",
    wavePrimary: "rgba(210,180,150,0.52)",
    waveSecondary: "rgba(170,140,110,0.32)",
    waveShadow: "rgba(210,180,150,0.44)",
  },
  {
    overlay: "radial-gradient(circle at 40% 50%, rgba(150,190,220,0.2), rgba(255,255,255,0) 62%)",
    wavePrimary: "rgba(160,200,220,0.52)",
    waveSecondary: "rgba(110,150,180,0.32)",
    waveShadow: "rgba(160,200,220,0.44)",
  },
  {
    overlay: "radial-gradient(circle at 50% 55%, rgba(195,225,160,0.2), rgba(255,255,255,0) 62%)",
    wavePrimary: "rgba(190,210,160,0.5)",
    waveSecondary: "rgba(140,170,120,0.32)",
    waveShadow: "rgba(190,210,160,0.44)",
  },
  {
    overlay: "radial-gradient(circle at 55% 50%, rgba(150,220,210,0.2), rgba(255,255,255,0) 62%)",
    wavePrimary: "rgba(160,210,200,0.5)",
    waveSecondary: "rgba(115,165,155,0.32)",
    waveShadow: "rgba(160,210,200,0.44)",
  },
  {
    overlay: "radial-gradient(circle at 45% 55%, rgba(180,170,220,0.2), rgba(255,255,255,0) 62%)",
    wavePrimary: "rgba(180,170,210,0.52)",
    waveSecondary: "rgba(130,120,170,0.32)",
    waveShadow: "rgba(180,170,210,0.44)",
  },
];

const waveVariants = [
  {
    lines: [
      {offset: 0.26, amp: 0.08, phase: 4, speed: 50},
      {offset: 0.34, amp: 0.19, phase: 16, speed: 34},
      {offset: 0.42, amp: 0.1, phase: 28, speed: 44},
    ],
  },
  {
    lines: [
      {offset: 0.29, amp: 0.22, phase: 10, speed: 32},
      {offset: 0.36, amp: 0.06, phase: 2, speed: 56},
      {offset: 0.44, amp: 0.18, phase: 20, speed: 38},
    ],
  },
  {
    lines: [
      {offset: 0.31, amp: 0.12, phase: 22, speed: 46},
      {offset: 0.38, amp: 0.2, phase: 8, speed: 36},
      {offset: 0.45, amp: 0.09, phase: 14, speed: 52},
    ],
  },
  {
    lines: [
      {offset: 0.27, amp: 0.16, phase: 6, speed: 40},
      {offset: 0.33, amp: 0.07, phase: 18, speed: 58},
      {offset: 0.39, amp: 0.21, phase: 12, speed: 33},
      {offset: 0.46, amp: 0.12, phase: 26, speed: 48},
    ],
  },
  {
    lines: [
      {offset: 0.3, amp: 0.1, phase: 2, speed: 60},
      {offset: 0.37, amp: 0.24, phase: 14, speed: 35},
      {offset: 0.43, amp: 0.08, phase: 24, speed: 54},
    ],
  },
  {
    lines: [
      {offset: 0.25, amp: 0.2, phase: 16, speed: 34},
      {offset: 0.32, amp: 0.09, phase: 6, speed: 50},
      {offset: 0.4, amp: 0.23, phase: 20, speed: 32},
      {offset: 0.47, amp: 0.11, phase: 12, speed: 46},
    ],
  },
  {
    lines: [
      {offset: 0.28, amp: 0.14, phase: 12, speed: 42},
      {offset: 0.35, amp: 0.18, phase: 4, speed: 36},
      {offset: 0.41, amp: 0.06, phase: 26, speed: 60},
      {offset: 0.48, amp: 0.16, phase: 18, speed: 38},
    ],
  },
  {
    lines: [
      {offset: 0.3, amp: 0.05, phase: 28, speed: 64},
      {offset: 0.36, amp: 0.2, phase: 10, speed: 34},
      {offset: 0.42, amp: 0.15, phase: 22, speed: 44},
    ],
  },
  {
    lines: [
      {offset: 0.26, amp: 0.18, phase: 8, speed: 36},
      {offset: 0.33, amp: 0.12, phase: 20, speed: 52},
      {offset: 0.39, amp: 0.24, phase: 14, speed: 32},
      {offset: 0.45, amp: 0.07, phase: 26, speed: 58},
    ],
  },
  {
    lines: [
      {offset: 0.29, amp: 0.09, phase: 4, speed: 56},
      {offset: 0.35, amp: 0.21, phase: 18, speed: 34},
      {offset: 0.41, amp: 0.13, phase: 30, speed: 40},
      {offset: 0.47, amp: 0.19, phase: 10, speed: 36},
    ],
  },
];

const meaningColorSets = [
  {word: "#f3effa", meaning: "rgba(230,220,245,0.9)", glow: "rgba(175,150,220,0.58)", shadow: "rgba(130,110,180,0.45)"},
  {word: "#e6f5ff", meaning: "rgba(210,235,250,0.9)", glow: "rgba(135,200,230,0.58)", shadow: "rgba(95,150,190,0.45)"},
  {word: "#e7f8f4", meaning: "rgba(210,240,232,0.9)", glow: "rgba(135,210,190,0.56)", shadow: "rgba(95,160,145,0.45)"},
  {word: "#f5f2e1", meaning: "rgba(235,225,195,0.9)", glow: "rgba(210,190,135,0.56)", shadow: "rgba(165,140,95,0.45)"},
  {word: "#f3f0ea", meaning: "rgba(230,220,210,0.9)", glow: "rgba(200,175,150,0.56)", shadow: "rgba(155,130,105,0.45)"},
  {word: "#eff4e8", meaning: "rgba(225,235,215,0.9)", glow: "rgba(180,200,150,0.56)", shadow: "rgba(135,150,110,0.45)"},
  {word: "#e9f1fb", meaning: "rgba(210,225,245,0.9)", glow: "rgba(150,175,215,0.56)", shadow: "rgba(110,135,170,0.45)"},
  {word: "#eef5ed", meaning: "rgba(220,235,220,0.9)", glow: "rgba(170,195,170,0.56)", shadow: "rgba(125,150,125,0.45)"},
  {word: "#eef2f5", meaning: "rgba(220,230,235,0.9)", glow: "rgba(165,185,195,0.56)", shadow: "rgba(120,140,150,0.45)"},
  {word: "#f2f0f6", meaning: "rgba(228,220,235,0.9)", glow: "rgba(180,165,200,0.56)", shadow: "rgba(135,120,155,0.45)"},
];

const totalFrames = 450;
const introFrames = 105;
const cloudFrames = 195;
const heroFrames = 150;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const ramp = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const sceneIn = (frame: number, delay = 0) =>
  spring({
    frame: frame - delay,
    fps: 30,
    config: {damping: 16, stiffness: 120, mass: 0.9},
  });

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pickIndex = (seed: number, key: string, length: number) =>
  hashString(`${seed}-${key}`) % length;

const shuffleWithSeed = (seed: number, items: number[], key: string) => {
  const shuffled = [...items];
  const rng = createRng(hashString(`${seed}-${key}`));
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getProgressValue = (frame: number) => {
  const boundedFrame = clamp(frame, 0, totalFrames - 1);
  const accelFrames = 120;
  const steadyFrames = totalFrames - accelFrames;
  const steadyTarget = 68;

  if (boundedFrame <= steadyFrames) {
    return ramp(boundedFrame, [0, steadyFrames], [0, steadyTarget]);
  }

  const accelProgress = ramp(boundedFrame, [steadyFrames, totalFrames - 1], [0, 1]);
  const easedAccel = Math.pow(accelProgress, 2.2);
  return interpolate(easedAccel, [0, 1], [steadyTarget, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const ProgressBar: React.FC<{frame: number}> = ({frame}) => {
  const {width, height} = useVideoConfig();
  const progress = Math.round(getProgressValue(frame));
  const barHeight = Math.round(height * 0.09);
  const fontSize = Math.round(height * 0.055);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: barHeight,
        background: "#d9d9d9",
        color: "#252525",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${progress}%`,
          background: "rgba(32,32,32,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: bodyFont,
          fontWeight: 800,
          fontSize,
        }}
      >
        {`Nạp từ vào trí nhớ: ${progress}%`}
      </div>
    </div>
  );
};

const IntroField: React.FC<{word: string; frame: number}> = ({word, frame}) => {
  const {width, height} = useVideoConfig();
  const reveal = sceneIn(frame);
  const zoom = ramp(frame, [0, introFrames], [1.34, 1]);
  const blur = ramp(frame, [0, 18, 50, 95], [16, 10, 3, 0]);
  const fade = ramp(frame, [0, introFrames - 10], [1, 0]);
  const spin = ramp(frame, [58, 82, 104], [0, 180, 260]);
  const spiralScale = ramp(frame, [58, 82, 104], [1, 1.8, 2.6]);
  const questionPop = sceneIn(frame, 8);
  const dropStart = 30;
  const dropEnd = 45;
  const settleEnd = 60;
  const dropY = ramp(frame, [dropStart, dropEnd, settleEnd], [-28, 8, 0]);
  const wobble = Math.sin((frame - settleEnd) / 4) * 2 * ramp(frame, [settleEnd, settleEnd + 20], [1, 0]);
  const titleWidth = width * 0.24;
  const titleZoom = ramp(frame, [0, 6, 14, 24, 36], [0.72, 1.28, 0.9, 1.12, 1]);
  const titlePunch = sceneIn(frame, 2);

  const articleLines = [
    `Advancements in technology are playing a growing role in ${word}.`,
    `The article examines how digital systems improve response capacity.`,
    `Continuity during crises depends on adaptation and quick recovery.`,
    `${word} becomes critical when pressure tests the whole system.`,
  ];

  return (
    <AbsoluteFill
      style={{
        opacity: fade,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.98), rgba(242,239,231,0.98) 58%, rgba(217,212,202,0.94) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom}) rotate(${spin * 0.08}deg)`,
          filter: `blur(${blur}px)`,
          opacity: 0.92,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)",
            backgroundSize: `${Math.round(width * 0.05)}px ${Math.round(width * 0.05)}px`,
            opacity: 0.26,
          }}
        />
        {articleLines.map((line, index) => (
          <div
            key={line}
            style={{
              position: "absolute",
              left: width * 0.06,
              right: width * 0.06,
              top: height * (0.05 + index * 0.18),
              fontFamily: bodyFont,
              fontWeight: 700,
              fontSize: Math.round(height * 0.12),
              lineHeight: 1.08,
              color: "rgba(0,0,0,0.38)",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${0.86 + reveal * 0.14}) rotate(${spin}deg) scale(${spiralScale})`,
          width: width * 0.44,
          height: width * 0.44,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.18), rgba(255,255,255,0.03) 58%, rgba(0,0,0,0) 68%)",
          opacity: ramp(frame, [54, 82, 104], [0, 0.95, 0]),
          filter: `blur(${Math.round(width * 0.018)}px)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          display: "flex",
          alignItems: "center",
          gap: width * 0.015,
          transform: `translate(-50%, -50%) translateY(${(1 - reveal) * 26}px) scale(${(0.9 + reveal * 0.1) * titleZoom * (0.92 + titlePunch * 0.08)})`,
        }}
      >
        <div
          style={{
            minWidth: titleWidth,
            padding: `${Math.round(height * 0.025)}px ${Math.round(width * 0.03)}px`,
            background: "#f3e54a",
            color: "#121212",
            fontFamily: displayFont,
            fontSize: Math.round(height * 0.1),
            lineHeight: 1,
            textAlign: "center",
            boxShadow: "0 18px 36px rgba(0,0,0,0.16)",
          }}
        >
          {word}
        </div>
        <div
          style={{
            color: "#ff2b2b",
            fontFamily: displayFont,
            fontSize: Math.round(height * 0.14),
            lineHeight: 1,
            textShadow: "0 10px 28px rgba(255,0,0,0.25)",
            transform: `translateY(${dropY + wobble}px) scale(${0.72 + questionPop * 0.28}) rotate(${12 - questionPop * 6 + wobble * 1.5}deg)`,
          }}
        >
          ?
        </div>
      </div>
    </AbsoluteFill>
  );
};

const wavePath = (width: number, height: number, offsetY: number, amp: number) => {
  const startY = height * offsetY;
  const c1y = startY - amp;
  const c2y = startY + amp;
  const endY = startY - amp * 0.1;

  return `M 0 ${startY} C ${width * 0.18} ${c1y}, ${width * 0.34} ${c2y}, ${width * 0.52} ${startY} S ${width * 0.82} ${c1y}, ${width} ${endY}`;
};

const CloudScene: React.FC<{
  frame: number;
  word: string;
  otherMeanings: OtherMeaningItem[];
  backgroundImages: string[];
  renderSeed: number;
}> = ({
  frame,
  word,
  otherMeanings,
  backgroundImages,
  renderSeed,
}) => {
  const {width, height} = useVideoConfig();
  const maxItems = 9;
  const trimmedMeanings = otherMeanings.slice(0, maxItems);
  const meaningKey = (entry: OtherMeaningItem) =>
    `${entry.word}|${entry.phonetic}|${entry.meaning}`;
  const meaningKeyList = trimmedMeanings.map(meaningKey);
  const hasImageBackgrounds = backgroundImages.length > 0;
  const backgroundSelectIndex = pickIndex(
    renderSeed,
    `bg-select-${word}-${meaningKeyList.join("|")}`,
    backgroundColorSets.length + (hasImageBackgrounds ? backgroundImages.length : 0),
  );
  const imageBackground =
    hasImageBackgrounds && backgroundSelectIndex >= backgroundColorSets.length
      ? backgroundImages[backgroundSelectIndex - backgroundColorSets.length]
      : null;
  const colorSet = backgroundColorSets[
    pickIndex(renderSeed, `bg-${word}-${meaningKeyList.join("|")}`, backgroundColorSets.length)
  ];
  const variant = backgroundVariants[
    pickIndex(renderSeed, `variant-${word}-${meaningKeyList.join("|")}`, backgroundVariants.length)
  ];
  const waveVariant = waveVariants[
    pickIndex(renderSeed, `wave-${word}-${meaningKeyList.join("|")}`, waveVariants.length)
  ];
  const meaningPalette = meaningColorSets[
    pickIndex(renderSeed, `meaning-${word}-${meaningKeyList.join("|")}`, meaningColorSets.length)
  ];
  const reveal = sceneIn(frame);
  const count = trimmedMeanings.length;
  const wordFont = Math.round(width * 0.034);
  const phoneticFont = Math.round(width * 0.018);
  const meaningFont = Math.round(width * 0.022);
  const textWidth = width * 0.24;
  const gridPadding = 40;
  const progressBarHeight = Math.round(height * 0.09);
  const bounds = {
    left: gridPadding,
    right: width - gridPadding,
    top: gridPadding,
    bottom: height - gridPadding - progressBarHeight,
  };
  const pickLayout = () => {
    const layoutMap: Record<number, {columns: number; rows: number; placements: number[]}> = {
      0: {columns: 3, rows: 3, placements: []},
      1: {columns: 3, rows: 3, placements: [4]},
      2: {columns: 2, rows: 1, placements: [0, 1]},
      3: {columns: 3, rows: 3, placements: [3, 4, 5]},
      4: {columns: 2, rows: 2, placements: [0, 1, 2, 3]},
      5: {columns: 3, rows: 3, placements: [0, 2, 4, 6, 8]},
      6: {columns: 3, rows: 2, placements: [0, 1, 2, 3, 4, 5]},
      7: {columns: 3, rows: 3, placements: [0, 2, 3, 4, 5, 6, 8]},
      8: {columns: 3, rows: 3, placements: [0, 1, 2, 3, 4, 5, 6, 8]},
      9: {columns: 3, rows: 3, placements: [0, 1, 2, 3, 4, 5, 6, 7, 8]},
    };

    return layoutMap[count] ?? layoutMap[9];
  };

  const layout = pickLayout();
  const columns = layout.columns;
  const rows = layout.rows;
  const cellWidth = (bounds.right - bounds.left) / columns;
  const cellHeight = (bounds.bottom - bounds.top) / rows;
  const placementOrder = shuffleWithSeed(
    renderSeed,
    layout.placements,
    `cells-${word}-${meaningKeyList.join("|")}`,
  );

  const swaySeeds = trimmedMeanings.map((meaning, index) => {
    const seed = hashString(`${renderSeed}-sway-${meaningKey(meaning)}-${index}`);
    return (seed / 4294967296) * Math.PI * 2;
  });
  const jitteredPositions = trimmedMeanings.map((_, index) => {
    const cellIndex = placementOrder[index] ?? 4;
    const row = Math.floor(cellIndex / columns);
    const col = cellIndex % columns;
    const cellLeft = bounds.left + col * cellWidth;
    const cellTop = bounds.top + row * cellHeight;
    const x = cellLeft + cellWidth / 2;
    const y = cellTop + cellHeight / 2;
    return {left: x, top: y};
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: imageBackground
          ? "#000"
          : `radial-gradient(circle at 50% 50%, ${colorSet.core}, ${colorSet.mid} 58%, ${colorSet.deep} 100%)`,
      }}
    >
      {imageBackground ? (
        <Img
          src={staticFile(imageBackground)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.92,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.95,
          background: variant.overlay,
        }}
      />

      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.86,
        }}
      >
        {waveVariant.lines.map((line, index) => {
          const isPrimary = index === Math.floor(waveVariant.lines.length / 2);
          return (
            <path
              key={`${line.offset}-${line.amp}-${index}`}
              d={wavePath(
                width,
                height,
                line.offset + Math.sin((frame + line.phase) / line.speed) * 0.01,
                height * line.amp,
              )}
              fill="none"
              stroke={isPrimary ? variant.wavePrimary : variant.waveSecondary}
              strokeWidth={isPrimary ? 2.4 : 1.6}
              style={{
                filter: `drop-shadow(0 0 10px ${variant.waveShadow})`,
              }}
            />
          );
        })}
      </svg>

      {trimmedMeanings.map((meaning, index) => {
        const entryKey = meaningKey(meaning);
        const position = jitteredPositions[index];
        const appearDelay = 10 * index;
        const opacity = ramp(frame - appearDelay, [0, 20, 50], [0, 0.7, 1]);
        const scale = ramp(frame - appearDelay, [0, 24, 56], [0.7, 1.05, 1]);
        const swayStrength = ramp(frame - appearDelay, [60, 90], [0, 1]);
        const sway = Math.sin((frame - appearDelay) / 20 + swaySeeds[index]) * 3 * swayStrength;

        return (
          <div
            key={`${entryKey}-${index}`}
            style={{
              position: "absolute",
              left: position.left - textWidth * 0.5,
              top: position.top - height * 0.035,
              width: textWidth,
              opacity: opacity * reveal,
              textAlign: "center",
              transform: `translateY(${sway}px) scale(${scale})`,
            }}
          >
            <div
              style={{
                background: "rgba(8,8,10,0.58)",
                borderRadius: Math.round(width * 0.016),
                padding: `${Math.round(height * 0.012)}px ${Math.round(width * 0.012)}px`,
                boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                display: "inline-block",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                fontFamily: bodyFont,
                fontSize: wordFont,
                fontWeight: 700,
                color: meaningPalette.word,
                textShadow:
                  `0 0 10px ${meaningPalette.glow}, 0 0 22px ${meaningPalette.shadow}`,
                lineHeight: 1.05,
                }}
              >
                {meaning.word}
              </div>
              <div
                style={{
                  marginTop: height * 0.008,
                  fontFamily: bodyFont,
                  fontSize: phoneticFont,
                  fontStyle: "italic",
                  fontWeight: 600,
                  color: meaningPalette.meaning,
                  lineHeight: 1.1,
                }}
              >
                {meaning.phonetic}
              </div>
              <div
                style={{
                  marginTop: height * 0.008,
                  fontFamily: bodyFont,
                  fontSize: meaningFont,
                  color: meaningPalette.meaning,
                  lineHeight: 1.1,
                }}
              >
                {meaning.meaning}
              </div>
            </div>
          </div>
        );
      })}

      <ProgressBar frame={introFrames + frame} />
    </AbsoluteFill>
  );
};

const GlowWord: React.FC<{word: string; frame: number}> = ({word, frame}) => {
  const {width, height} = useVideoConfig();
  const glowColors = ["#56f6f5", "#5e62ff", "#a366ff", "#ff65d4", "#ffd57d", "#5ff1be"];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        textAlign: "center",
      }}
    >
      {glowColors.map((color, index) => {
        const left = 0.26 + index * 0.08;
        const wobble = Math.sin(frame / 12 + index) * 3;

        return (
          <div
            key={color}
            style={{
              position: "absolute",
              left: `${left * 100}%`,
              top: height * 0.005 + wobble,
              width: width * 0.09,
              height: height * 0.055,
              borderRadius: 999,
              background: color,
              opacity: 0.92,
              filter: `blur(${Math.round(height * 0.018)}px)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "relative",
          color: "#f5f5f5",
          fontFamily: displayFont,
          fontSize: Math.round(height * 0.165),
          lineHeight: 1,
          letterSpacing: -2,
          WebkitTextStroke: `${Math.max(2, Math.round(height * 0.004))}px #141414`,
          textShadow:
            "-3px 0 0 rgba(102,245,255,0.8), 3px 0 0 rgba(255,113,213,0.72), 0 4px 0 rgba(102,111,255,0.9)",
        }}
      >
        {word}
      </div>
    </div>
  );
};

const HeroScene: React.FC<{item: WordProps; frame: number}> = ({item, frame}) => {
  const {width, height} = useVideoConfig();
  const reveal = sceneIn(frame);
  const exampleReveal = sceneIn(frame, 24);
  const viReveal = sceneIn(frame, 36);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 10%, rgba(16,16,16,0.45), rgba(0,0,0,1) 28%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width * 0.07,
          right: width * 0.07,
          top: height * 0.1,
          textAlign: "center",
          transform: `translateY(${(1 - reveal) * 16}px)`,
          opacity: reveal,
        }}
      >
        <GlowWord word={item.word} frame={frame} />
        <div
          style={{
            marginTop: height * 0.018,
          color: "#f1cd29",
          fontFamily: bodyFont,
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: Math.round(height * 0.073),
          }}
        >
          {item.phonetic}
        </div>
        <div
          style={{
            marginTop: height * 0.026,
          color: "#ffd31b",
          fontFamily: bodyFont,
          fontWeight: 800,
          fontSize: Math.round(height * 0.072),
          lineHeight: 1.14,
          maxWidth: width * 0.88,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {item.meaning}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: width * 0.07,
          right: width * 0.07,
          top: height * 0.6,
          textAlign: "left",
          opacity: exampleReveal,
          transform: `translateY(${(1 - exampleReveal) * 18}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: `${Math.round(height * 0.012)}px ${Math.round(width * 0.02)}px`,
            background: "#ffd51f",
            color: "#141414",
            borderRadius: Math.round(height * 0.012),
            fontFamily: bodyFont,
            fontWeight: 800,
            fontSize: Math.round(height * 0.058),
          }}
        >
          Ví dụ
        </div>
        <div
          style={{
            marginTop: height * 0.028,
            color: "#f7f7f7",
            fontFamily: bodyFont,
            fontWeight: 800,
            fontSize: Math.round(height * 0.06),
            lineHeight: 1.12,
            textAlign: "center",
            maxWidth: width * 0.86,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {item.exampleEn}
        </div>
        <div
          style={{
            marginTop: height * 0.024,
            color: "#24ff4b",
            fontFamily: bodyFont,
            fontWeight: 800,
            fontSize: Math.round(height * 0.052),
            lineHeight: 1.12,
            textAlign: "center",
            opacity: viReveal,
            transform: `translateY(${(1 - viReveal) * 12}px)`,
            maxWidth: width * 0.9,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {item.exampleVi}
        </div>
      </div>

      <ProgressBar frame={introFrames + cloudFrames + frame} />
    </AbsoluteFill>
  );
};

export const Word: React.FC<WordProps> = (item) => {
  const frame = useCurrentFrame();
  const boundedFrame = clamp(frame, 0, totalFrames - 1);
  const otherMeaningKey = (entry: OtherMeaningItem) =>
    `${entry.word}|${entry.phonetic}|${entry.meaning}`;
  const otherMeanings = item.other_meaning ?? [];
  const backgroundImages = item.backgroundImages ?? [];
  const renderSeed =
    item.renderSeed ??
    hashString(
      `${item.word}|${item.phonetic}|${item.meaning}|${item.exampleEn}|${item.exampleVi}|${otherMeanings.map(otherMeaningKey).join("|")}|${backgroundImages.join("|")}`,
    );

  const introOpacity = ramp(boundedFrame, [0, introFrames - 12, introFrames + 8], [1, 1, 0]);
  const cloudStart = introFrames - 8;
  const heroStart = introFrames + cloudFrames - 18;
  const cloudOpacity = ramp(boundedFrame, [cloudStart, cloudStart + 10, heroStart - 8, heroStart + 12], [0, 1, 1, 0]);
  const heroOpacity = ramp(boundedFrame, [heroStart, heroStart + 10], [0, 1]);

  return (
    <AbsoluteFill style={{backgroundColor: "#000", overflow: "hidden"}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: introOpacity,
        }}
      >
        <IntroField word={item.word} frame={boundedFrame} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: cloudOpacity,
        }}
      >
        <CloudScene
          frame={Math.max(0, boundedFrame - cloudStart)}
          word={item.word}
          otherMeanings={otherMeanings}
          backgroundImages={backgroundImages}
          renderSeed={renderSeed}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: heroOpacity,
        }}
      >
        <HeroScene item={item} frame={Math.max(0, boundedFrame - heroStart)} />
      </div>
    </AbsoluteFill>
  );
};
