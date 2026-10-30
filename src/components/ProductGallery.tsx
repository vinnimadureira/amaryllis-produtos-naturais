import { useState, useRef, useCallback, useMemo } from "react";
import { ZoomIn, Play } from "lucide-react";
import MediaLightbox, { MediaItem } from "@/components/MediaLightbox";
import ZoomImage from "@/components/ZoomImage";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  category: string;
}

const isVideo = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

const ProductGallery = ({ images, alt, category }: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Lightbox shows only still images (videos are inline-playable).
  const lightboxItems: MediaItem[] = useMemo(
    () => images.filter((img) => !isVideo(img)).map((src) => ({ src, alt, category })),
    [images, alt, category],
  );

  const openLightbox = useCallback(() => {
    const photoIndex = images
      .slice(0, selectedIndex + 1)
      .filter((img) => !isVideo(img)).length - 1;
    setLightboxIndex(Math.max(0, photoIndex));
  }, [images, selectedIndex]);

  // Touch/swipe on main media
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
      if (images.length <= 1) return;
      if (dx < 0) setSelectedIndex((p) => (p + 1) % images.length);
      else setSelectedIndex((p) => (p - 1 + images.length) % images.length);
    },
    [images.length],
  );

  const currentIsVideo = isVideo(images[selectedIndex]);

  return (
    <div className="space-y-3">
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentIsVideo ? (
          <div className="aspect-square rounded-2xl overflow-hidden shadow-soft bg-secondary">
            <video
              src={images[selectedIndex]}
              className="w-full h-full object-cover"
              controls
              muted
              loop
              playsInline
            />
          </div>
        ) : (
          <div
            className="relative group cursor-zoom-in aspect-square rounded-2xl overflow-hidden shadow-soft bg-secondary"
            onClick={openLightbox}
          >
            <ZoomImage
              src={images[selectedIndex]}
              alt={alt}
              className="w-full h-full"
              zoomScale={2.5}
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center pointer-events-none">
              <ZoomIn className="w-8 h-8 text-background opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
            </div>
          </div>
        )}
        <div className="absolute top-4 left-4 pointer-events-none z-10">
          <span className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            {category}
          </span>
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all relative ${
                i === selectedIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {isVideo(img) ? (
                <>
                  <video src={img} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <Play className="w-4 h-4 text-background fill-background" />
                  </div>
                </>
              ) : (
                <img
                  src={img}
                  alt={`${alt} - ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <MediaLightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(i) => setLightboxIndex(i)}
        showCaption={false}
      />
    </div>
  );
};

export default ProductGallery;
