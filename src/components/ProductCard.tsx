import { forwardRef, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, Play, MessageCircle, Leaf, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  description: string;
  price: string;
  priceNum?: number;
  category?: string;
  images?: string[];
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const isVideo = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(({
  id,
  image,
  name,
  description,
  price,
  priceNum = 0,
  category,
  images,
  isFavorite = false,
  onToggleFavorite,
}, ref) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const { fireConfetti, fireHearts } = useConfetti();
  const allImages = images && images.length > 1 ? images : [image];
  const [currentImg, setCurrentImg] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    if (allImages.length <= 1) return;
    if (dx < 0) {
      setCurrentImg((prev) => (prev + 1) % allImages.length);
    } else {
      setCurrentImg((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  }, [allImages.length]);

  const canBuy = priceNum > 0;

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name, price, priceNum, image });
    toast({ title: "Adicionado ao carrinho 🛒", description: name });
    fireConfetti();
    setTimeout(() => {
      const btn = document.querySelector<HTMLButtonElement>("[data-checkout-button]");
      btn?.focus({ preventScroll: false });
      btn?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = encodeURIComponent(
      `Olá, Amaryllis Produtos Naturais! Tenho interesse no produto "${name}" e gostaria de consultar disponibilidade.`
    );
    window.open(`https://wa.me/${AMARYLLIS_COMPANY.whatsapp}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFavorite) {
      fireHearts(e.clientX, e.clientY);
    }
    onToggleFavorite?.(id);
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((prev) => (prev + 1) % allImages.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const currentUrl = allImages[currentImg];
  const currentIsVideo = isVideo(currentUrl);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/70 shadow-soft hover:shadow-gold hover:border-primary/40 transition-all duration-300"
    >
      <Link to={`/produto/${id}`} className="block relative">
        <div
          className="aspect-square overflow-hidden relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait" initial={false}>
            {currentIsVideo ? (
              <motion.div
                key={currentUrl}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full absolute inset-0"
              >
                <video
                  src={currentUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <div className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm rounded-full p-1.5">
                  <Play className="w-3 h-3 text-foreground fill-foreground" />
                </div>
              </motion.div>
            ) : (
              <motion.img
                key={currentUrl}
                src={currentUrl}
                alt={name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover absolute inset-0 group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />

          {allImages.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card/90 z-10"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card/90 z-10"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 right-3 flex gap-1 z-20">
                {allImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentImg ? "bg-primary w-4" : "bg-white/60 w-1.5"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Top-left botanical badge */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-md border border-primary/30 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Leaf className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Seleção</span> Saudável
          </div>
        </div>
        {onToggleFavorite && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-card/85 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFavorite ? "filled" : "empty"}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                    isFavorite
                      ? "fill-primary text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                />
              </motion.div>
            </AnimatePresence>
          </button>
        )}
      </Link>
      <div className="p-2.5 sm:p-4 flex flex-col justify-between flex-1">
        <div>
          {category && (
            <span className="text-[10px] sm:text-xs font-medium text-primary uppercase tracking-wider line-clamp-1">
              {category}
            </span>
          )}
          <Link to={`/produto/${id}`}>
            <h3 className="font-serif text-xs sm:text-base font-semibold mt-0.5 sm:mt-1 text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight">
              {name}
            </h3>
          </Link>
          <p className="hidden sm:block text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
        </div>

        <div className="flex items-center justify-between gap-1.5 sm:gap-3 mt-2 sm:mt-4 pt-1.5 sm:pt-2 border-t border-border/40">
          <div className="flex flex-col min-w-0">
            <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider text-muted-foreground">
              {canBuy ? "Valor" : "Sob consulta"}
            </span>
            <span className="font-serif text-sm sm:text-lg font-bold text-foreground leading-none truncate">
              {price}
            </span>
          </div>

          {canBuy ? (
            <Button
              size="sm"
              onClick={handleBuyNow}
              className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shrink-0 gap-1"
              aria-label={`Adicionar ${name} ao carrinho`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Add</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleWhatsApp}
              className="h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] rounded-full border-primary/40 text-primary hover:bg-primary/10 shrink-0 gap-1"
              aria-label={`Pedir ${name} pelo WhatsApp`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Zap</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
