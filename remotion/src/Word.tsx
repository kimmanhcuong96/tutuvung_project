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
const bodyFont = '"Segoe UI", Arial, sans-serif';

const totalFrames = 450;
const introFrames = 105;
const cloudFrames = 225;
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
  const titleWidth = width * 0.24;

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
          transform: `translate(-50%, -50%) translateY(${(1 - reveal) * 26}px) scale(${0.92 + reveal * 0.08})`,
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
            transform: `scale(${0.72 + questionPop * 0.28}) rotate(${12 - questionPop * 6}deg)`,
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

const cloudWords = [
  {text: "SCIENCE", x: 0.18, y: 0.34, size: 0.064},
  {text: "MENTAL", x: 0.11, y: 0.24, size: 0.05},
  {text: "SPORT", x: 0.34, y: 0.28, size: 0.053},
  {text: "WELLNESS", x: 0.25, y: 0.56, size: 0.062},
  {text: "POWER", x: 0.22, y: 0.67, size: 0.045},
  {text: "SELF-CARE", x: 0.52, y: 0.22, size: 0.044},
  {text: "BALANCE", x: 0.77, y: 0.13, size: 0.057},
  {text: "LIFESTYLE", x: 0.83, y: 0.43, size: 0.051},
  {text: "STRENGTH", x: 0.83, y: 0.56, size: 0.05},
  {text: "HAPPINESS", x: 0.73, y: 0.26, size: 0.04},
  {text: "VITALITY", x: 0.62, y: 0.19, size: 0.041},
  {text: "ENERGY", x: 0.6, y: 0.62, size: 0.041},
  {text: "RELAXATION", x: 0.77, y: 0.9, size: 0.043},
  {text: "TRAINING", x: 0.5, y: 0.46, size: 0.04},
  {text: "POWER", x: 0.56, y: 0.59, size: 0.048},
  {text: "SPORT", x: 0.63, y: 0.35, size: 0.038},
  {text: "WELLNESS", x: 0.43, y: 0.18, size: 0.044},
  {text: "SELF-CARE", x: 0.54, y: 0.76, size: 0.049},
  {text: "MENTAL", x: 0.89, y: 0.78, size: 0.046},
  {text: "SCIENCE", x: 0.96, y: 0.14, size: 0.036},
];

const CloudScene: React.FC<{frame: number}> = ({frame}) => {
  const {width, height} = useVideoConfig();
  const reveal = sceneIn(frame);
  const clusterOpacity = ramp(frame, [0, 30, 80], [1, 1, 0]);
  const disperse = ramp(frame, [0, 90], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(34,14,62,0.72), rgba(12,3,28,1) 58%, rgba(6,0,18,1) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.95,
          background:
            "radial-gradient(circle at 50% 50%, rgba(82,28,140,0.12), rgba(0,0,0,0) 64%)",
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
        {[0.34, 0.36, 0.39].map((offset, index) => (
          <path
            key={offset}
            d={wavePath(width, height, offset + Math.sin((frame + index * 8) / 40) * 0.01, height * (0.13 + index * 0.03))}
            fill="none"
            stroke={index === 1 ? "rgba(222,111,255,0.52)" : "rgba(171,108,255,0.28)"}
            strokeWidth={index === 1 ? 2.4 : 1.6}
            style={{
              filter: "drop-shadow(0 0 10px rgba(203,111,255,0.55))",
            }}
          />
        ))}
      </svg>

      {cloudWords.map((item, index) => {
        const driftX = Math.sin(frame / 30 + index * 0.9) * width * 0.01;
        const driftY = Math.cos(frame / 35 + index * 0.7) * height * 0.012;
        const fontSize = Math.round(width * item.size);
        const opacity = 0.48 + ((index % 4) / 12);

        return (
          <div
            key={`${item.text}-${index}`}
            style={{
              position: "absolute",
              left: item.x * width + driftX - fontSize * 0.5,
              top: item.y * height + driftY - fontSize * 0.5,
              color: "#ffe9ff",
              fontFamily: displayFont,
              fontSize,
              lineHeight: 1,
              opacity: opacity * reveal,
              textShadow:
                "0 0 10px rgba(255,126,255,0.56), 0 0 22px rgba(180,76,255,0.36)",
              transform: `scale(${0.96 + Math.sin(frame / 18 + index) * 0.03})`,
            }}
          >
            {item.text}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: width * 0.12,
          top: height * 0.16,
          opacity: clusterOpacity,
          transform: `translate(${(1 - disperse) * width * 0.18}px, ${(1 - disperse) * -height * 0.06}px) scale(${1.1 - disperse * 0.1})`,
          filter: `blur(${(1 - disperse) * 2.4}px)`,
        }}
      >
        {["ENERGY", "POWER", "MIND", "TRAINING", "SELF-CARE"].map((label, index) => (
          <div
            key={label}
            style={{
              position: "absolute",
              left: (index % 2) * width * 0.06,
              top: index * height * 0.042,
              color: "#fff8ff",
              fontFamily: displayFont,
              fontSize: Math.round(width * (index === 1 ? 0.082 : 0.066)),
              lineHeight: 1,
              textShadow:
                "0 0 12px rgba(255,128,255,0.66), 0 0 28px rgba(194,86,255,0.4)",
            }}
          >
            {label}
          </div>
        ))}
      </div>

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
          Vi du
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
        <CloudScene frame={Math.max(0, boundedFrame - cloudStart)} />
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
