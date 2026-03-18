import React from "react";
import {AbsoluteFill, Video, staticFile} from "remotion";

export const ReferenceVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "black"}}>
      <Video
        src={staticFile("reference_snaptik.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </AbsoluteFill>
  );
};

