import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Scene } from "./scenes/Scene";
import { FinalScene } from "./scenes/FinalScene";
import { Vignette } from "./components/Vignette";
import { FlourParticles } from "./components/FlourParticles";

const playfair = loadPlayfair("normal", { weights: ["700"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const FONTS = {
  display: playfair.fontFamily,
  body: inter.fontFamily,
};

export type Orientation = "landscape" | "portrait";

// Scene timing: 5 scenes, ~54 frames each, with 12-frame crossfades
// We use absolute Sequence positioning so crossfades happen via opacity
const SCENE_DUR = 66; // each scene visible duration
const OVERLAP = 12; // crossfade overlap
const STEP = SCENE_DUR - OVERLAP; // 54 — distance between scene starts

const SCENES = [
  { src: "images/01-massa.jpg", zoomFrom: 1.0, zoomTo: 1.08, panX: 0, panY: -2 },
  { src: "images/02-modelagem.jpg", zoomFrom: 1.05, zoomTo: 1.0, panX: 0, panY: 3 },
  { src: "images/03-assado.jpg", zoomFrom: 1.0, zoomTo: 1.1, panX: -3, panY: 0 },
  { src: "images/04-recheio.jpg", zoomFrom: 1.08, zoomTo: 1.0, panX: 2, panY: -2 },
];

export const MainVideo: React.FC<{ orientation: Orientation }> = ({ orientation }) => {
  const frame = useCurrentFrame();

  // global subtle warmth pulse
  const warmth = interpolate(frame, [0, 135, 270], [0.9, 1, 0.9]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* base dark gradient */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 75% 50%, rgba(232,93,58,0.18) 0%, rgba(10,10,10,0) 55%), #0a0a0a",
          opacity: warmth,
        }}
      />

      {/* image scenes (process) */}
      {SCENES.map((s, i) => (
        <Sequence key={i} from={i * STEP} durationInFrames={SCENE_DUR}>
          <Scene
            src={s.src}
            zoomFrom={s.zoomFrom}
            zoomTo={s.zoomTo}
            panX={s.panX}
            panY={s.panY}
            duration={SCENE_DUR}
            overlap={OVERLAP}
            orientation={orientation}
          />
        </Sequence>
      ))}

      {/* final hero scene with logo */}
      <Sequence from={4 * STEP} durationInFrames={270 - 4 * STEP}>
        <FinalScene orientation={orientation} duration={270 - 4 * STEP} overlap={OVERLAP} />
      </Sequence>

      {/* flour / particle overlay over scenes 1-2 */}
      <Sequence from={0} durationInFrames={STEP * 2 + SCENE_DUR}>
        <FlourParticles />
      </Sequence>

      {/* vignette */}
      <Vignette />
    </AbsoluteFill>
  );
};
