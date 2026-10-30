import { useState, useEffect, forwardRef } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ScrollToTop = forwardRef<HTMLDivElement>((_, ref) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={ref}>
      <AnimatePresence>
        {visible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 right-6 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-soft flex items-center justify-center hover:bg-rose-dark transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

ScrollToTop.displayName = "ScrollToTop";

export default ScrollToTop;
