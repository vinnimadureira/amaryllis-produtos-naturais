import { motion, useScroll, useSpring } from "framer-motion";

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left shadow-[0_0_12px_hsl(var(--brand-ember)/0.6)]"
      style={{
        scaleX,
        background:
          "linear-gradient(90deg, hsl(var(--brand-ember)), hsl(var(--brand-orange-soft)), hsl(var(--brand-ember)))",
      }}
    />
  );
};

export default ScrollProgress;
