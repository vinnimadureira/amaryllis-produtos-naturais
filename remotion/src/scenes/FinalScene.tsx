import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { FONTS, type Orientation } from "../MainVideo";

interface FinalSceneProps {
  orientation: Orientation;
  duration: number;
  overlap: number;
}

export const FinalScene: React.FC<FinalSceneProps> = ({ orientation, duration, overlap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // crossfade in, hold, soft fade out at very end for loop
  const opacity = interpolate(
    frame,
    [0, overlap, duration - 18, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // gentle ken-burns zoom-out
  const scale = interpolate(frame, [0, duration], [1.1, 1.0], { extrapolateRight: "clamp" });

  // logo reveal (delayed)
  const logoIn = spring({ frame: frame - 24, fps, config: { damping: 200, stiffness: 80 } });
  const logoOpacity = interpolate(logoIn, [0, 1], [0, 1]);
  const logoY = interpolate(logoIn, [0, 1], [20, 0]);

  // title reveal
  const titleIn = spring({ frame: frame - 14, fps, config: { damping: 200, stiffness: 70 } });
  const titleOpacity = interpolate(titleIn, [0, 1], [0, 1]);
  const titleY = interpolate(titleIn, [0, 1], [30, 0]);

  // tagline reveal
  const taglineIn = spring({ frame: frame - 38, fps, config: { damping: 200, stiffness: 80 } });
  const taglineOpacity = interpolate(taglineIn, [0, 1], [0, 1]);

  const isPortrait = orientation === "portrait";

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile("images/05-final.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </AbsoluteFill>

      {/* darken edges for text legibility */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* logo block (bottom-center) */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: isPortrait ? 180 : 90,
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: isPortrait ? 24 : 16,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: isPortrait ? 22 : 18,
              letterSpacing: "0.4em",
              color: "#e85d3a",
              textTransform: "uppercase",
              fontWeight: 600,
              opacity: taglineOpacity,
            }}
          >
            Massa de pizza · Em formato de cone
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: isPortrait ? 140 : 120,
              color: "#f5f0e8",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              opacity: logoOpacity,
              transform: `translateY(${logoY}px)`,
              textShadow: "0 4px 30px rgba(0,0,0,0.6)",
            }}
          >
            Mr. Cone
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
