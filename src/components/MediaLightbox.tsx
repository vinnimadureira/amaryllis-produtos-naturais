import { useCallback, useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface MediaItem {
  src: string;
  alt?: string;
  label?: string;
  category?: string | null;
}

interface MediaLightboxProps {
  items: MediaItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number, direction: number) => void;
  /** Optional rich footer rendered above bottom gradient (e.g. CTAs, progress). */
  renderFooter?: (item: MediaItem, index: number, total: number) => ReactNode;
  /** Show built-in caption (label + category chip). Default true if no renderFooter. */
  showCaption?: boolean;
}

const isVideo = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

/**
 * Single source of truth for image/video lightboxes across the app.
 * Renders via portal to escape ancestor transforms (PageTransition).
 */
const MediaLightbox = ({
  items,
  index,
  onClose,
  onIndexChange,
  renderFooter,
  showCaption,
}: MediaLightboxProps) => {
  const touchStartX = useRef<number | null>(null);
  const directionRef = useRef(0);

  const goNext = useCallback(() => {
    if (index === null || items.length === 0) return;
    directionRef.current = 1;
    onIndexChange((index + 1) % items.length, 1);
  }, [index, items.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (index === null || items.length === 0) return;
    directionRef.current = -1;
    onIndexChange((index - 1 + items.length) % items.length, -1);
  }, [index, items.length, onIndexChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(dx) < 50) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [goNext, goPrev],
  );

  // Lock body scroll while open
  useEffect(() => {
    if (index === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [index]);

  // Keyboard nav
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, goNext, goPrev]);

  if (typeof document === "undefined") return null;

  const useDefaultCaption = showCaption ?? !renderFooter;

  const overlay = (
    <AnimatePresence mode="wait">
      {index !== null && items[index] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/90 backdrop-blur-md p-4"
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-label="Visualizador de mídia"
        >
          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-card/40 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Nav */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 z-10 w-12 h-12 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-card/40 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 z-10 w-12 h-12 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-card/40 transition-colors"
                aria-label="Próxima"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Media */}
          <AnimatePresence mode="wait" custom={directionRef.current}>
            {isVideo(items[index].src) ? (
              <motion.video
                key={items[index].src}
                custom={directionRef.current}
                initial={{ x: directionRef.current * 100, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: directionRef.current * -100, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={items[index].src}
                className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <motion.img
                key={items[index].src}
                custom={directionRef.current}
                initial={{ x: directionRef.current * 100, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: directionRef.current * -100, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={items[index].src}
                alt={items[index].alt || items[index].label || ""}
                className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
            )}
          </AnimatePresence>

          {/* Footer */}
          {(renderFooter || useDefaultCaption) && (
            <div
              className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-16 bg-gradient-to-t from-black via-black/85 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              {renderFooter
                ? renderFooter(items[index], index, items.length)
                : items[index].label && (
                    <div className="text-center">
                      {items[index].category && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full bg-[hsl(var(--brand-ember))] text-white shadow-lg mb-2">
                          <span className="w-1 h-1 rounded-full bg-white" />
                          {items[index].category}
                        </span>
                      )}
                      <h3 className="font-serif text-white text-xl md:text-2xl leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        {items[index].label}
                      </h3>
                    </div>
                  )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
};

export default MediaLightbox;
