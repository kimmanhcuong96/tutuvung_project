import React from "react";
import {Composition, getInputProps, registerRoot} from "remotion";
import {Video, VideoProps} from "./Video";

const defaultProps: VideoProps = {
  word: "abandon",
  phonetic: "/uh-BAN-duhn/",
  meaning: "v. tu bo, roi bo",
  exampleEn: "He had to abandon the plan at the last minute.",
  exampleVi: "Anh ay da phai tu bo ke hoach vao phut cuoi.",
  audioStaticPath: null,
};

const inputProps = getInputProps() as Partial<VideoProps>;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VocabWord"
      component={Video}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={270}
      defaultProps={{...defaultProps, ...inputProps}}
    />
  );
};

registerRoot(RemotionRoot);
