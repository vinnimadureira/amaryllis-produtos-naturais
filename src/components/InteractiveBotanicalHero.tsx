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
  ArrowRight,
  Leaf,
  ShieldCheck,
  MessageCircle,
  MapPin,
  Instagram,
  Sparkles,
  Award,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";

interface HeroSceneSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  priceTag: string;
  video: string;
  fallbackVideo: string;
  image: string;
  secondaryPill: string;
  link: string;
}

const HERO_SLIDES: HeroSceneSlide[] = [
  {
    id: "essential",
    tag: "Parceira Oficial em Campinas",
    title: "Essential Nutrition",
    subtitle: "Cacao Whey, Collagen Skin, Chocolift & Creatina Pura",
    priceTag: "Linha Completa na Loja",
    video: "/media/amaryllis-hero-functional.mp4",
    fallbackVideo: "https://assets.mixkit.co/videos/49371/49371-720.mp4",
    image:
      "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1600&q=85",
    secondaryPill: "Zero Açúcar · Alta Absorção",
    link: "/catalogo?ingrediente=Essential",
  },
  {
    id: "glutenfree",
    tag: "Selo Guindy Campinas",
    title: "Sem Glúten & Sem Lactose",
    subtitle: "Pães artesanais, farinhas nobres, bebidas vegetais e snacks",
    priceTag: "100% Gluten Free Friendly",
    video: "/media/amaryllis-hero-glutenfree.mp4",
    fallbackVideo: "https://assets.mixkit.co/videos/19165/19165-720.mp4",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=85",
    secondaryPill: "Seguro para Celíacos & APLV",
    link: "/catalogo?ingrediente=Sem+Glúten",
  },
  {
    id: "granel",
    tag: "Frescor Diário & Orgânicos",
    title: "Castanhas, Granel & Mel",
    subtitle: "Oleaginosas crocantes, sementes, granolas e frutas secas",
    priceTag: "Sempre Fresco & Crocante",
    video: "/media/amaryllis-hero-herbs.mp4",
    fallbackVideo: "https://assets.mixkit.co/videos/25377/25377-720.mp4",
    image:
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1600&q=85",
    secondaryPill: "Giro Rápido · Seleção Premium",
    link: "/catalogo?ingrediente=Castanhas",
  },
  {
    id: "fitoterapicos",
    tag: "Sabedoria Botânica",
    title: "Fitoterápicos & Chás",
    subtitle: "Infusões medicinais, própolis verde, cúrcuma e superfoods",
    priceTag: "Imunidade & Equilíbrio",
    video: "/media/amaryllis-hero-tea.mp4",
    fallbackVideo: "https://assets.mixkit.co/videos/9267/9267-720.mp4",
    image:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1600&q=85",
    secondaryPill: "Ervas Integrais Selecionadas",
    link: "/catalogo?ingrediente=Fitoterápicos",
  },
];

interface InteractiveBotanicalHeroProps {
  defaultHeroImage?: string;
  waUrl: string;
}

export const InteractiveBotanicalHero: React.FC<InteractiveBotanicalHeroProps> = ({
  waUrl,
}) => {
  const heroRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-cycle full-screen video scenes unless user is actively hovering the switcher
  useEffect(() => {
    if (isHovering) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isHovering]);

  // 1. SCROLL PARALLAX & VELOCITY (Reage à rolagem da página inteira)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
  });

  const scrollVelocity = useVelocity(smoothScroll);

  // Full-screen background video scales and moves in classic cinema parallax as you scroll
  const bgVideoY = useTransform(smoothScroll, [0, 1], ["0%", "38%"]);
  const bgVideoScale = useTransform(smoothScroll, [0, 1], [1.08, 1.24]);
  const bgOverlayDarkness = useTransform(smoothScroll, [0, 0.85], [0.52, 0.88]);

  // Foreground content parallax
  const copyY = useTransform(smoothScroll, [0, 1], ["0px", "110px"]);
  const copyOpacity = useTransform(smoothScroll, [0, 0.75], [1, 0]);
  const visualY = useTransform(smoothScroll, [0, 1], ["0px", "-55px"]);
  const velocityTilt = useTransform(scrollVelocity, [-0.6, 0, 0.6], [-4, 0, 4]);

  // 2. FULL-SCREEN CURSOR 3D PARALLAX & SPOTLIGHT (Reage ao cursor na Hero inteira!)
  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);
  const pixelX = useMotionValue(700);
  const pixelY = useMotionValue(400);

  const springX = useSpring(normX, { stiffness: 120, damping: 22 });
  const springY = useSpring(normY, { stiffness: 120, damping: 22 });

  // Full-bleed background video pans subtly with cursor movement!
  const bgVideoPanX = useTransform(springX, [0, 1], ["2.2%", "-2.2%"]);
  const bgVideoPanY = useTransform(springY, [0, 1], ["2.2%", "-2.2%"]);

  // Floating botanical light particles shift with cursor
  const particleLayer1X = useTransform(springX, [0, 1], [-45, 45]);
  const particleLayer1Y = useTransform(springY, [0, 1], [-35, 35]);
  const particleLayer2X = useTransform(springX, [0, 1], [55, -55]);
  const particleLayer2Y = useTransform(springY, [0, 1], [40, -40]);

  // 3D Tilt angles for the floating glass showcase on the right
  const rotateX = useTransform(springY, [0, 1], [11, -11]);
  const rotateY = useTransform(springX, [0, 1], [-11, 11]);

  // Multi-depth floating satellite offsets
  const floatLayer1X = useTransform(springX, [0, 1], [-26, 26]);
  const floatLayer1Y = useTransform(springY, [0, 1], [-18, 18]);

  const floatLayer2X = useTransform(springX, [0, 1], [32, -32]);
  const floatLayer2Y = useTransform(springY, [0, 1], [22, -22]);

  // Interactive cursor spotlight across the ENTIRE Hero section
  const heroCursorSpotlight = useMotionTemplate`radial-gradient(700px circle at ${pixelX}px ${pixelY}px, rgba(186, 133, 49, 0.22), rgba(49, 98, 66, 0.14) 45%, transparent 75%)`;

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pixelX.set(px);
    pixelY.set(py);

    normX.set(Math.max(0, Math.min(1, px / rect.width)));
    normY.set(Math.max(0, Math.min(1, py / rect.height)));
  };

  const handleHeroMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    setIsHovering(false);
  };

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <section
      ref={heroRef}
      onMouseMove={handleHeroMouseMove}
      onMouseLeave={handleHeroMouseLeave}
      className="relative isolate min-h-[95svh] w-full flex items-center pt-24 pb-16 overflow-hidden bg-[#0c1911] text-white"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          CAMADA 1: VÍDEO CINEMATOGRÁFICO EM TELA INTEIRA (REATIVO AO CURSOR + SCROLL)
         ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        style={{
          y: bgVideoY,
          scale: bgVideoScale,
          x: bgVideoPanX,
        }}
        className="pointer-events-none absolute inset-0 z-0 will-change-transform"
      >
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === activeSlide;
          return (
            <motion.div
              key={slide.id}
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                scale: isActive ? 1.02 : 1.1,
              }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{ y: bgVideoPanY }}
              className="absolute inset-0 w-full h-full"
            >
              <video
                key={slide.video}
                poster={slide.image}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              >
                <source src={slide.video} type="video/mp4" />
                <source src={slide.fallbackVideo} type="video/mp4" />
              </video>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          CAMADA 2: VÉU BOTÂNICO CINEMATOGRÁFICO & SPOTLIGHT QUE SEGUE O CURSOR
         ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        style={{ opacity: bgOverlayDarkness }}
        className="pointer-events-none absolute inset-0 z-[1] bg-[#0a160f]"
      />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-[#09150e]/95 via-[#09150e]/75 to-[#09150e]/35" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#09150e] via-transparent to-[#09150e]/60" />

      {/* Feixe de Luz Dourado/Sálvia que acompanha o cursor pela tela inteira */}
      <motion.div
        style={{ background: heroCursorSpotlight }}
        className="pointer-events-none absolute inset-0 z-[3] mix-blend-screen"
      />

      {/* Orbes Botânicos Flutuantes em Parallax com o Cursor */}
      <motion.div
        style={{ x: particleLayer1X, y: particleLayer1Y }}
        className="pointer-events-none absolute top-1/4 left-1/3 z-[3] w-96 h-96 rounded-full bg-primary/25 blur-[130px]"
      />
      <motion.div
        style={{ x: particleLayer2X, y: particleLayer2Y }}
        className="pointer-events-none absolute bottom-1/4 right-1/4 z-[3] w-80 h-80 rounded-full bg-accent/25 blur-[120px]"
      />

      {/* ═══════════════════════════════════════════════════════════════════
          CAMADA 3: CONTEÚDO PRINCIPAL + PALCO DE VIDRO 3D INTERATIVO
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="container relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Coluna Esquerda: Editorial + Seletor de Cenas de Vídeo em Tempo Real */}
        <motion.div
          style={{ y: copyY, opacity: copyOpacity }}
          className="lg:col-span-7 max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex flex-wrap items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-widest shadow-lg"
          >
            <Leaf className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent">Parceira Oficial Essential Nutrition</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="font-display text-[42px] leading-[1.04] sm:text-5xl lg:text-6xl mt-6 text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          >
            Saúde, equilíbrio e{" "}
            <em className="not-italic text-accent">nutrição limpa</em> no coração
            de Campinas.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-white/85 max-w-xl leading-relaxed drop-shadow"
          >
            A <strong className="text-white">Amaryllis Produtos Naturais</strong> é
            referência tradicional em produtos naturais, dietéticos, orgânicos,
            integrais e fitoterápicos. Curadoria completa{" "}
            <strong className="text-accent">Sem Glúten</strong> (Gluten Free
            Friendly) e <strong className="text-accent">Sem Lactose</strong> para
            o seu bem-estar diário.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.32 }}
            className="mt-8 flex flex-wrap items-center gap-3.5"
          >
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-7 h-12 rounded-full shadow-glow group border border-white/15"
            >
              <Link to="/catalogo">
                Explorar Catálogo
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md h-12 px-6 rounded-full"
            >
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2 text-accent" />
                Pedir no WhatsApp
              </a>
            </Button>
          </motion.div>

          {/* Seletor de Vídeos em Tela Cheia + 3D */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 pt-7 border-t border-white/15"
          >
            <div className="text-[11px] font-mono uppercase tracking-widest text-white/75 mb-3 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-accent fill-accent" />
              <span>
                Passe o mouse ou clique para alternar o vídeo de fundo em tempo real:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {HERO_SLIDES.map((s, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseEnter={() => {
                      setIsHovering(true);
                      setActiveSlide(idx);
                    }}
                    onClick={() => setActiveSlide(idx)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-2 backdrop-blur-md ${
                      isActive
                        ? "bg-accent text-[#0c1911] shadow-[0_0_25px_rgba(186,133,49,0.5)] scale-105"
                        : "bg-white/10 text-white/85 hover:bg-white/20 border border-white/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-[#0c1911] animate-ping" : "bg-accent"
                      }`}
                    />
                    {s.title}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* Coluna Direita: Portal 3D Flutuante que Interage com o Cursor e com o Vídeo */}
        <motion.div
          ref={cardRef}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={{ y: visualY, rotateZ: velocityTilt }}
          className="lg:col-span-5 relative [perspective:1400px] select-none"
        >
          <motion.div
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            className="relative rounded-3xl aspect-[4/5] bg-white/10 backdrop-blur-md border border-white/25 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.7)] will-change-transform p-2.5"
          >
            {/* Janela Interna de Vídeo / Imagem em Alta Definição */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/15">
              {HERO_SLIDES.map((slide, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <motion.div
                    key={slide.id}
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      scale: isActive ? 1.05 : 1.15,
                    }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <video
                      key={slide.video}
                      poster={slide.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover"
                    >
                      <source src={slide.video} type="video/mp4" />
                      <source src={slide.fallbackVideo} type="video/mp4" />
                    </video>
                  </motion.div>
                );
              })}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/15" />
            </div>

            {/* Camada 3D 1 (Topo — translateZ +50px) */}
            <motion.div
              style={{
                x: floatLayer1X,
                y: floatLayer1Y,
                translateZ: 50,
              }}
              className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between gap-2"
            >
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0c1911]/85 backdrop-blur-md text-white text-xs font-medium shadow-lg border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                {currentSlide.tag}
              </span>
              <a
                href={AMARYLLIS_COMPANY.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0c1911]/85 backdrop-blur-md text-white text-xs font-medium hover:text-accent transition-colors shadow-lg border border-white/20"
              >
                <Instagram className="w-3.5 h-3.5 text-accent" />
                @amaryllisnaturais
              </a>
            </motion.div>

            {/* Camada 3D 2 (Card Lateral Flutuante — translateZ +85px) */}
            <motion.div
              style={{
                x: floatLayer2X,
                y: floatLayer2Y,
                translateZ: 85,
              }}
              className="hidden sm:flex absolute top-1/2 -right-6 -translate-y-1/2 z-30 items-center gap-3 p-3.5 rounded-2xl bg-[#0c1911]/90 backdrop-blur-xl border border-white/25 shadow-2xl max-w-[245px] text-white"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
                  {currentSlide.priceTag}
                </div>
                <div className="font-display text-sm text-white leading-tight mt-0.5">
                  {currentSlide.secondaryPill}
                </div>
              </div>
            </motion.div>

            {/* Camada 3D 3 (Card Inferior da Loja — translateZ +65px) */}
            <motion.div
              style={{
                x: floatLayer1X,
                y: floatLayer1Y,
                translateZ: 65,
              }}
              className="absolute bottom-6 left-6 right-6 z-20 p-4 rounded-2xl bg-[#0c1911]/90 backdrop-blur-xl border border-white/25 shadow-2xl text-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {currentSlide.title}
                  </span>
                  <p className="font-display text-base sm:text-lg text-white mt-0.5 leading-snug">
                    {currentSlide.subtitle}
                  </p>
                  <p className="text-xs text-white/75 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Rua Camargo Paes, 65 · Jardim Guanabara</span>
                  </p>
                </div>
                <Link
                  to={currentSlide.link}
                  className="shrink-0 w-10 h-10 rounded-xl bg-accent text-[#0c1911] flex items-center justify-center hover:bg-accent/90 transition-colors shadow-md"
                  title={`Ver ${currentSlide.title}`}
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
