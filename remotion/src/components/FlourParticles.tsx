import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

// Deterministic pseudo-random
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

interface Particle {
  x: number; // 0..1
  y: number; // 0..1 starting y
  size: number;
  speed: number;
  drift: number;
  opacity: number;
}

const PARTICLES: Particle[] = Array.from({ length: 60 }).map((_, i) => ({
  x: rand(i + 1),
  y: rand(i + 23),
  size: 1 + rand(i + 7) * 2.5,
  speed: 0.05 + rand(i + 11) * 0.15,
  drift: (rand(i + 19) - 0.5) * 0.04,
  opacity: 0.2 + rand(i + 31) * 0.45,
}));

export const FlourParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps; // seconds

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {PARTICLES.map((p, i) => {
        const y = (p.y + p.speed * t) % 1.2;
        const x = (p.x + p.drift * t + 1) % 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x * width,
              top: y * height,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: "rgba(245, 240, 232, 1)",
              opacity: p.opacity,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
