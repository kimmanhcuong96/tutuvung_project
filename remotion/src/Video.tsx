import React from "react";
import {AbsoluteFill, Audio} from "remotion";
import {Word, WordProps} from "./Word";

export type VideoProps = WordProps & {
  audioStaticPath?: string | null;
};

export const Video: React.FC<VideoProps> = ({audioStaticPath, ...wordProps}) => {
  return (
    <AbsoluteFill style={{backgroundColor: "#040404"}}>
      {audioStaticPath ? <Audio src={audioStaticPath} /> : null}
      <Word {...wordProps} />
    </AbsoluteFill>
  );
};
