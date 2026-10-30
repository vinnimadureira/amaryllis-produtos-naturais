import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 9s @ 30fps = 270 frames
const FPS = 30;
const DURATION = 270;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="hero-desktop"
        component={MainVideo}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ orientation: "landscape" as const }}
      />
      <Composition
        id="hero-mobile"
        component={MainVideo}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ orientation: "portrait" as const }}
      />
    </>
  );
};
