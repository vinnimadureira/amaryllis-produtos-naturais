import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  Award,
  Sparkles,
  MessageCircle,
  Truck,
  Clock,
  MapPin,
  Zap,
  Play,
  Pause,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";

/* ──────────────────────────────────────────────────────────────────────────
 * 1. HERO SLIDES DATA (4 Capítulos Cinemáticos com Vídeos HD Locais)
 * ────────────────────────────────────────────────────────────────────────── */
interface HeroSlide {
  id: string;
  badge: string;
  badgeIcon: any;
  titleLight: string;
  titleBold: string;
  description: string;
  video: string;
  poster: string;
  pillColor: string;
  stats: { value: string; label: string };
  ctaText: string;
  ctaLink: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "essential",
    badge: "Parceira Oficial Essential Nutrition",
    badgeIcon: Award,
    titleLight: "Suplementação Pura &",
    titleBold: "Alta Performance.",
    description:
      "Toda a linha Essential Nutrition à pronta-entrega em Campinas: Cacao Whey, Collagen Skin Verisol®, Creatina Pura e chocolates funcionais sem açúcar.",
    video: "/media/amaryllis-hero-functional.mp4",
    poster: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1600&q=85",
    pillColor: "from-amber-500/20 to-emerald-500/20 border-amber-400/40 text-amber-200",
    stats: { value: "100%", label: "Pureza & Absorção" },
    ctaText: "Ver Linha Essential",
    ctaLink: "/catalogo?ingrediente=Essential",
  },
  {
    id: "glutenfree",
    badge: "Selo Guindy Gluten Free Friendly",
    badgeIcon: ShieldCheck,
    titleLight: "Alimentação Segura",
    titleBold: "Sem Glúten & Sem Lactose.",
    description:
      "Curadoria rigorosa e certificada para celíacos, intolerantes e dietas limpas: pães artesanais, massas nobres, bebidas vegetais e snacks premium.",
    video: "/media/amaryllis-hero-glutenfree.mp4",
    poster: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=85",
    pillColor: "from-emerald-500/20 to-teal-500/20 border-emerald-400/40 text-emerald-200",
    stats: { value: "Zero", label: "Contaminação" },
    ctaText: "Ver Linha Sem Glúten",
    ctaLink: "/catalogo?ingrediente=Sem+Glúten",
  },
  {
    id: "granel",
    badge: "Frescor Semanal & Seleção Nobre",
    badgeIcon: Leaf,
    titleLight: "Castanhas Selecionadas,",
    titleBold: "Granel & Superfoods.",
    description:
      "Giro rápido e armazenamento impecável: Castanha-do-Pará fresca, Caju W1, sementes, farinhas funcionais e frutas desidratadas sem açúcar.",
    video: "/media/amaryllis-hero-herbs.mp4",
    poster: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1600&q=85",
    pillColor: "from-amber-600/20 to-orange-500/20 border-amber-500/40 text-amber-100",
    stats: { value: "Semanal", label: "Giro & Frescor" },
    ctaText: "Explorar Granel",
    ctaLink: "/catalogo?ingrediente=Castanhas",
  },
  {
    id: "fitoterapia",
    badge: "Medicina Botânica & Imunidade",
    badgeIcon: Sparkles,
    titleLight: "Fitoterápicos Puros &",
    titleBold: "Chás Medicinais.",
    description:
      "Sabedoria botânica respaldada pela ciência: própolis verde em alta concentração, extratos padronizados, shots anti-inflamatórios e infusões aromáticas.",
    video: "/media/amaryllis-hero-tea.mp4",
    poster: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1600&q=85",
    pillColor: "from-emerald-600/20 to-lime-500/20 border-emerald-400/40 text-emerald-100",
    stats: { value: "+180", label: "Fórmulas Puras" },
    ctaText: "Ver Fitoterápicos",
    ctaLink: "/catalogo?ingrediente=Fitoterápicos",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * 2. OBJETIVOS DE SAÚDE INTERATIVOS (Goal Navigator)
 * ────────────────────────────────────────────────────────────────────────── */
interface HealthGoal {
  id: string;
  icon: any;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  recommendedTag: string;
  buttonLabel: string;
  buttonLink: string;
  products: {
    name: string;
    badge: string;
    price: string;
    image: string;
    desc: string;
    waText: string;
  }[];
}

const HEALTH_GOALS: HealthGoal[] = [
  {
    id: "performance",
    icon: Zap,
    title: "Performance & Ganho de Massa",
    shortTitle: "Performance",
    subtitle: "Proteínas puras, colágeno bioativo e creatina sem aditivos",
    description:
      "Ideal para quem treina e busca hipertrofia limpa, recuperação rápida e saúde articular sem abrir mão da pureza biológica.",
    recommendedTag: "Linha Essential Nutrition",
    buttonLabel: "Ver suplementos",
    buttonLink: "/catalogo?ingrediente=Essential",
    products: [
      {
        name: "Cacao Whey Essential Nutrition (300g)",
        badge: "Parceira Oficial",
        price: "R$ 169,00",
        image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
        desc: "Whey hidrolisado e isolado com cacau puro e peptídeos de colágeno. Zero açúcar e sem glúten.",
        waText: "Olá! Gostaria de reservar o Cacao Whey Essential Nutrition na loja.",
      },
      {
        name: "Collagen Skin com Ácido Hialurônico (330g)",
        badge: "Verisol® Original",
        price: "R$ 185,00",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        desc: "Peptídeos bioativos de colágeno Verisol® com biotina, vitamina C e ácido hialurônico.",
        waText: "Olá! Gostaria de encomendar o Collagen Skin Essential Nutrition.",
      },
      {
        name: "Creatina Monohidratada 100% Pura (300g)",
        badge: "Alta Pureza",
        price: "R$ 119,00",
        image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80",
        desc: "Creatina micronizada pura para força explosiva, hidratação celular e recuperação muscular.",
        waText: "Olá! Gostaria de consultar a Creatina 100% Pura na Amaryllis.",
      },
    ],
  },
  {
    id: "celiacos",
    icon: ShieldCheck,
    title: "Alimentação Sem Glúten & APLV",
    shortTitle: "Sem Glúten",
    subtitle: "Segurança total para celíacos, intolerantes à lactose e dietas limpas",
    description:
      "Destaque no guia Guindy em Campinas: alimentos selecionados que eliminam o risco de contaminação cruzada para sua rotina diária.",
    recommendedTag: "Certificação Guindy",
    buttonLabel: "Ver Sem Glúten",
    buttonLink: "/catalogo?ingrediente=Sem+Glúten",
    products: [
      {
        name: "Pão Artesanal Multigrãos Sem Glúten (400g)",
        badge: "Sem Glúten & Sem Leite",
        price: "R$ 28,50",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        desc: "Massa leve e fofinha feita com farinha de arroz, linhaça dourada, chia e azeite extravirgem.",
        waText: "Olá! Gostaria de reservar o Pão Artesanal Multigrãos Sem Glúten.",
      },
      {
        name: "Chocolift Essential Nutrition 70% Cacau",
        badge: "Zero Açúcar & Sem Glúten",
        price: "R$ 29,90",
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
        desc: "Chocolate com whey protein, óleo de coco e polifenóis do cacau. Seguro para celíacos.",
        waText: "Olá! Gostaria de comprar o Chocolift Essential na Amaryllis.",
      },
      {
        name: "Bebida Vegetal de Amêndoas Pura (1L)",
        badge: "100% Vegetal",
        price: "R$ 22,00",
        image: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=800&q=80",
        desc: "Leite de amêndoas sem espessantes, sem açúcares adicionados e enriquecido com cálcio.",
        waText: "Olá! Gostaria de consultar a Bebida Vegetal de Amêndoas.",
      },
    ],
  },
  {
    id: "digestao",
    icon: Leaf,
    title: "Digestão, Intestino & Desinchaço",
    shortTitle: "Digestão",
    subtitle: "Fibras puras, probióticos naturais e infusões desintoxicantes",
    description:
      "Restaure sua microbiota e elimine a retenção com nossa seleção de psyllium puro, farinhas funcionais e chás digestivos tradicionais.",
    recommendedTag: "Giro Rápido Semanal",
    buttonLabel: "Ver Digestivos",
    buttonLink: "/catalogo?ingrediente=Granel",
    products: [
      {
        name: "Psyllium Husk Puro em Cascas (250g)",
        badge: "Fibra Nobre",
        price: "R$ 32,00",
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80",
        desc: "Fibra 100% solúvel que melhora o trânsito intestinal e auxilia no controle da saciedade.",
        waText: "Olá! Gostaria de encomendar Psyllium Husk Puro na Amaryllis.",
      },
      {
        name: "Chá Botânico Digestivo com Espinheira-Santa (100g)",
        badge: "Ervas Puras",
        price: "R$ 24,90",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
        desc: "Blend com espinheira-santa, camomila, hortelã e carqueja para alívio estomacal imediato.",
        waText: "Olá! Gostaria de reservar o Chá Digestivo com Espinheira-Santa.",
      },
      {
        name: "Castanha-do-Pará Média Fresca (250g)",
        badge: "Fonte de Selênio",
        price: "R$ 42,90",
        image: "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80",
        desc: "Castanhas crocantes selecionadas safra nova, ricas em antioxidantes e gorduras nobres.",
        waText: "Olá! Gostaria de pedir Castanha-do-Pará Fresca a granel.",
      },
    ],
  },
  {
    id: "imunidade",
    icon: Sparkles,
    title: "Imunidade, Própolis & Longevidade",
    shortTitle: "Imunidade",
    subtitle: "Defesas naturais reforçadas com fitoterapia e compostos fenólicos",
    description:
      "Aumente a resistência do organismo com própolis verde concentrada, pólen apícola silvestre, cúrcuma pura e shots matinais funcionais.",
    recommendedTag: "Fitoterapia Superior",
    buttonLabel: "Ver Imunidade",
    buttonLink: "/catalogo?ingrediente=Fitoterápicos",
    products: [
      {
        name: "Extrato de Própolis Verde Concentrado (30ml)",
        badge: "Alta Concentração",
        price: "R$ 48,00",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
        desc: "Rico em Artepellin-C, potente ação antibacteriana, anti-inflamatória e imunoestimulante.",
        waText: "Olá! Gostaria de reservar o Extrato de Própolis Verde Concentrado.",
      },
      {
        name: "Mel Silvestre Orgânico Puro (500g)",
        badge: "100% Orgânico",
        price: "R$ 38,00",
        image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
        desc: "Mel cru sem pasteurização, preservando enzimas naturais, pólen e propriedades medicinais.",
        waText: "Olá! Gostaria de encomendar o Mel Silvestre Orgânico.",
      },
      {
        name: "Cúrcuma Pura com Pimenta Preta (150g)",
        badge: "Anti-inflamatório",
        price: "R$ 29,90",
        image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80",
        desc: "Curcumina com piperina para máxima biodisponibilidade e combate à inflamação crônica.",
        waText: "Olá! Gostaria de pedir a Cúrcuma Pura na Amaryllis.",
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * 3. COMPONENTE PRINCIPAL
 * ────────────────────────────────────────────────────────────────────────── */
interface ImposingHomeExperienceProps {
  waUrl: string;
}

export const ImposingHomeExperience: React.FC<ImposingHomeExperienceProps> = ({ waUrl }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeGoal, setActiveGoal] = useState("performance");
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Auto-cycle hero
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentSlide = HERO_SLIDES[activeSlide];
  const currentGoalData = HEALTH_GOALS.find((g) => g.id === activeGoal) || HEALTH_GOALS[0];

  // Carrega configurações do Hero definidas no Painel Admin (site_settings)
  const { data: heroSettings = [] } = useQuery({
    queryKey: ["hero-video-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["hero_overlay_opacity", "hero_video_brightness", "hero_overlay_theme"]);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const rawOverlay = heroSettings.find((s: any) => s.key === "hero_overlay_opacity")?.value;
  const rawBrightness = heroSettings.find((s: any) => s.key === "hero_video_brightness")?.value;
  const rawTheme = heroSettings.find((s: any) => s.key === "hero_overlay_theme")?.value || "botanico";

  // Padrão suave: 30% de escurecimento (vídeo claro e visível!) e 100% de brilho natural
  const overlayOpacity = rawOverlay !== undefined && rawOverlay !== null ? parseFloat(rawOverlay) : 0.30;
  const videoBrightness = rawBrightness !== undefined && rawBrightness !== null ? parseFloat(rawBrightness) : 1.00;

  return (
    <div className="relative w-full bg-background text-foreground overflow-hidden">
      {/* ══════════════════════════════════════════════════════════════════
          1. HERO CINEMÁTICO FULL-BLEED (Mobile-Optimized)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[88svh] sm:min-h-[92svh] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-black">
        {/* Background Videos */}
        <div className="absolute inset-0 z-0">
          {HERO_SLIDES.map((slide, idx) => (
            <motion.div
              key={slide.id}
              initial={false}
              animate={{
                opacity: idx === activeSlide ? 1 : 0,
                scale: idx === activeSlide ? 1 : 1.05,
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 pointer-events-none"
            >
              <video
                ref={(el) => (videoRefs.current[idx] = el)}
                src={slide.video}
                poster={slide.poster}
                autoPlay
                loop
                muted
                playsInline
                style={{ filter: `brightness(${videoBrightness}) contrast(1.06) saturate(1.1)` }}
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          ))}

          {/* Overlay Dinâmico Controlado pelo Admin */}
          <div
            className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
            style={{
              opacity: overlayOpacity,
              background:
                rawTheme === "cinematic"
                  ? "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%)"
                  : rawTheme === "minimal"
                  ? "radial-gradient(ellipse 65% 80% at 25% 50%, rgba(0,0,0,0.65), transparent 75%)"
                  : "linear-gradient(to right, rgba(6,35,24,0.88) 0%, rgba(6,35,24,0.45) 50%, rgba(6,35,24,0.15) 100%)",
            }}
          />

          {/* Gradiente inferior suave para conectar com a seção seguinte */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-emerald-950 via-emerald-950/40 to-transparent pointer-events-none z-10"
            style={{ opacity: Math.min(1, overlayOpacity * 1.5) }}
          />
        </div>

        {/* Content Box */}
        <div className="relative z-20 container pt-24 sm:pt-28 lg:pt-36">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border ${currentSlide.pillColor} text-[10px] sm:text-xs font-semibold tracking-wider uppercase shadow-xl`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[240px] sm:max-w-none">{currentSlide.badge}</span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/90 text-xs font-medium">
              <MapPin className="w-3 h-3 text-accent" />
              <span>Loja no Guanabara · Aberta hoje até 18h</span>
            </div>
          </motion.div>

          <div className="mt-5 sm:mt-8 max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="font-display text-3xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                  {currentSlide.titleLight}{" "}
                  <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-200 to-amber-100 italic">
                    {currentSlide.titleBold}
                  </span>
                </h1>

                <p className="mt-4 sm:mt-6 text-sm sm:text-xl text-white/95 leading-relaxed font-light max-w-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] line-clamp-3 sm:line-clamp-none">
                  {currentSlide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 sm:mt-8 flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 sm:px-8 py-5 sm:py-6 rounded-full shadow-2xl text-sm sm:text-base group text-center"
              >
                <Link to={currentSlide.ctaLink}>
                  <span>{currentSlide.ctaText}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform inline" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-5 sm:px-7 py-5 sm:py-6 text-sm sm:text-base bg-white/10 hover:bg-white/20 text-white border-white/25 backdrop-blur-md transition-all text-center"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2 text-emerald-400 inline" />
                  Pedir no WhatsApp
                </a>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Rodapé do Hero: CARROSSEL TOUCH NO MOBILE / GRID NO DESKTOP */}
        <div className="relative z-20 container pb-5 sm:pb-8 lg:pb-12 pt-6 sm:pt-12">
          <div className="flex md:grid md:grid-cols-4 gap-2.5 sm:gap-4 p-1.5 sm:p-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-x-auto no-scrollbar snap-x snap-mandatory">
            {HERO_SLIDES.map((slide, index) => {
              const isActive = index === activeSlide;
              return (
                <button
                  key={slide.id}
                  onClick={() => {
                    setActiveSlide(index);
                    setIsPlaying(false);
                  }}
                  className={`text-left p-3 sm:p-3.5 rounded-xl transition-all relative overflow-hidden group min-w-[70vw] sm:min-w-0 shrink-0 md:shrink snap-start ${
                    isActive
                      ? "bg-white/15 border border-white/25 shadow-lg"
                      : "hover:bg-white/5 border border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Linha de Progresso */}
                  {isActive && (
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: isPlaying ? "100%" : "100%" }}
                      transition={{ duration: 7, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-emerald-400"
                    />
                  )}

                  <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-1">
                    <span>0{index + 1}</span>
                    <span className="text-[10px] uppercase tracking-wider text-accent font-sans font-semibold">
                      {slide.stats.value}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                    {slide.titleBold.replace(".", "")}
                  </p>
                  <p className="text-[11px] text-white/70 truncate mt-0.5 font-light">
                    {slide.stats.label}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-white/60 px-1">
            <span className="flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Capítulo 0{activeSlide + 1} de 04 · Deslize para navegar
            </span>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isPlaying ? "Pausar" : "Play"}
              aria-label="Pausar ou continuar"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. FAIXA DE MÉTRICAS (Carrossel Horizontal no Mobile)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-30 -mt-2 bg-gradient-to-b from-emerald-950 via-background to-background py-6 sm:py-8 border-b border-border/60">
        <div className="container">
          <div className="flex md:grid md:grid-cols-4 gap-3 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 md:pb-0">
            {[
              {
                icon: Award,
                value: "Parceira Oficial",
                label: "Essential Nutrition",
                sub: "Linha completa e lançamentos com pronta-entrega",
              },
              {
                icon: ShieldCheck,
                value: "Selo Guindy",
                label: "Gluten Free Friendly",
                sub: "Segurança total para celíacos e dietas sem glúten",
              },
              {
                icon: Leaf,
                value: "+1.800 Itens",
                label: "Rótulo 100% Limpo",
                sub: "Sem aditivos químicos ocultos ou conservantes",
              },
              {
                icon: Truck,
                value: "Giro Rápido",
                label: "Granel Nobre & Fresco",
                sub: "Castanhas, sementes e grãos frescos toda semana",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="min-w-[75vw] sm:min-w-[45vw] md:min-w-0 shrink-0 md:shrink snap-start flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-card/70 border border-border/60 shadow-soft"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                    {stat.value}
                  </span>
                  <h2 className="font-display text-sm sm:text-base font-semibold text-foreground leading-tight mt-0.5">
                    {stat.label}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-snug">
                    {stat.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. OS 4 PILARES DA CURADORIA (Carrossel Horizontal no Mobile)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 lg:py-28 bg-secondary/15">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-14 gap-4 sm:gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-[0.25em] text-primary">
                <Sparkles className="w-3.5 h-3.5" /> Curadoria Rigorosa
              </span>
              <h2 className="font-display text-2xl sm:text-5xl text-foreground font-normal mt-2 leading-tight">
                Os Quatro Pilares da nossa{" "}
                <em className="text-gradient-ember not-italic font-bold">Nutrição Limpa</em>.
              </h2>
            </div>
            <p className="text-muted-foreground max-w-md text-xs sm:text-base leading-relaxed">
              Cada produto é rigorosamente analisado para garantir pureza real, respeito às restrições alimentares e procedência de confiança.
            </p>
          </div>

          {/* Dica de arraste no mobile */}
          <div className="md:hidden flex items-center justify-between text-xs text-muted-foreground mb-3 px-1 font-mono">
            <span className="flex items-center gap-1.5 text-primary font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Deslize para explorar
            </span>
            <span>4 Pilares ➔</span>
          </div>

          {/* Container: CARROSSEL NO MOBILE / BENTO GRID NO DESKTOP */}
          <div className="flex md:grid md:grid-cols-12 gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 md:pb-0">
            {/* Pilar 1: Essential Nutrition */}
            <div className="min-w-[85vw] sm:min-w-[45vw] md:min-w-0 shrink-0 md:shrink md:col-span-7 snap-center group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/70 bg-card shadow-soft min-h-[360px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-10">
              <img
                src="https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1200&q=85"
                alt="Essential Nutrition"
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.65] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

              <div className="relative z-20">
                <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
                  Parceira Oficial
                </span>
                <h3 className="font-display text-xl sm:text-4xl text-white font-normal leading-tight">
                  Essential Nutrition: <strong className="font-bold text-amber-300">O Padrão Ouro</strong>
                </h3>
                <p className="mt-2 sm:mt-3 text-xs sm:text-base text-white/85 max-w-lg leading-relaxed">
                  Cacao Whey, Collagen Skin Verisol®, Creatina pura e Chocolift sem açúcar com pronta-entrega.
                </p>
                <div className="mt-4 sm:mt-6">
                  <Button asChild size="sm" className="rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold text-xs sm:text-sm">
                    <Link to="/catalogo?ingrediente=Essential">
                      Ver Linha Essential <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Pilar 2: Selo Guindy */}
            <div className="min-w-[85vw] sm:min-w-[45vw] md:min-w-0 shrink-0 md:shrink md:col-span-5 snap-center group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/70 bg-card shadow-soft min-h-[360px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-8">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85"
                alt="Alimentação segura sem glúten"
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.65] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

              <div className="relative z-20">
                <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
                  Selo Guindy
                </span>
                <h3 className="font-display text-xl sm:text-3xl text-white font-normal leading-tight">
                  100% <strong className="font-bold text-emerald-300">Gluten Free Friendly</strong>
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white/85 leading-relaxed">
                  Pães artesanais, massas e lanches livres de contaminação cruzada. Tranquilidade para celíacos.
                </p>
                <div className="mt-4 sm:mt-5">
                  <Button asChild variant="outline" size="sm" className="rounded-full border-white/30 text-white hover:bg-white/10 text-xs sm:text-sm">
                    <Link to="/catalogo?ingrediente=Sem+Glúten">
                      Explorar Sem Glúten <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Pilar 3: Granel Nobre */}
            <div className="min-w-[85vw] sm:min-w-[45vw] md:min-w-0 shrink-0 md:shrink md:col-span-5 snap-center group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/70 bg-card shadow-soft min-h-[340px] sm:min-h-[380px] flex flex-col justify-end p-6 sm:p-8">
              <img
                src="https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1000&q=85"
                alt="Castanhas e Granel Nobre"
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.65] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

              <div className="relative z-20">
                <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
                  Giro Semanal
                </span>
                <h3 className="font-display text-xl sm:text-3xl text-white font-normal leading-tight">
                  Castanhas & <strong className="font-bold text-amber-300">Granel Nobre</strong>
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white/85 leading-relaxed">
                  Castanha-do-Pará, Caju W1 torrado, chia, psyllium puro e farinhas funcionais fresquíssimas.
                </p>
                <div className="mt-4 sm:mt-5">
                  <Button asChild variant="outline" size="sm" className="rounded-full border-white/30 text-white hover:bg-white/10 text-xs sm:text-sm">
                    <Link to="/catalogo?ingrediente=Castanhas">
                      Ver Granel <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Pilar 4: Fitoterapia */}
            <div className="min-w-[85vw] sm:min-w-[45vw] md:min-w-0 shrink-0 md:shrink md:col-span-7 snap-center group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/70 bg-card shadow-soft min-h-[340px] sm:min-h-[380px] flex flex-col justify-end p-6 sm:p-10">
              <img
                src="https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=85"
                alt="Fitoterapia e Chás Medicinais"
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.65] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

              <div className="relative z-20">
                <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
                  Medicina Botânica
                </span>
                <h3 className="font-display text-xl sm:text-4xl text-white font-normal leading-tight">
                  Fitoterapia & <strong className="font-bold text-emerald-300">Chás Medicinais</strong>
                </h3>
                <p className="mt-2 sm:mt-3 text-xs sm:text-base text-white/85 max-w-lg leading-relaxed">
                  Extratos concentrados, Própolis Verde com Artepellin-C, cúrcuma pura e infusões tradicionais.
                </p>
                <div className="mt-4 sm:mt-6">
                  <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm">
                    <Link to="/catalogo?ingrediente=Fitoterápicos">
                      Explorar Fitoterápicos <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4. NAVEGADOR DE OBJETIVOS (Abas Deslizantes + Carrossel de Produtos)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 lg:py-28 bg-background border-y border-border/60">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-[0.25em] text-primary">
              <Zap className="w-3.5 h-3.5" /> Curadoria Inteligente
            </span>
            <h2 className="font-display text-2xl sm:text-5xl text-foreground font-normal mt-2">
              Qual é o seu objetivo de <em className="text-gradient-ember not-italic font-bold">saúde hoje?</em>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-base mt-2 sm:mt-3">
              Selecione o seu foco para ver os produtos recomendados:
            </p>
          </div>

          {/* Abas Deslizantes no Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8 justify-start sm:justify-center">
            {HEALTH_GOALS.map((goal) => {
              const isSelected = goal.id === activeGoal;
              const Icon = goal.icon;
              return (
                <button
                  key={goal.id}
                  onClick={() => setActiveGoal(goal.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-6 sm:py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">{goal.shortTitle}</span>
                  <span className="hidden sm:inline">{goal.title}</span>
                </button>
              );
            })}
          </div>

          {/* Conteúdo Dinâmico */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentGoalData.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-5 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-secondary/30 border border-border/80 shadow-soft"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 pb-6 border-b border-border/60 mb-6 sm:mb-8">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                    {currentGoalData.recommendedTag}
                  </span>
                  <h3 className="font-display text-xl sm:text-3xl text-foreground font-semibold mt-1">
                    {currentGoalData.subtitle}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-base mt-1.5 max-w-2xl leading-relaxed">
                    {currentGoalData.description}
                  </p>
                </div>

                <Button asChild size="sm" className="rounded-full shrink-0 self-start lg:self-auto text-xs sm:text-sm">
                  <Link to={currentGoalData.buttonLink}>
                    {currentGoalData.buttonLabel} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>

              {/* Grid / Carrossel de 3 Produtos Recomendados */}
              <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 sm:pb-0">
                {currentGoalData.products.map((prod) => (
                  <div
                    key={prod.name}
                    className="min-w-[75vw] sm:min-w-0 shrink-0 sm:shrink snap-start p-4 rounded-xl sm:rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative rounded-lg sm:rounded-xl overflow-hidden aspect-[4/3] mb-3 bg-muted">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                          {prod.badge}
                        </span>
                      </div>
                      <h4 className="font-display text-sm sm:text-lg text-foreground font-semibold leading-snug line-clamp-2">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                        {prod.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="font-mono text-sm sm:text-lg font-bold text-primary">
                        {prod.price}
                      </span>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 sm:h-8 px-2.5 rounded-full text-xs hover:bg-primary hover:text-primary-foreground"
                      >
                        <a
                          href={`https://wa.me/${AMARYLLIS_COMPANY.whatsapp}?text=${encodeURIComponent(
                            prod.waText
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Reservar
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5. MANIFESTO & COMPROMISSO DE PUREZA (Cinemático)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden bg-emerald-950 text-white">
        <video
          src="/media/amaryllis-hero-tea.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/80 to-emerald-950/60" />

        <div className="relative z-10 container">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-emerald-300">
              <Leaf className="w-3 h-3" /> Tradição & Curadoria em Campinas
            </span>

            <h2 className="font-display text-2xl sm:text-5xl lg:text-6xl font-normal leading-tight mt-4 sm:mt-6">
              "Mais do que produtos naturais, nós cuidamos da{" "}
              <em className="text-amber-300 not-italic font-bold">confiança</em> do que entra no seu corpo."
            </h2>

            <p className="mt-4 sm:mt-6 text-xs sm:text-lg text-white/80 leading-relaxed font-light">
              Nossa loja física no Jardim Guanabara elimina as incertezas sobre rótulos e restrições: oferecemos suplementação pura e alimentos verdadeiros com suporte consultivo de quem entende.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6 pt-6 border-t border-white/15">
              <div>
                <h4 className="font-display text-lg sm:text-2xl font-bold text-amber-200">100%</h4>
                <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">Conferência de rótulos</p>
              </div>
              <div>
                <h4 className="font-display text-lg sm:text-2xl font-bold text-emerald-300">Pronta-Entrega</h4>
                <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">Linha Essential e Granel</p>
              </div>
              <div>
                <h4 className="font-display text-lg sm:text-2xl font-bold text-amber-200">Campinas</h4>
                <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">Rua Camargo Paes, 65</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          6. CONVITE À LOJA FÍSICA NO JARDIM GUANABARA
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 lg:py-24 bg-card border-b border-border/60">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-secondary/20 border border-border/80 shadow-soft">
            <div className="lg:col-span-7">
              <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                Atendimento Próximo & Especializado
              </span>
              <h2 className="font-display text-2xl sm:text-4xl text-foreground font-semibold mt-1.5 sm:mt-2">
                Venha nos visitar e conhecer nossa loja física.
              </h2>
              <p className="text-muted-foreground text-xs sm:text-base mt-3 sm:mt-4 leading-relaxed max-w-xl">
                Nossa equipe está pronta para te receber na Rua Camargo Paes, 65. Traga sua lista médica ou nutricional — separamos cada item com você.
              </p>

              <div className="mt-5 space-y-2 text-xs sm:text-sm text-foreground/90">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    <strong>Seg a Sex:</strong> 08h30 — 18h00 · <strong>Sáb:</strong> 08h30 — 13h00
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Rua Camargo Paes, 65 — Guanabara, Campinas</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    Enviar Lista no WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-full text-xs sm:text-sm">
                  <a href={AMARYLLIS_COMPANY.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Como Chegar (Maps)
                  </a>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-border aspect-[16/10] sm:aspect-[4/3] bg-muted">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85"
                alt="Ambiente Amaryllis Produtos Naturais Campinas"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
