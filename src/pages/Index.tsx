import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Leaf,
  Sparkles,
  ShieldCheck,
  Truck,
  MessageCircle,
  Instagram,
  CheckCircle2,
  Award,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SectionTitle from "@/components/SectionTitle";
import ProductCard from "@/components/ProductCard";
import TestimonialCard from "@/components/TestimonialCard";
import SEO from "@/components/SEO";
import { localBusinessJsonLd, websiteJsonLd } from "@/components/JsonLd";
import MobileCarousel from "@/components/MobileCarousel";
import { InteractiveBotanicalHero } from "@/components/InteractiveBotanicalHero";
import {
  ScrollInteractiveShowcase,
  ParallaxTiltImage,
  InteractiveBentoCard,
} from "@/components/InteractiveScrollMedia";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import { useSiteMedia } from "@/hooks/useSiteMedia";
import {
  AMARYLLIS_COMPANY,
  AMARYLLIS_PRODUCTS,
  AMARYLLIS_TESTIMONIALS,
} from "@/lib/amaryllisFallbackData";

import suplementosImg from "@/assets/produtos/massa-crua-pack.jpg.asset.json";
import granelImg from "@/assets/produtos/massa-preassada.jpg.asset.json";
import glutenFreeImg from "@/assets/produtos/kit-diy.jpg.asset.json";
import storeHandsImg from "@/assets/mrcone-hands.jpg.asset.json";

import catEssentialAsset from "@/assets/sabores/margherita.jpg.asset.json";
import catGlutenFreeAsset from "@/assets/sabores/pepperoni.jpg.asset.json";
import catCastanhasAsset from "@/assets/sabores/quatro-queijos.jpg.asset.json";
import catFitoterapicosAsset from "@/assets/sabores/calabresa.jpg.asset.json";
import catSemLactoseAsset from "@/assets/sabores/frango-catupiry.jpg.asset.json";
import catOrganicosAsset from "@/assets/sabores/portuguesa.jpg.asset.json";
import catDieteticosAsset from "@/assets/sabores/cone-integral.jpg.asset.json";
import catChocolatesAsset from "@/assets/sabores/doce-nutella-morango.jpg.asset.json";
import catMelPropolisAsset from "@/assets/sabores/doce-romeu-julieta.jpg.asset.json";
import catTemperosAsset from "@/assets/sabores/cone-chocolate.jpg.asset.json";

const vitrines = [
  {
    mediaKey: "sabores.margherita",
    img: catEssentialAsset.url,
    name: "Essential Nutrition",
    tag: "Parceira Oficial",
    desc: "Whey hidrolisado e isolado, Collagen Skin, Chocolift, creatina e aminoácidos com pronta-entrega em Campinas.",
  },
  {
    mediaKey: "sabores.pepperoni",
    img: catGlutenFreeAsset.url,
    name: "Sem Glúten (Gluten Free)",
    tag: "Selo Guindy",
    desc: "Pães, massas, biscoitos, farinhas especiais e snacks seguros para celíacos e dietas com restrição ao glúten.",
  },
  {
    mediaKey: "sabores.quatro_queijos",
    img: catCastanhasAsset.url,
    name: "Castanhas & Granel",
    tag: "Sempre Fresco",
    desc: "Castanha-do-pará, caju W1, amêndoas, nozes, sementes, frutas secas e farinhas funcionais selecionadas.",
  },
  {
    mediaKey: "sabores.calabresa",
    img: catFitoterapicosAsset.url,
    name: "Fitoterápicos & Chás",
    tag: "Tradição",
    desc: "Ervas medicinais, chás calmantes e digestivos, extratos naturais e fitoterápicos para o equilíbrio diário.",
  },
  {
    mediaKey: "sabores.frango_catupiry",
    img: catSemLactoseAsset.url,
    name: "Sem Lactose & Vegetais",
    tag: "Leveza",
    desc: "Bebidas vegetais de amêndoas, aveia e coco, iogurtes, queijos veganos e delícias zero lactose.",
  },
  {
    mediaKey: "sabores.portuguesa",
    img: catOrganicosAsset.url,
    name: "Orgânicos & Integrais",
    tag: "Puro",
    desc: "Grãos integrais, aveia sem glúten, azeites, granolas artesanais e alimentos certificados livres de agrotóxicos.",
  },
  {
    mediaKey: "sabores.integral",
    img: catDieteticosAsset.url,
    name: "Dietéticos & Zero Açúcar",
    tag: "Baixo IG",
    desc: "Adoçantes naturais (xilitol, eritritol, stevia, taumatina), geleias 100% fruta e doces para diabéticos.",
  },
  {
    mediaKey: "sabores.nutella_morango",
    img: catChocolatesAsset.url,
    name: "Chocolates Funcionais",
    tag: "70% Cacau",
    desc: "Chocolates proteicos, veganos, zero açúcar e ricos em polifenóis do cacau para matar a vontade com saúde.",
  },
  {
    mediaKey: "sabores.romeu_julieta",
    img: catMelPropolisAsset.url,
    name: "Mel, Própolis & Imunidade",
    tag: "Defesa Natural",
    desc: "Mel orgânico silvestre, própolis verde e vermelha, pólen apícola, cúrcuma e shots matinais.",
  },
  {
    mediaKey: "sabores.chocolate",
    img: catTemperosAsset.url,
    name: "Especiarias & Superfoods",
    tag: "Aroma & Saúde",
    desc: "Temperos puros sem glutamato, sal integral, spirulina, chlorella, maca peruana e psyllium.",
  },
];

const howSteps = [
  {
    icon: Leaf,
    title: "Escolha seus produtos",
    desc: "Explore nosso catálogo online ou envie sua lista nutricional. Nossa equipe ajuda a conferir rótulos e restrições.",
  },
  {
    icon: MessageCircle,
    title: "Peça pelo Site ou WhatsApp",
    desc: "Compre direto pelo site ou fale com nossa equipe no WhatsApp (19) 99351-2766 para um atendimento personalizado.",
  },
  {
    icon: Truck,
    title: "Delivery ou Retirada na Loja",
    desc: "Receba com agilidade em Campinas ou retire na nossa loja tradicional na Rua Camargo Paes, 65 — Jardim Guanabara.",
  },
];

const isLegacyProduct = (name?: string) => {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes("cone") || lower.includes("pizza");
};

const isLegacyTestimonial = (text?: string) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return lower.includes("cone") || lower.includes("pizzaria") || lower.includes("food truck");
};

const Index = () => {
  const { toggle, isFavorite } = useWishlist();
  const { getMedia, getMeta } = useSiteMedia();

  const suplementosUrl = getMedia("home.produto_massa_crua", suplementosImg.url);
  const granelUrl = getMedia("home.produto_massa_assada", granelImg.url);
  const glutenFreeUrl = getMedia("home.produto_kit_diy", glutenFreeImg.url);
  const heroBannerUrl = getMedia("home.hero_banner", storeHandsImg.url);

  const { data: rawProducts = [] } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) return AMARYLLIS_PRODUCTS.slice(0, 8);
      return data || [];
    },
  });

  const products =
    rawProducts.length > 0 && !rawProducts.some((p: any) => isLegacyProduct(p.name))
      ? rawProducts
      : AMARYLLIS_PRODUCTS.slice(0, 8);

  const { data: rawTestimonials = [] } = useQuery({
    queryKey: ["home-testimonials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .eq("active", true)
        .order("display_order")
        .limit(6);
      return data || [];
    },
  });

  const testimonials =
    rawTestimonials.length > 0 && !rawTestimonials.some((t: any) => isLegacyTestimonial(t.text))
      ? rawTestimonials
      : AMARYLLIS_TESTIMONIALS;

  const waUrl = `https://wa.me/${AMARYLLIS_COMPANY.whatsapp}?text=${encodeURIComponent(
    "Olá, Amaryllis Produtos Naturais! Vi o site e gostaria de consultar produtos."
  )}`;

  return (
    <main className="overflow-x-clip">
      <SEO
        title="Produtos Naturais, Suplementos, Sem Glúten e Fitoterápicos em Campinas"
        description="Amaryllis Produtos Naturais no Jardim Guanabara, Campinas (Rua Camargo Paes, 65). Parceira oficial Essential Nutrition, produtos naturais, dietéticos, orgânicos, integrais, sem glúten e sem lactose."
        jsonLd={[localBusinessJsonLd, websiteJsonLd]}
      />

      {/* ───────── 1. HERO INTERATIVO 3D (CURSOR + SCROLL PARALLAX) ───────── */}
      <InteractiveBotanicalHero defaultHeroImage={heroBannerUrl} waUrl={waUrl} />

      {/* ───────── 2. EXPERIÊNCIA STICKY SCROLL-SCRUBBING + CURSOR 3D ───────── */}
      <ScrollInteractiveShowcase />

      {/* ───────── 3. PRODUTOS EM DESTAQUE ───────── */}
      {products.length > 0 && (
        <section className="py-16 lg:py-24 border-b border-border/60 bg-background">
          <div className="container">
            <SectionTitle
              title="Destaques da Amaryllis"
              subtitle="Suplementos, itens sem glúten, sem lactose, castanhas nobres e fitoterápicos selecionados"
            />
            <div className="sm:hidden mt-8">
              <MobileCarousel itemWidthClass="w-[78%]">
                {products.map((p: any) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    image={p.image_url || "/placeholder.svg"}
                    name={p.name}
                    description={p.description || ""}
                    price={p.price_display}
                    priceNum={p.price}
                    category={p.category}
                    isFavorite={isFavorite(p.id)}
                    onToggleFavorite={toggle}
                  />
                ))}
              </MobileCarousel>
            </div>
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
              {products.map((p: any) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  image={p.image_url || "/placeholder.svg"}
                  name={p.name}
                  description={p.description || ""}
                  price={p.price_display}
                  priceNum={p.price}
                  category={p.category}
                  isFavorite={isFavorite(p.id)}
                  onToggleFavorite={toggle}
                />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button
                asChild
                variant="outline"
                className="rounded-full border-primary/40 text-primary hover:bg-primary/10 px-7"
              >
                <Link to="/catalogo">
                  Ver catálogo completo <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ───────── 4. ZIGZAG 1 — PARCEIRA OFICIAL ESSENTIAL NUTRITION (COM PARALLAX + TILT 3D) ───────── */}
      <section className="py-20 lg:py-28">
        <div className="container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <ParallaxTiltImage
              src={suplementosUrl}
              alt="Suplementos e Nutrição Funcional — Parceira Oficial Essential Nutrition em Campinas"
              badgeTop="Parceira Oficial Essential Nutrition"
              badgeBottomTitle="Nutrição Clínica & Esportiva"
              badgeBottomSubtitle="Whey Hidrolisado, Colágeno Verisol® e Creatina Pura"
              accentColor="sage"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <Award className="w-4 h-4" /> 01 / Suplementação Premium
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3 leading-[1.08]">
              Parceira Oficial{" "}
              <em className="text-gradient-ember not-italic">Essential Nutrition</em> em
              Campinas.
            </h2>
            <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg">
              Trabalhamos com as marcas mais respeitadas de nutrição funcional, clínica e
              esportiva. Proteínas isoladas e hidrolisadas, colágenos Verisol®, creatina
              pura, ômega-3 certificado, vitaminas e chocolates funcionais sem açúcar.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Essential Nutrition",
                "Sanavita",
                "Whey Isolado & Vegano",
                "Colágeno & Longevidade",
                "Creatina 100% Pura",
              ].map((s) => (
                <span
                  key={s}
                  className="px-3.5 py-1.5 rounded-full bg-card border border-border text-xs sm:text-sm font-medium text-foreground/85"
                >
                  {s}
                </span>
              ))}
            </div>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full"
            >
              <Link to="/catalogo?ingrediente=Essential">
                Ver suplementos e funcionais <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ───────── 5. ZIGZAG 2 — SEM GLÚTEN & SEM LACTOSE (GUINDY) ───────── */}
      <section className="py-20 lg:py-28 bg-secondary/25 border-y border-border/50">
        <div className="container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:order-2"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[hsl(var(--brand-brasa))]">
              <ShieldCheck className="w-4 h-4" /> 02 / Restrições Alimentares com Segurança
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3 leading-[1.08]">
              Referência{" "}
              <em className="text-gradient-ember not-italic">Gluten Free Friendly</em> e
              Sem Lactose.
            </h2>
            <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg">
              Reconhecida no guia <strong>Guindy</strong> em Campinas, a Amaryllis oferece
              uma curadoria rigorosa de alimentos industrializados e artesanais sem glúten,
              sem lactose e sem açúcar adicionado — para que você compre com total
              tranquilidade.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-foreground/90">
              {[
                "Pães, torradas, massas e misturas para bolo 100% sem glúten",
                "Bebidas vegetais, chocolates e snacks sem leite e derivados",
                "Linha completa de dietéticos para controle glicêmico",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full"
            >
              <Link to="/catalogo?ingrediente=Sem+Glúten">
                Explorar linha Sem Glúten &amp; Sem Lactose{" "}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:order-1"
          >
            <ParallaxTiltImage
              src={glutenFreeUrl}
              alt="Produtos sem glúten e sem lactose na Amaryllis Produtos Naturais"
              badgeTop="Selo Guindy · Gluten Free Friendly"
              badgeBottomTitle="Zero Glúten & Zero Lactose"
              badgeBottomSubtitle="Segurança e sabor para celíacos e intolerantes"
              accentColor="terracotta"
            />
          </motion.div>
        </div>
      </section>

      {/* ───────── 6. COMO FUNCIONA ───────── */}
      <section className="py-20 lg:py-28 bg-secondary/40 border-b border-border/60">
        <div className="container">
          <SectionTitle
            title="Atendimento próximo e descomplicado"
            subtitle="Compre online, peça pelo WhatsApp ou visite nossa loja no Jardim Guanabara"
          />
          <div className="grid md:grid-cols-3 gap-8 mt-14">
            {howSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative p-8 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-soft transition-all hover:-translate-y-1 group"
                >
                  <span className="absolute top-6 right-6 font-display text-5xl text-primary/15 group-hover:text-primary/30 transition-colors">
                    0{i + 1}
                  </span>
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl mb-3 text-foreground">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── 7. ZIGZAG 3 — FITOTERÁPICOS, GRANEL & ORGÂNICOS ───────── */}
      <section className="py-20 lg:py-28">
        <div className="container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <ParallaxTiltImage
              src={granelUrl}
              alt="Produtos naturais, grãos integrais, castanhas e fitoterápicos na Amaryllis"
              badgeTop="Giro Constante · Sempre Fresco"
              badgeBottomTitle="Fitoterápicos, Chás & Granel"
              badgeBottomSubtitle="Castanhas nobres, ervas medicinais, mel e própolis"
              accentColor="gold"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              03 / Por que escolher a Amaryllis
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3 leading-[1.08]">
              Tradição em{" "}
              <em className="text-gradient-ember not-italic">
                fitoterápicos, orgânicos
              </em>{" "}
              e produtos a granel.
            </h2>
            <ul className="mt-8 space-y-5">
              {[
                {
                  t: "Frescor e Giro Constante",
                  d: "Castanhas, oleaginosas, sementes, farinhas e grãos sempre crocantes, bem acondicionados e selecionados.",
                },
                {
                  t: "Fitoterápicos e Chás Medicinais",
                  d: "Ampla variedade de ervas, chás, extratos de própolis, óleos naturais e suplementos fitoterápicos.",
                },
                {
                  t: "Curadoria para Nutricionistas e Pacientes",
                  d: "Você traz seu plano alimentar e nossa equipe separa todos os itens na quantidade exata que você precisa.",
                },
                {
                  t: "Tradição no Jardim Guanabara",
                  d: "Fácil acesso na Rua Camargo Paes, 65 em Campinas, com atendimento acolhedor que conhece você pelo nome.",
                },
              ].map((f) => (
                <li key={f.t} className="flex gap-4">
                  <div className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
                  <div>
                    <div className="font-display text-xl text-foreground">{f.t}</div>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ───────── 8. BENTO GRID INTERATIVO 3D DE LINHAS E ESPECIALIDADES ───────── */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-secondary/30 border-t border-border/50">
        <div className="container">
          <SectionTitle
            title="O que você encontra na Amaryllis"
            subtitle="Uma loja completa para sua rotina saudável em Campinas — passe o cursor sobre os cards"
          />
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed">
            Dos suplementos de alta pureza aos grãos orgânicos e chás medicinais — tudo
            reunido em um só lugar no Jardim Guanabara.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-12 auto-rows-[190px] md:auto-rows-[250px] [perspective:1200px]">
            {vitrines.map((s, i) => {
              const isFeatured = i === 0 || i === 4;
              const meta = getMeta(s.mediaKey);
              const name = meta.name?.trim() || s.name;
              const tag = meta.tag?.trim() || s.tag;
              const desc = meta.description?.trim() || s.desc;
              return (
                <InteractiveBentoCard
                  key={s.mediaKey}
                  className={
                    isFeatured ? "row-span-2 col-span-2 lg:col-span-2" : "col-span-1"
                  }
                >
                  <img
                    src={getMedia(s.mediaKey, s.img)}
                    alt={`${name} — ${desc}`}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                  <span className="absolute top-3 left-3 md:top-4 md:left-4 z-10 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[10px] md:text-xs font-mono uppercase tracking-wider text-white">
                    {tag}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 z-10">
                    <h3
                      className={`font-display leading-tight text-white drop-shadow-lg ${
                        isFeatured ? "text-2xl md:text-4xl" : "text-lg md:text-2xl"
                      }`}
                    >
                      {name}
                    </h3>
                    <p
                      className={`text-white/85 mt-2 leading-snug transition-all duration-500 ${
                        isFeatured
                          ? "text-sm md:text-base max-h-32 opacity-100"
                          : "text-xs max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-2"
                      }`}
                    >
                      {desc}
                    </p>
                  </div>

                  <div className="absolute inset-0 rounded-2xl md:rounded-3xl ring-0 ring-primary group-hover:ring-2 transition-all duration-300 pointer-events-none" />
                </InteractiveBentoCard>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full h-12 px-8 shadow-warm-glow"
            >
              <Link to="/catalogo">
                Consultar produtos no catálogo <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ───────── 9. DEPOIMENTOS ───────── */}
      {testimonials.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="container">
            <SectionTitle
              title="Quem conhece a Amaryllis, recomenda"
              subtitle="O carinho de clientes e nutricionistas de Campinas"
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {testimonials.slice(0, 6).map((t: any) => (
                <TestimonialCard
                  key={t.id}
                  name={t.name}
                  text={t.text}
                  rating={t.rating}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── 10. CTA FINAL & VISITE A LOJA ───────── */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-brand-deep text-white">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[300px] bg-primary/25 blur-[130px] rounded-full" />
        <div className="container relative text-center max-w-3xl">
          <Sparkles className="w-8 h-8 text-accent mx-auto mb-5" />
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.08] text-white">
            Visite nossa loja no Jardim Guanabara ou peça pelo WhatsApp.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            📍 <strong>Rua Camargo Paes, 65 — Jardim Guanabara, Campinas - SP</strong>{" "}
            (CEP: 13073-350)
            <br />
            📞 Fixo: (19) 3243-5982 · 💬 WhatsApp: (19) 99351-2766
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full h-13 px-8 shadow-glow"
            >
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" />
                Chamar no WhatsApp (19) 99351-2766
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-full h-13 px-7 bg-transparent"
            >
              <a
                href={AMARYLLIS_COMPANY.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Seguir @amaryllisnaturais
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
