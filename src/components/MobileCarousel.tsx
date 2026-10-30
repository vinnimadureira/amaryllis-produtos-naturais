import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface MobileCarouselProps {
  children: ReactNode[];
  itemWidthClass?: string; // e.g. "w-[78%]"
  gapClass?: string; // e.g. "gap-4"
  className?: string;
  autoplay?: boolean;
  autoplayDelay?: number; // ms
  showDots?: boolean;
}

const MobileCarousel = ({
  children,
  itemWidthClass = "w-[78%]",
  gapClass = "gap-4",
  className = "",
  autoplay = false,
  autoplayDelay = 4000,
  showDots = true,
}: MobileCarouselProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const items = Array.isArray(children) ? children : [children];
  const count = items.length;
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(count > 1);

  const getCarouselItems = (container: HTMLDivElement) => {
    const track = container.firstElementChild as HTMLDivElement | null;
    return track ? (Array.from(track.children) as HTMLElement[]) : [];
  };

  // Track active index based on scroll position
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const maxScrollLeft = el.scrollWidth - el.clientWidth;
        setCanScrollPrev(el.scrollLeft > 4);
        setCanScrollNext(el.scrollLeft < maxScrollLeft - 4);

        const carouselItems = getCarouselItems(el);
        if (!carouselItems.length) return;
        const center = el.scrollLeft + el.clientWidth / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        carouselItems.forEach((child, i) => {
          const childCenter = child.offsetLeft + child.offsetWidth / 2;
          const dist = Math.abs(childCenter - center);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        });
        setActiveIndex(bestIdx);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  // Autoplay with pause on touch/hover
  useEffect(() => {
    if (!autoplay || isPaused || count <= 1) return;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (activeIndex + 1) % count;
      const child = getCarouselItems(el)[next];
      if (child) {
        el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior: "smooth" });
      }
    }, autoplayDelay);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDelay, activeIndex, count, isPaused]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = getCarouselItems(el)[i];
    if (child) {
      el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2, behavior: "smooth" });
    }
  };

  const goToPrevious = () => {
    goTo((activeIndex - 1 + count) % count);
  };

  const goToNext = () => {
    goTo((activeIndex + 1) % count);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={scrollerRef}
        className="px-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-hide [touch-action:pan-x]"
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`flex ${gapClass} pb-2`}>
          {items.map((child, i) => (
            <div key={i} className={`snap-center shrink-0 ${itemWidthClass} py-1`}>
              {child}
            </div>
          ))}
        </div>
      </div>
      {count > 1 && (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            aria-label="Ir para o item anterior"
            className={`absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border-border/40 bg-background/65 text-foreground/70 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out hover:scale-105 hover:bg-background/75 hover:text-foreground/85 supports-[backdrop-filter]:bg-background/55 sm:hidden ${
              !canScrollPrev ? "pointer-events-none opacity-0 -translate-x-1 scale-95" : "opacity-100 translate-x-0 scale-100"
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goToNext}
            aria-label="Ir para o próximo item"
            className={`absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border-border/40 bg-background/65 text-foreground/70 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out hover:scale-105 hover:bg-background/75 hover:text-foreground/85 supports-[backdrop-filter]:bg-background/55 sm:hidden ${
              !canScrollNext ? "pointer-events-none opacity-0 translate-x-1 scale-95" : "opacity-100 translate-x-0 scale-100"
            }`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
      {showDots && count > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir para item ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileCarousel;
