import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import type { Orientation } from "../MainVideo";

interface SceneProps {
  src: string;
  zoomFrom: number;
  zoomTo: number;
  panX: number; // percent
  panY: number; // percent
  duration: number;
  overlap: number;
  orientation: Orientation;
}

export const Scene: React.FC<SceneProps> = ({
  src,
  zoomFrom,
  zoomTo,
  panX,
  panY,
  duration,
  overlap,
}) => {
  const frame = useCurrentFrame();

  // crossfade in/out
  const opacity = interpolate(
    frame,
    [0, overlap, duration - overlap, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ken-burns zoom
  const scale = interpolate(frame, [0, duration], [zoomFrom, zoomTo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tx = interpolate(frame, [0, duration], [0, panX], { extrapolateRight: "clamp" });
  const ty = interpolate(frame, [0, duration], [0, panY], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </AbsoluteFill>
      {/* subtle dark overlay for cinematic depth */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
