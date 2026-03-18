import React from "react";
import {Composition, getInputProps, registerRoot} from "remotion";
import {Video, VideoProps} from "./Video";
import {ReferenceVideo} from "./reference/ReferenceVideo";

const defaultProps: VideoProps = {
  word: "resilience",
  phonetic: "/ri'zlians/",
  meaning: "n. kha nang phuc hoi, su kien cuong, suc bat",
  exampleEn: "Failure tests our resilience.",
  exampleVi: "That bai thu thach su kien cuong cua chung ta.",
  audioStaticPath: null,
};

const inputProps = getInputProps() as Partial<VideoProps>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VocabWord"
        component={Video}
        // Match the reference video dimensions (snaptik_7589639012420177172_v3.mp4).
        width={1024}
        height={576}
        fps={30}
        durationInFrames={450}
        defaultProps={{...defaultProps, ...inputProps}}
      />
      <Composition
        id="ReferenceSnaptik"
        component={ReferenceVideo}
        width={1024}
        height={576}
        fps={30}
        durationInFrames={450}
      />
    </>
  );
};

registerRoot(RemotionRoot);
