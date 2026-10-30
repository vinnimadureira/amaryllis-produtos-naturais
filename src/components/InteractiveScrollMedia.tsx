import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  useVelocity,
} from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Award,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";
import { useSiteMedia } from "@/hooks/useSiteMedia";

/* ──────────────────────────────────────────────────────────────────────────
 * 1. PARALLAX + 3D CURSOR TILT IMAGE (para seções ZigZag e destaques)
 *    Combina efeito "janela" na rolagem (scroll parallax interno) com
 *    inclinação 3D suave e reflexo de luz que seguem o cursor do mouse.
 * ────────────────────────────────────────────────────────────────────────── */
interface ParallaxTiltImageProps {
  src: string;
  alt: string;
  badgeTop?: string;
  badgeBottomTitle?: string;
  badgeBottomSubtitle?: string;
  accentColor?: "sage" | "terracotta" | "gold";
}

export const ParallaxTiltImage: React.FC<ParallaxTiltImageProps> = ({
  src,
  alt,
  badgeTop,
  badgeBottomTitle,
  badgeBottomSubtitle,
  accentColor = "sage",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll parallax (internal image moves opposite to scroll)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001,
  });

  const imgY = useTransform(smoothScroll, [0, 1], ["-12%", "12%"]);
  const imgScale = useTransform(smoothScroll, [0, 0.5, 1], [1.18, 1.08, 1.18]);
  const badgeY = useTransform(smoothScroll, [0, 1], ["20px", "-20px"]);

  // Cursor 3D Tilt & Spotlight
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { stiffness: 160, damping: 22 });
  const smoothY = useSpring(mouseY, { stiffness: 160, damping: 22 });

  const rotateX = useTransform(smoothY, [0, 1], [8, -8]);
  const rotateY = useTransform(smoothX, [0, 1], [-8, 8]);

  const badgeParallaxX = useTransform(smoothX, [0, 1], [-16, 16]);
  const badgeParallaxY = useTransform(smoothY, [0, 1], [-12, 12]);

  const glareX = useTransform(smoothX, [0, 1], [0, 100]);
  const glareY = useTransform(smoothY, [0, 1], [0, 100]);
  const glareBackground = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.28), transparent 70%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(Math.max(0, Math.min(1, x)));
    mouseY.set(Math.max(0, Math.min(1, y)));
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const glowMap = {
    sage: "bg-primary/15",
    terracotta: "bg-[hsl(var(--brand-brasa))]/15",
    gold: "bg-accent/20",
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative group [perspective:1200px] select-none"
    >
      {/* Ambient aura */}
      <div
        className={`pointer-events-none absolute -inset-6 ${glowMap[accentColor]} blur-3xl rounded-full transition-opacity duration-500 group-hover:opacity-100 opacity-75`}
      />

      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative rounded-3xl overflow-hidden shadow-cinematic border border-border/70 aspect-[4/3] bg-card will-change-transform"
      >
        {/* Inner Scroll-Parallax Image */}
        <motion.img
          src={src}
          alt={alt}
          style={{ y: imgY, scale: imgScale }}
          className="w-full h-full object-cover will-change-transform"
          loading="lazy"
        />

        {/* Subtle gradient vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20" />

        {/* Dynamic Cursor Glare / Spotlight */}
        <motion.div
          style={{ background: glareBackground }}
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* Top Floating Satellite Pill */}
        {badgeTop && (
          <motion.div
            style={{
              x: badgeParallaxX,
              y: badgeY,
              translateZ: 45,
            }}
            className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-xs font-semibold text-foreground shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>{badgeTop}</span>
          </motion.div>
        )}

        {/* Bottom Floating Depth Card */}
        {(badgeBottomTitle || badgeBottomSubtitle) && (
          <motion.div
            style={{
              x: badgeParallaxX,
              y: badgeParallaxY,
              translateZ: 55,
            }}
            className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs z-20 p-3.5 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-xl"
          >
            {badgeBottomTitle && (
              <div className="font-display text-base text-foreground leading-snug">
                {badgeBottomTitle}
              </div>
            )}
            {badgeBottomSubtitle && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {badgeBottomSubtitle}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * 2. BENTO CARD COM RASTREAMENTO DE CURSOR 3D & SPOTLIGHT
 * ────────────────────────────────────────────────────────────────────────── */
interface InteractiveBentoCardProps {
  children: React.ReactNode;
  className?: string;
}

export const InteractiveBentoCard: React.FC<InteractiveBentoCardProps> = ({
  children,
  className = "",
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const pixelX = useMotionValue(0);
  const pixelY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 180, damping: 24 });
  const smoothY = useSpring(mouseY, { stiffness: 180, damping: 24 });

  const rotateX = useTransform(smoothY, [0, 1], [6, -6]);
  const rotateY = useTransform(smoothX, [0, 1], [-6, 6]);
  const spotlight = useMotionTemplate`radial-gradient(320px circle at ${pixelX}px ${pixelY}px, rgba(255, 255, 255, 0.24), transparent 75%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pixelX.set(x);
    pixelY.set(y);
    mouseX.set(Math.max(0, Math.min(1, x / rect.width)));
    mouseY.set(Math.max(0, Math.min(1, y / rect.height)));
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`group relative overflow-hidden rounded-2xl md:rounded-3xl bg-card border border-border/60 cursor-pointer will-change-transform ${className}`}
    >
      {children}
      <motion.div
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
    </motion.article>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * 3. STICKY SCROLL-SCRUBBING + CURSOR 3D EXPERIÊNCIA SENSORIAL AMARYLLIS
 *    À medida que o visitante gira o scroll do mouse, a cena central evolui
 *    por 4 capítulos interativos com física de velocidade de rolagem,
 *    scrubbing de vídeo opcional e camadas 3D que seguem o cursor.
 * ────────────────────────────────────────────────────────────────────────── */

interface StoryChapter {
  id: string;
  number: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  video: string;
  image: string;
  secondaryImage: string;
  accentClass: string;
  pills: string[];
  orbitTags: [string, string];
  floatingCardTop: {
    label: string;
    value: string;
    sub: string;
  };
  floatingCardBottom: {
    label: string;
    value: string;
    sub: string;
  };
  ctaLabel: string;
  ctaLink: string;
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "essential",
    number: "01",
    badge: "Parceira Oficial em Campinas",
    title: "Nutrição Funcional &",
    highlight: "Suplementação Pura",
    description:
      "Toda a linha Essential Nutrition à pronta-entrega no Jardim Guanabara. Proteínas isoladas e hidrolisadas, peptídeos de colágeno Verisol®, creatina de altíssima pureza e adoçantes 100% naturais.",
    video: "/media/amaryllis-hero-functional.mp4",
    image:
      "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1200&q=85",
    secondaryImage:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    accentClass: "from-primary/30 via-accent/20 to-transparent",
    pills: [
      "Cacao Whey Essential",
      "Collagen Skin Verisol®",
      "Creatina 100% Pura",
      "Chocolift Zero Açúcar",
    ],
    orbitTags: ["22g Proteína Pura", "Peptídeos Bioativos"],
    floatingCardTop: {
      label: "Pureza Certificada",
      value: "Zero Açúcar & Zero Glúten",
      sub: "Adoçado com Stevia e Taumatina",
    },
    floatingCardBottom: {
      label: "Destaque na Loja",
      value: "Linha Completa Essential",
      sub: "Pronta-entrega na Rua Camargo Paes, 65",
    },
    ctaLabel: "Explorar Essential Nutrition",
    ctaLink: "/catalogo?ingrediente=Essential",
  },
  {
    id: "gluten-free",
    number: "02",
    badge: "Selo Guindy Gluten Free Friendly",
    title: "Liberdade e Sabor",
    highlight: "Sem Glúten & Sem Lactose",
    description:
      "Reconhecida pelo guia Guindy em Campinas, nossa curadoria oferece pães artesanais multigrãos, massas, farinhas nobres, bebidas vegetais e snacks seguros para celíacos e intolerantes.",
    video: "/media/amaryllis-hero-glutenfree.mp4",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
    secondaryImage:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    accentClass: "from-[hsl(var(--brand-brasa))]/30 via-accent/20 to-transparent",
    pills: [
      "Pães Sem Glúten",
      "Leites Vegetais",
      "Zero Caseína & Lactose",
      "Dietéticos & Baixo IG",
    ],
    orbitTags: ["Selo Guindy Campinas", "Zero Contaminação"],
    floatingCardTop: {
      label: "Referência em Campinas",
      value: "100% Gluten Free Friendly",
      sub: "Rótulos conferidos com rigor",
    },
    floatingCardBottom: {
      label: "Para toda a família",
      value: "Sem Leite & Derivados",
      sub: "Opções veganas, leves e saborosas",
    },
    ctaLabel: "Ver Linha Sem Glúten",
    ctaLink: "/catalogo?ingrediente=Sem+Glúten",
  },
  {
    id: "fitoterapicos",
    number: "03",
    badge: "Alquimia Botânica & Frescor",
    title: "Fitoterápicos, Chás &",
    highlight: "Granel Selecionado",
    description:
      "Castanhas nobres assadas sem sal, sementes, grãos orgânicos, mel silvestre, própolis verde e ervas medicinais integrais para imunidade, digestão leve e sono reparador.",
    video: "/media/amaryllis-hero-herbs.mp4",
    image:
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1200&q=85",
    secondaryImage:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
    accentClass: "from-accent/35 via-primary/20 to-transparent",
    pills: [
      "Mix de Castanhas Nobres",
      "Infusões & Fitoterápicos",
      "Própolis Verde & Mel",
      "Granolas & Orgânicos",
    ],
    orbitTags: ["100% Natural & Integral", "Rico em Selênio & Magnésio"],
    floatingCardTop: {
      label: "Giro Rápido",
      value: "Sempre Crocante & Fresco",
      sub: "Oleaginosas, sementes e frutas secas",
    },
    floatingCardBottom: {
      label: "Farmácia da Natureza",
      value: "Chás & Extratos Puros",
      sub: "Camomila, melissa, cúrcuma e própolis",
    },
    ctaLabel: "Ver Granel & Fitoterápicos",
    ctaLink: "/catalogo?ingrediente=Castanhas",
  },
  {
    id: "guanabara",
    number: "04",
    badge: "Tradição no Jardim Guanabara",
    title: "Atendimento que acolhe",
    highlight: "na Loja ou no WhatsApp",
    description:
      "Envie a lista da sua nutricionista pelo WhatsApp (19) 99351-2766: separamos tudo com carinho para entrega rápida em Campinas ou retirada expressa na Rua Camargo Paes, 65.",
    video: "/media/amaryllis-hero-tea.mp4",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85",
    secondaryImage:
      "https://images.unsplash.com/photo-1490885578174-acda8905c2c6?auto=format&fit=crop&w=600&q=80",
    accentClass: "from-primary/35 via-[hsl(var(--brand-brasa))]/25 to-transparent",
    pills: [
      "Rua Camargo Paes, 65",
      "WhatsApp (19) 99351-2766",
      "Fixo (19) 3243-5982",
      "Delivery em Campinas",
    ],
    orbitTags: ["CEP 13073-350", "Delivery Rápido"],
    floatingCardTop: {
      label: "Jardim Guanabara · Campinas",
      value: "Rua Camargo Paes, 65",
      sub: "Estacionamento fácil e retirada rápida",
    },
    floatingCardBottom: {
      label: "Lista da Nutricionista",
      value: "(19) 99351-2766",
      sub: "Separamos seu pedido completo pelo WhatsApp",
    },
    ctaLabel: "Falar com a Loja Agora",
    ctaLink: `https://wa.me/${AMARYLLIS_COMPANY.whatsapp}?text=${encodeURIComponent(
      "Olá, Amaryllis! Vi a experiência interativa no site e gostaria de fazer um pedido."
    )}`,
  },
];

export const ScrollInteractiveShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);

  const { getMedia } = useSiteMedia();
  const customScrollVideo = getMedia("home.hero_video_desktop", "");

  // Track vertical scroll across the 320vh sticky container
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });

  // React to scroll velocity for subtle dynamic camera skew/zoom
  const scrollVelocity = useVelocity(smoothProgress);
  const velocityScale = useTransform(scrollVelocity, [-0.8, 0, 0.8], [0.96, 1, 1.04]);

  // Update active chapter index & scrub custom video if present
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const clamped = Math.max(0, Math.min(1, v));
      setScrollPercent(Math.round(clamped * 100));
      const idx = Math.min(
        STORY_CHAPTERS.length - 1,
        Math.max(0, Math.floor(clamped * STORY_CHAPTERS.length))
      );
      setActiveIndex(idx);

      if (videoRef.current && videoRef.current.duration) {
        videoRef.current.currentTime = clamped * videoRef.current.duration;
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Scroll-driven transforms for the central visual stage
  const ringRotate = useTransform(smoothProgress, [0, 1], [0, 240]);
  const progressHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);
  const orbitY1 = useTransform(smoothProgress, [0, 0.5, 1], ["24px", "-28px", "18px"]);
  const orbitY2 = useTransform(smoothProgress, [0, 0.5, 1], ["-20px", "26px", "-16px"]);

  // Cursor 3D interaction on the sticky visual stage
  const cursorX = useMotionValue(0.5);
  const cursorY = useMotionValue(0.5);
  const pixelX = useMotionValue(300);
  const pixelY = useMotionValue(300);

  const springX = useSpring(cursorX, { stiffness: 150, damping: 22 });
  const springY = useSpring(cursorY, { stiffness: 150, damping: 22 });

  const tiltX = useTransform(springY, [0, 1], [10, -10]);
  const tiltY = useTransform(springX, [0, 1], [-10, 10]);

  // Satellite cards move in opposite/amplified directions with cursor
  const satTopX = useTransform(springX, [0, 1], [-24, 24]);
  const satTopY = useTransform(springY, [0, 1], [-18, 18]);

  const satBottomX = useTransform(springX, [0, 1], [26, -26]);
  const satBottomY = useTransform(springY, [0, 1], [18, -18]);

  const secondaryImgX = useTransform(springX, [0, 1], [-18, 18]);
  const secondaryImgY = useTransform(springY, [0, 1], [18, -18]);

  const innerImgPanX = useTransform(springX, [0, 1], ["2.5%", "-2.5%"]);
  const innerImgPanY = useTransform(springY, [0, 1], ["2.5%", "-2.5%"]);

  const stageSpotlight = useMotionTemplate`radial-gradient(500px circle at ${pixelX}px ${pixelY}px, rgba(255, 255, 255, 0.25), transparent 70%)`;

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pixelX.set(x);
    pixelY.set(y);
    cursorX.set(Math.max(0, Math.min(1, x / rect.width)));
    cursorY.set(Math.max(0, Math.min(1, y / rect.height)));
  };

  const handleStageMouseLeave = () => {
    cursorX.set(0.5);
    cursorY.set(0.5);
  };

  // Allow clicking a chapter pill to scroll smoothly to that point
  const scrollToChapter = (index: number) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const scrollableDistance = sectionRef.current.offsetHeight - window.innerHeight;
    const targetScroll =
      absoluteTop + (index / STORY_CHAPTERS.length + 0.08) * scrollableDistance;
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
    setActiveIndex(index);
  };

  const currentChapter = STORY_CHAPTERS[activeIndex];
  const isExternalCta = /^https?:\/\//i.test(currentChapter.ctaLink);

  return (
    <section
      ref={sectionRef}
      className="relative lg:h-[320vh] bg-secondary/45 border-y border-border/70"
    >
      {/* Sticky Viewport Container */}
      <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center overflow-hidden py-16 lg:py-0">
        {/* Ambient background glow that changes with active chapter */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${currentChapter.accentClass} transition-all duration-700 opacity-70`}
        />
        <motion.div
          style={{ rotate: ringRotate }}
          className="pointer-events-none hidden lg:block absolute -right-40 -bottom-40 w-[680px] h-[680px] rounded-full border border-primary/15 border-dashed"
        />

        <div className="container relative z-10">
          {/* Top Section Header & Interactive Chapter Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 lg:mb-10">
            <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <MousePointerClick className="w-4 h-4" />
              <span>Imersão Botânica · Gire o scroll ou mova o cursor</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-primary/15 font-mono text-[11px]">
                {scrollPercent}%
              </span>
            </div>

            {/* Chapter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {STORY_CHAPTERS.map((chap, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={chap.id}
                    type="button"
                    onClick={() => scrollToChapter(idx)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/70"
                    }`}
                  >
                    <span className="font-mono opacity-75">{chap.number}</span>
                    <span className="hidden sm:inline">{chap.title.replace("&", "")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main 12-Col Interactive Stage */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Vertical Progress Bar + Chapter Story Copy (5 cols) */}
            <div className="lg:col-span-5 flex gap-5 items-stretch">
              {/* Scroll Progress Track */}
              <div className="hidden sm:flex flex-col items-center py-2">
                <span className="font-mono text-[11px] font-bold text-primary mb-2">
                  0{activeIndex + 1}
                </span>
                <div className="relative w-1.5 flex-1 bg-border/70 rounded-full overflow-hidden min-h-[220px]">
                  <motion.div
                    style={{ height: progressHeight }}
                    className="w-full bg-gradient-to-b from-primary via-[hsl(var(--brand-brasa))] to-accent rounded-full"
                  />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground mt-2">
                  0{STORY_CHAPTERS.length}
                </span>
              </div>

              {/* Animated Chapter Content */}
              <motion.div
                key={currentChapter.id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex-1"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentChapter.badge}
                </span>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-4 leading-[1.06] text-foreground">
                  {currentChapter.title}{" "}
                  <em className="not-italic text-gradient-ember block sm:inline">
                    {currentChapter.highlight}
                  </em>
                </h2>

                <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
                  {currentChapter.description}
                </p>

                {/* Interactive Highlight Pills */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {currentChapter.pills.map((pill) => (
                    <span
                      key={pill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/80 text-xs font-medium text-foreground shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      {pill}
                    </span>
                  ))}
                </div>

                {/* Chapter CTA */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-7 shadow-glow"
                  >
                    {isExternalCta ? (
                      <a
                        href={currentChapter.ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {currentChapter.ctaLabel}
                      </a>
                    ) : (
                      <Link to={currentChapter.ctaLink}>
                        {currentChapter.ctaLabel}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    )}
                  </Button>

                  <span className="text-xs text-muted-foreground hidden xl:inline-flex items-center gap-1.5">
                    <span>Role para avançar</span>
                    <span className="font-mono text-primary">
                      ({activeIndex + 1}/{STORY_CHAPTERS.length})
                    </span>
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right 3D Cursor + Scroll Stage (7 cols) */}
            <div
              ref={stageRef}
              onMouseMove={handleStageMouseMove}
              onMouseLeave={handleStageMouseLeave}
              className="lg:col-span-7 relative [perspective:1400px] py-4 sm:py-6 select-none"
            >
              <motion.div
                style={{
                  scale: velocityScale,
                  rotateX: tiltX,
                  rotateY: tiltY,
                  transformStyle: "preserve-3d",
                }}
                className="relative mx-auto max-w-2xl aspect-[16/11] rounded-3xl bg-card border border-border/80 shadow-cinematic overflow-visible will-change-transform"
              >
                {/* Main Crossfading Stage Image or Scroll-Scrubbed Video */}
                <div className="relative w-full h-full rounded-3xl overflow-hidden">
                  {customScrollVideo ? (
                    <video
                      ref={videoRef}
                      src={customScrollVideo}
                      muted
                      playsInline
                      preload="auto"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    STORY_CHAPTERS.map((chap, idx) => {
                      const isActive = idx === activeIndex;
                      return (
                        <motion.div
                          key={chap.id}
                          style={{
                            x: innerImgPanX,
                            y: innerImgPanY,
                          }}
                          initial={false}
                          animate={{
                            opacity: isActive ? 1 : 0,
                            scale: isActive ? 1.08 : 1.18,
                          }}
                          transition={{ duration: 0.65, ease: "easeOut" }}
                          className="absolute inset-0 w-full h-full will-change-transform"
                        >
                          <video
                            src={chap.video}
                            poster={chap.image}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      );
                    })
                  )}

                  {/* Dark Botanical Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/20 to-transparent" />

                  {/* Cursor-tracking Spotlight inside stage */}
                  <motion.div
                    style={{ background: stageSpotlight }}
                    className="pointer-events-none absolute inset-0"
                  />

                  {/* Chapter Number Watermark */}
                  <div className="absolute bottom-4 right-5 font-display text-6xl sm:text-7xl text-white/15 select-none pointer-events-none">
                    {currentChapter.number}
                  </div>
                </div>

                {/* Orbiting Scroll-Driven Pill 1 (Left Edge, translateZ +95px) */}
                <motion.div
                  style={{
                    y: orbitY1,
                    translateZ: 95,
                  }}
                  className="hidden md:flex absolute top-1/2 -left-6 -translate-y-1/2 z-30 items-center gap-2 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-xl"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentChapter.orbitTags[0]}</span>
                </motion.div>

                {/* Orbiting Scroll-Driven Pill 2 (Bottom-Right Edge, translateZ +90px) */}
                <motion.div
                  style={{
                    y: orbitY2,
                    translateZ: 90,
                  }}
                  className="hidden md:flex absolute bottom-12 -right-5 z-30 items-center gap-2 px-3.5 py-2 rounded-full bg-background/95 backdrop-blur-md border border-border text-foreground text-xs font-semibold shadow-xl"
                >
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-brasa))] animate-ping" />
                  <span>{currentChapter.orbitTags[1]}</span>
                </motion.div>

                {/* Satellite 1: Top-Left Floating Depth Card (3D translateZ +60px) */}
                <motion.div
                  style={{
                    x: satTopX,
                    y: satTopY,
                    translateZ: 60,
                  }}
                  className="hidden sm:block absolute -top-5 -left-5 z-30 p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border/90 shadow-xl max-w-[240px]"
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{currentChapter.floatingCardTop.label}</span>
                  </div>
                  <div className="font-display text-base text-foreground mt-1 leading-tight">
                    {currentChapter.floatingCardTop.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {currentChapter.floatingCardTop.sub}
                  </div>
                </motion.div>

                {/* Satellite 2: Secondary Floating Thumbnail (Top-Right, translateZ +80px) */}
                <motion.div
                  style={{
                    x: secondaryImgX,
                    y: secondaryImgY,
                    translateZ: 80,
                  }}
                  className="hidden md:block absolute -top-6 -right-6 z-30 w-36 h-36 rounded-2xl overflow-hidden border-2 border-background shadow-2xl bg-card"
                >
                  <motion.img
                    key={currentChapter.secondaryImage}
                    src={currentChapter.secondaryImage}
                    alt={currentChapter.highlight}
                    initial={{ opacity: 0, scale: 1.15 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 right-2 text-[10px] font-mono uppercase tracking-wider text-white text-center bg-black/50 backdrop-blur-xs rounded-full py-0.5">
                    Amaryllis
                  </span>
                </motion.div>

                {/* Satellite 3: Bottom-Left Floating Card (translateZ +70px) */}
                <motion.div
                  style={{
                    x: satBottomX,
                    y: satBottomY,
                    translateZ: 70,
                  }}
                  className="absolute -bottom-5 left-4 right-4 sm:right-auto sm:left-6 z-30 p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border/90 shadow-xl sm:max-w-[270px]"
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--brand-brasa))]">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>{currentChapter.floatingCardBottom.label}</span>
                  </div>
                  <div className="font-display text-base text-foreground mt-1 leading-tight">
                    {currentChapter.floatingCardBottom.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {currentChapter.floatingCardBottom.sub}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
