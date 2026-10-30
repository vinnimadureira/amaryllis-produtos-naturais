import { useCallback } from "react";
import confetti from "canvas-confetti";

export const useConfetti = () => {
  const fireConfetti = useCallback(() => {
    const defaults = { startVelocity: 20, spread: 60, ticks: 50, zIndex: 9999 };
    
    confetti({
      ...defaults,
      particleCount: 25,
      origin: { x: 0.5, y: 0.7 },
      colors: ["#c4888b", "#d4a574", "#f5e6d3", "#ffffff", "#e8b4b8"],
    });
  }, []);

  const fireHearts = useCallback((x: number, y: number) => {
    const rect = { x: x / window.innerWidth, y: y / window.innerHeight };
    
    confetti({
      particleCount: 8,
      startVelocity: 15,
      spread: 50,
      origin: rect,
      ticks: 40,
      zIndex: 9999,
      shapes: ["circle"],
      colors: ["#c4888b", "#e8b4b8", "#d4888b"],
      scalar: 0.8,
    });
  }, []);

  return { fireConfetti, fireHearts };
};
