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
import { AMARYLLIS_COMPANY, AMARYLLIS_PRODUCTS } from "@/lib/amaryllisFallbackData";
import { extractSummary } from "@/lib/htmlUtils";

const PRODUCT_BY_ID = new Map(AMARYLLIS_PRODUCTS.map((p) => [p.id, p]));

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
  productIds: string[];
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
    recommendedTag: "Linha Essential & Vitafor",
    buttonLabel: "Ver suplementos",
    buttonLink: "/catalogo?categoria=Essential+Nutrition",
    productIds: [
      "essential-cacao-whey-900g",
      "essential-collagen-skin-neutro-300g",
      "vitafor-creafort-300g",
    ],
  },
  {
    id: "celiacos",
    icon: ShieldCheck,
    title: "Alimentação Sem Glúten & APLV",
    shortTitle: "Sem Glúten",
    subtitle: "Segurança total para celíacos, intolerantes à lactose e dietas limpas",
    description:
      "Destaque no guia Guindy: alimentos selecionados que eliminam o risco de contaminação cruzada para sua rotina diária.",
    recommendedTag: "Certificação Guindy",
    buttonLabel: "Ver Sem Glúten",
    buttonLink: "/catalogo?categoria=Sem+Gl%C3%BAten+%26+Sem+Lactose",
    productIds: [
      "belive-pao-de-mel-zero-45g",
      "alere-biscoito-castanha-quinoa-70g",
      "a-tal-da-castanha-amendoa-1l",
    ],
  },
  {
    id: "digestao",
    icon: Leaf,
    title: "Digestão, Intestino & Desinchaço",
    shortTitle: "Digestão",
    subtitle: "Aloe vera, fibras puras e chás digestivos tradicionais",
    description:
      "Restaure sua microbiota e elimine a retenção com nossa seleção de sucos funcionais, massas de fibra konjac e chás tradicionais.",
    recommendedTag: "Giro Rápido Semanal",
    buttonLabel: "Ver Digestivos",
    buttonLink: "/catalogo?categoria=Fitoter%C3%A1picos+%26+Ch%C3%A1s",
    productIds: [
      "forever-aloe-vera-gel-1l",
      "greenbios-cha-espinheira-santa-20g",
      "konjac-massa-mf-noodles-270g",
    ],
  },
  {
    id: "imunidade",
    icon: Sparkles,
    title: "Imunidade, Vitaminas & Longevidade",
    shortTitle: "Imunidade",
    subtitle: "Defesas naturais reforçadas com fitoterapia e suplementação pura",
    description:
      "Aumente a resistência do organismo com vitaminas lipossolúveis, extratos botânicos Panizza e cúrcuma nativa.",
    recommendedTag: "Fitoterapia & Vitaminas",
    buttonLabel: "Ver Imunidade",
    buttonLink: "/catalogo?categoria=Suplementos+%26+Prote%C3%ADnas",
    productIds: [
      "now-vitamin-d3-k2-120caps",
      "panizza-tintura-equinacea-100ml",
      "color-andina-curcuma-longa-100g",
    ],
  },
];

interface PillarConfig {
  id: string;
  colSpan: string;
  bgClass: string;
  badge: string;
  badgeClass: string;
  titlePrefix: string;
  titleHighlight: string;
  highlightClass: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
  ctaClass: string;
  productIds: string[];
}

const PILLARS: PillarConfig[] = [
  {
    id: "essential",
    colSpan: "md:col-span-7",
    bgClass: "bg-gradient-to-br from-[#10261c] via-[#173628] to-[#233d2c] text-white",
    badge: "Parceira Oficial",
    badgeClass: "bg-amber-400/20 border-amber-400/40 text-amber-200",
    titlePrefix: "Essential Nutrition: ",
    titleHighlight: "O Padrão Ouro",
    highlightClass: "text-amber-300",
    description: "Cacao Whey, Vanilla Whey, Collagen Skin Verisol® e suplementação clínica com pronta-entrega.",
    ctaLabel: "Ver Linha Essential",
    ctaLink: "/catalogo?categoria=Essential+Nutrition",
    ctaClass: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold",
    productIds: [
      "essential-cacao-whey-900g",
      "essential-vanilla-whey-900g",
      "essential-collagen-skin-neutro-300g",
    ],
  },
  {
    id: "sem-gluten",
    colSpan: "md:col-span-5",
    bgClass: "bg-gradient-to-br from-[#123326] via-[#1b4634] to-[#122b20] text-white",
    badge: "Selo Guindy",
    badgeClass: "bg-emerald-400/20 border-emerald-300/40 text-emerald-200",
    titlePrefix: "100% ",
    titleHighlight: "Gluten Free Friendly",
    highlightClass: "text-emerald-300",
    description: "Snacks Belive, biscoitos Alere, leites vegetais e massas livres de contaminação cruzada.",
    ctaLabel: "Explorar Sem Glúten",
    ctaLink: "/catalogo?categoria=Sem+Gl%C3%BAten+%26+Sem+Lactose",
    ctaClass: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold",
    productIds: [
      "belive-pao-de-mel-zero-45g",
      "alere-biscoito-castanha-quinoa-70g",
      "a-tal-da-castanha-amendoa-1l",
    ],
  },
  {
    id: "organicos",
    colSpan: "md:col-span-5",
    bgClass: "bg-gradient-to-br from-[#2d2415] via-[#3c2f1b] to-[#1f2418] text-white",
    badge: "Superfoods & Integrais",
    badgeClass: "bg-amber-400/20 border-amber-300/40 text-amber-200",
    titlePrefix: "Orgânicos & ",
    titleHighlight: "Superalimentos",
    highlightClass: "text-amber-300",
    description: "Cacau selvagem Color Andina, Laranja Moro Souly, stevia pura e granolas low carb.",
    ctaLabel: "Ver Orgânicos",
    ctaLink: "/catalogo?categoria=Org%C3%A2nicos+%26+Integrais",
    ctaClass: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold",
    productIds: [
      "souly-laranja-moro-po-300g",
      "color-andina-cacau-selvagem-200g",
      "color-andina-curcuma-longa-100g",
    ],
  },
  {
    id: "fitoterapia",
    colSpan: "md:col-span-7",
    bgClass: "bg-gradient-to-br from-[#0e2a21] via-[#163b2f] to-[#0f221b] text-white",
    badge: "Medicina Botânica",
    badgeClass: "bg-emerald-400/20 border-emerald-300/40 text-emerald-200",
    titlePrefix: "Fitoterapia & ",
    titleHighlight: "Chás Medicinais",
    highlightClass: "text-emerald-300",
    description: "Tinturas botânicas Panizza, ervas medicinais do Vale do Ribeira, Aloe Vera e suplementos NOW & Vitafor.",
    ctaLabel: "Explorar Fitoterápicos",
    ctaLink: "/catalogo?categoria=Fitoter%C3%A1picos+%26+Ch%C3%A1s",
    ctaClass: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold",
    productIds: [
      "panizza-tintura-acafrao-100ml",
      "panizza-tintura-equinacea-100ml",
      "cha-calendula-flores-30g",
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
                  : "linear-gradient(to right, rgba(10,20,15,0.78) 0%, rgba(8,16,12,0.4) 50%, rgba(0,0,0,0.1) 100%)",
            }}
          />

          {/* Gradiente inferior suave com neutralidade total (sem contaminar controles de vídeo) */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10"
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
      <section className="relative z-30 -mt-2 bg-background py-6 sm:py-8 border-b border-border/60">
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
            {PILLARS.map((pillar) => {
              const pillarProducts = pillar.productIds
                .map((pid) => PRODUCT_BY_ID.get(pid))
                .filter((p): p is NonNullable<typeof p> => Boolean(p));

              return (
                <div
                  key={pillar.id}
                  className={`min-w-[85vw] sm:min-w-[45vw] md:min-w-0 shrink-0 md:shrink ${pillar.colSpan} snap-center group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 ${pillar.bgClass} shadow-soft min-h-[360px] sm:min-h-[410px] flex flex-col justify-between p-6 sm:p-8`}
                >
                  {/* Vitrine com 3 produtos reais cadastrados */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
                    {pillarProducts.map((prod) => (
                      <Link
                        key={prod.id}
                        to={`/produto/${prod.id}`}
                        className="group/item bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center"
                      >
                        <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover/item:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <span className="mt-1.5 text-[10px] sm:text-xs font-medium text-slate-800 line-clamp-1 w-full">
                          {prod.name.split("—")[0].trim()}
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold text-primary">
                          {prod.price_display}
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="relative z-10">
                    <span
                      className={`inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 ${pillar.badgeClass}`}
                    >
                      {pillar.badge}
                    </span>
                    <h3 className="font-display text-xl sm:text-3xl text-white font-normal leading-tight">
                      {pillar.titlePrefix}
                      <strong className={`font-bold ${pillar.highlightClass}`}>
                        {pillar.titleHighlight}
                      </strong>
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-white/85 max-w-lg leading-relaxed">
                      {pillar.description}
                    </p>
                    <div className="mt-4 sm:mt-5">
                      <Button asChild size="sm" className={`rounded-full text-xs sm:text-sm shadow-sm ${pillar.ctaClass}`}>
                        <Link to={pillar.ctaLink}>
                          {pillar.ctaLabel} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
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

              {/* Grid / Carrossel de 3 Produtos Reais Recomendados */}
              <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 sm:pb-0">
                {currentGoalData.productIds
                  .map((pid) => PRODUCT_BY_ID.get(pid))
                  .filter((prod): prod is NonNullable<typeof prod> => Boolean(prod))
                  .map((prod) => (
                    <div
                      key={prod.id}
                      className="min-w-[75vw] sm:min-w-0 shrink-0 sm:shrink snap-start p-4 rounded-xl sm:rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between group"
                    >
                      <Link to={`/produto/${prod.id}`} className="block">
                        <div className="relative rounded-lg sm:rounded-xl overflow-hidden aspect-[4/3] mb-3 bg-white p-3 border border-border/40">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                          {prod.sku && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-secondary text-foreground/80 font-mono text-[10px] font-medium border border-border">
                              {prod.sku}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {prod.category}
                        </span>
                        <h4 className="font-display text-sm sm:text-lg text-foreground font-semibold leading-snug line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                          {extractSummary(prod.description, 140).summary}
                        </p>
                      </Link>

                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <span className="font-mono text-sm sm:text-lg font-bold text-primary">
                          {prod.price_display}
                        </span>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-7 sm:h-8 px-3 rounded-full text-xs hover:bg-primary hover:text-primary-foreground"
                        >
                          <Link to={`/produto/${prod.id}`}>
                            Ver produto <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
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
              <Leaf className="w-3 h-3" /> Tradição & Curadoria
            </span>

            <h2 className="font-display text-2xl sm:text-5xl lg:text-6xl font-normal leading-tight mt-4 sm:mt-6">
              "Mais do que produtos naturais, nós cuidamos da{" "}
              <em className="text-amber-300 not-italic font-bold">confiança</em> do que entra no seu corpo."
            </h2>

            <p className="mt-4 sm:mt-6 text-xs sm:text-lg text-white/80 leading-relaxed font-light">
              Eliminamos as incertezas sobre rótulos e restrições: oferecemos suplementação pura e alimentos verdadeiros com suporte consultivo de quem entende.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-8 pt-6 border-t border-white/15 max-w-md">
              <div>
                <h4 className="font-display text-lg sm:text-2xl font-bold text-amber-200">100%</h4>
                <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">Conferência de rótulos</p>
              </div>
              <div>
                <h4 className="font-display text-lg sm:text-2xl font-bold text-emerald-300">Pronta-Entrega</h4>
                <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">Linha Essential e Granel</p>
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
