import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type WordProps = {
  word: string;
  phonetic: string;
  meaning: string;
  exampleEn: string;
  exampleVi: string;
};

const displayFont = '"Arial Black", "Segoe UI Black", Impact, sans-serif';
const bodyFont = '"Segoe UI", Tahoma, Arial, sans-serif';

const introFrames = 48;
const wallFrames = 82;
const heroFrames = 140;
const totalFrames = introFrames + wallFrames + heroFrames;

const ramp = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const softShadow = "0 16px 34px rgba(0,0,0,0.24)";

const IntroField: React.FC<{word: string; frame: number}> = ({word, frame}) => {
  const zoom = ramp(frame, [0, introFrames], [1.28, 1]);
  const blur = ramp(frame, [0, 14, introFrames], [16, 6, 0]);
  const rise = ramp(frame, [0, introFrames], [80, 0]);
  const questionPop = spring({
    frame: frame - 6,
    fps: 30,
    config: {damping: 11, stiffness: 180},
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 28%, rgba(255,255,255,0.98), rgba(241,239,233,0.96) 55%, rgba(220,216,205,0.92) 100%)",
        overflow: "hidden",
        transform: `scale(${zoom})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: 0.34,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -120,
          color: "rgba(0,0,0,0.15)",
          filter: `blur(${blur + 4}px)`,
          fontFamily: bodyFont,
          fontSize: 88,
          lineHeight: 1.12,
          fontWeight: 700,
        }}
      >
        <div style={{paddingTop: 60, paddingLeft: 36, width: 1080}}>
          Understanding {word} in context makes the definition feel natural.
        </div>
        <div style={{paddingTop: 860, paddingLeft: 90, width: 960}}>
          Repetition, pronunciation, and usage work together to lock it in.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 94,
          right: 94,
          top: 760 + rise,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          filter: `blur(${blur}px)`,
        }}
      >
        <div
          style={{
            padding: "22px 34px 18px",
            background: "#ffe84d",
            color: "#121212",
            borderRadius: 4,
            fontFamily: displayFont,
            fontSize: 82,
            lineHeight: 1,
            boxShadow: softShadow,
          }}
        >
          {word}
        </div>
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 110,
            lineHeight: 1,
            color: "#ef3f3f",
            transform: `scale(${0.76 + questionPop * 0.28}) rotate(${12 - questionPop * 8}deg)`,
            textShadow: "0 10px 26px rgba(239,63,63,0.28)",
          }}
        >
          ?
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WallEcho: React.FC<{
  item: WordProps;
  left: number;
  top: number;
  scale: number;
  frame: number;
  index: number;
}> = ({item, left, top, scale, frame, index}) => {
  const drift = Math.sin(frame / 15 + index) * 7;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: top + drift,
        width: 250,
        transform: `scale(${scale})`,
        textAlign: "center",
        color: "#fff",
        opacity: 0.98,
      }}
    >
      <div
        style={{
          fontFamily: displayFont,
          fontSize: 32,
          lineHeight: 1,
        }}
      >
        {item.word}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: bodyFont,
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: 20,
          lineHeight: 1.1,
        }}
      >
        {item.phonetic}
      </div>
      <div
        style={{
          marginTop: 2,
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 20,
          lineHeight: 1.1,
        }}
      >
        {item.meaning}
      </div>
    </div>
  );
};

const WallScene: React.FC<{item: WordProps; frame: number}> = ({item, frame}) => {
  const opacity = ramp(frame, [0, 12], [0, 1]);
  const centerScale = spring({
    frame,
    fps: 30,
    config: {damping: 13, stiffness: 120},
  });

  const echoes = [
    [18, 54, 0.92],
    [384, 56, 0.84],
    [770, 50, 0.9],
    [10, 284, 0.96],
    [322, 356, 0.82],
    [780, 292, 0.88],
    [6, 582, 0.94],
    [336, 706, 0.82],
    [782, 628, 0.88],
    [18, 940, 0.94],
    [384, 1058, 0.86],
    [770, 972, 0.92],
  ];

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 46%, rgba(24,27,34,0.88), rgba(0,0,0,1) 58%)",
        opacity,
        overflow: "hidden",
      }}
    >
      {echoes.map(([left, top, scale], index) => (
        <WallEcho
          key={`${left}-${top}`}
          item={item}
          left={left}
          top={top}
          scale={scale}
          frame={frame}
          index={index}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 780,
          textAlign: "center",
          transform: `scale(${0.86 + centerScale * 0.14})`,
        }}
      >
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 100,
            lineHeight: 0.94,
            color: "#f5cf24",
          }}
        >
          {item.word}
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: bodyFont,
            fontStyle: "italic",
            fontSize: 48,
            lineHeight: 1.06,
            fontWeight: 700,
            color: "#f5cf24",
          }}
        >
          {item.phonetic}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: bodyFont,
            fontSize: 52,
            lineHeight: 1.08,
            fontWeight: 700,
            color: "#f5cf24",
          }}
        >
          {item.meaning}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 102,
          background: "#e5e5e5",
        }}
      />
    </AbsoluteFill>
  );
};

const HeroScene: React.FC<{item: WordProps; frame: number}> = ({item, frame}) => {
  const heroReveal = spring({
    frame,
    fps: 30,
    config: {damping: 14, stiffness: 110},
  });
  const exampleReveal = spring({
    frame: frame - 10,
    fps: 30,
    config: {damping: 15, stiffness: 100},
  });
  const footerReveal = spring({
    frame: frame - 24,
    fps: 30,
    config: {damping: 18, stiffness: 90},
  });
  const shimmer = Math.sin(frame / 8) * 18;
  const progress = Math.round(ramp(frame + introFrames + wallFrames, [0, totalFrames], [10, 100]));

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 14%, rgba(30,33,42,0.9), rgba(3,3,3,1) 40%)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 138 + shimmer * 0.18,
          top: 142,
          width: 800,
          height: 116,
          filter: "blur(28px)",
          opacity: 0.78,
          background:
            "linear-gradient(90deg, rgba(82,238,228,0.75), rgba(255,111,204,0.75), rgba(82,238,228,0.75))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 120,
          textAlign: "center",
          transform: `translateY(${32 - heroReveal * 32}px)`,
        }}
      >
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 122,
            lineHeight: 0.9,
            color: "#fff",
            WebkitTextStroke: "2px rgba(20,20,20,0.78)",
            textShadow:
              "-4px 0 0 rgba(82,238,228,0.75), 4px 0 0 rgba(119,97,255,0.75), 0 16px 34px rgba(0,0,0,0.42)",
          }}
        >
          {item.word}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: bodyFont,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 46,
            color: "#f5cf24",
          }}
        >
          {item.phonetic}
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: bodyFont,
            fontWeight: 700,
            fontSize: 58,
            color: "#f5cf24",
          }}
        >
          {item.meaning}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 48,
          right: 48,
          top: 1010,
          opacity: exampleReveal,
          transform: `translateY(${38 - exampleReveal * 38}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 120,
            height: 66,
            padding: "0 22px",
            borderRadius: 18,
            background: "#f5cf24",
            color: "#151515",
            fontFamily: bodyFont,
            fontWeight: 800,
            fontSize: 30,
          }}
        >
          Ví dụ:
        </div>
        <div
          style={{
            marginTop: 26,
            padding: "0 12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: bodyFont,
              fontSize: 42,
              lineHeight: 1.26,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {item.exampleEn}
          </div>
          <div
            style={{
              marginTop: 22,
              fontFamily: bodyFont,
              fontSize: 44,
              lineHeight: 1.26,
              fontWeight: 800,
              color: "#37ef4f",
            }}
          >
            {item.exampleVi}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 102,
          background: "#e5e5e5",
          opacity: footerReveal,
          transform: `translateY(${16 - footerReveal * 16}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress}%`,
            background: "rgba(40,40,40,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 28,
            fontFamily: bodyFont,
            fontWeight: 800,
            fontSize: 34,
            color: "#1a1a1a",
          }}
        >
          Nạp từ vào trí nhớ: {progress}%
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Word: React.FC<WordProps> = (item) => {
  const frame = useCurrentFrame();

  const introOpacity = ramp(frame, [0, introFrames - 8], [1, 0]);
  const wallStart = introFrames - 8;
  const heroStart = introFrames + wallFrames - 16;

  return (
    <AbsoluteFill style={{backgroundColor: "#050505", overflow: "hidden"}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: introOpacity,
        }}
      >
        <IntroField word={item.word} frame={frame} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: ramp(frame, [wallStart, wallStart + 8], [0, 1]),
        }}
      >
        <WallScene item={item} frame={frame - wallStart} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: ramp(frame, [heroStart, heroStart + 8], [0, 1]),
        }}
      >
        <HeroScene item={item} frame={frame - heroStart} />
      </div>
    </AbsoluteFill>
  );
};
