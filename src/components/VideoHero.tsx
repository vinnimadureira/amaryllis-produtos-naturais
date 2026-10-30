import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/hooks/usePageContent";
import heroVideoAsset from "@/assets/hero-massa-cone-v3.mp4.asset.json";

const DEFAULT_HERO = {
  title: "Da ideia à peça pronta.",
  subtitle:
    "Projetamos - Desenvolvemos - Fabricamos\nSoluções sob medida em projetos, protótipos e fabricação personalizada.\n__small__Tecnologias avançadas como cone artesanal, modelagem CAD e desenvolvimento de produtos",
  cta_label: "Ver Catálogo",
  cta_link: "/catalogo",
  cta_secondary_label: "Solicitar Orçamento",
  cta_secondary_link: "/contato",
};

const VideoHero = () => {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { getSection } = usePageContent("home");
  const hero = getSection("hero", DEFAULT_HERO);
  const isExternalSecondary = /^https?:\/\//i.test(hero.cta_secondary_link || "");
  const isExternalPrimary = /^https?:\/\//i.test(hero.cta_link || "");

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Background video: moves down slower than scroll (classic parallax), subtle zoom + blur
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "55%"]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const videoBlur = useTransform(scrollYProgress, [0, 1], ["0px", "6px"]);
  const videoFilter = useTransform(
    videoBlur,
    (b) => `brightness(0.18) contrast(0.95) saturate(0.9) blur(${b})`
  );

  // Overlay darkens as you scroll for depth
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.8], [0.55, 0.95]);

  // Text descends as page scrolls — opposite direction creates the "wow" parallax depth
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "120%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45, 0.85], [1, 0.85, 0]);
  const textScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const textBlur = useTransform(scrollYProgress, [0.4, 1], ["0px", "4px"]);
  const textFilter = useTransform(textBlur, (b) => `blur(${b})`);

  // Stripe layer travels upward — counter-parallax accent
  const stripesY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const stripesOpacity = useTransform(scrollYProgress, [0, 1], [0.3, 0.05]);



  return (
    <section
      ref={ref}
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-brand-deep"
    >
      {/* Cinematic background video — slow parallax + scale + scroll blur */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: videoY, scale: videoScale, filter: videoFilter }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={heroVideoAsset.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Amaryllis Produtos Naturais — Jardim Guanabara, Campinas"
        />
      </motion.div>

      {/* Global dark veil for legibility */}
      <div className="absolute inset-0 bg-brand-deep/75 pointer-events-none" />

      {/* Layered overlay for legibility */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/95 to-brand-deep/70"
        style={{ opacity: overlayOpacity }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/70 to-brand-deep/85 pointer-events-none" />
      {/* Spotlight scrim behind text on the left for readability */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_68%_82%_at_28%_50%,hsl(var(--brand-deep)),hsl(var(--brand-deep)/0.86)_45%,transparent_78%)] pointer-events-none" />

      {/* "Print layer" stripes — counter parallax going up */}
      <motion.div
        className="hidden md:block absolute right-0 top-0 bottom-0 w-1/3 layer-stripes pointer-events-none"
        style={{ y: stripesY, opacity: stripesOpacity }}
      />


      {/* Content — descends faster than the video for depth */}
      <motion.div
        className="container relative z-10 py-24 will-change-transform"
        style={{ y: textY, opacity: textOpacity, scale: textScale, filter: textFilter }}
      >

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/40 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-orange font-medium">
              Cones de Pizza Artesanais
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight [text-shadow:0_4px_22px_hsl(var(--brand-deep)),0_1px_3px_hsl(var(--brand-deep))]"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {hero.title?.split(".").map((part: string, i: number, arr: string[]) =>
              part.trim() ? (
                <span key={i} className="block">
                  {i === arr.length - 2 ? (
                    <span className="text-gradient-orange">{part.trim()}.</span>
                  ) : (
                    <>
                      {part.trim()}
                      {i < arr.length - 1 ? "." : ""}
                    </>
                  )}
                </span>
              ) : null
            )}
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white mt-6 leading-relaxed max-w-xl [text-shadow:0_3px_14px_hsl(var(--brand-deep)),0_1px_2px_hsl(var(--brand-deep))]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {hero.subtitle?.split('\n').map((line: string, i: number) => {
              const isSmall = line.startsWith('__small__');
              const text = isSmall ? line.replace('__small__', '') : line;
              return (
                 <span key={i} className={isSmall ? "block text-sm md:text-base text-white/90 mt-3" : "block"}>
                  {text}
                </span>
              );
            })}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {hero.cta_secondary_label && hero.cta_secondary_link && (
              <Button
                asChild
                size="lg"
                className="bg-brand-orange hover:bg-brand-orange/90 text-white gap-2 text-base shadow-glow border-0"
              >
                {isExternalSecondary ? (
                  <a href={hero.cta_secondary_link} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5" />
                    {hero.cta_secondary_label}
                  </a>
                ) : (
                  <Link to={hero.cta_secondary_link}>
                    <MessageCircle className="w-5 h-5" />
                    {hero.cta_secondary_label}
                  </Link>
                )}
              </Button>
            )}
            {hero.cta_label && hero.cta_link && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white bg-white/5 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm gap-2 text-base"
              >
                {isExternalPrimary ? (
                  <a href={hero.cta_link} target="_blank" rel="noopener noreferrer">
                    {hero.cta_label}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <Link to={hero.cta_link}>
                    {hero.cta_label}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </Button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="hidden sm:flex items-center gap-6 mt-12 font-mono text-base md:text-lg uppercase tracking-wider text-white/60"
          >
            <span>FDM</span>
            <span className="w-1 h-1 rounded-full bg-brand-orange" />
            <span>PLA · PETG · ABS</span>
            <span className="w-1 h-1 rounded-full bg-brand-orange" />
            <span>0.1mm precisão</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5"
        >
          <motion.div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default VideoHero;
