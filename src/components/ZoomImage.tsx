import { useState, useRef, useCallback } from "react";

interface ZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
}

const ZoomImage = ({ src, alt, className = "", zoomScale = 2.5 }: ZoomImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      onMouseEnter={() => setIsZooming(true)}
      onMouseLeave={() => setIsZooming(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
        draggable={false}
      />
      {isZooming && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomScale * 100}%`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
};

export default ZoomImage;
