import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, MessageCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionTitle from "@/components/SectionTitle";
import ProductCard from "@/components/ProductCard";
import TestimonialCard from "@/components/TestimonialCard";
import SEO from "@/components/SEO";
import { localBusinessJsonLd, websiteJsonLd } from "@/components/JsonLd";
import MobileCarousel from "@/components/MobileCarousel";
import { ImposingHomeExperience } from "@/components/ImposingHomeExperience";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import {
  AMARYLLIS_COMPANY,
  AMARYLLIS_PRODUCTS,
  AMARYLLIS_TESTIMONIALS,
} from "@/lib/amaryllisFallbackData";

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
    "Olá, Amaryllis Produtos Naturais! Gostaria de consultar produtos ou fazer um pedido."
  )}`;

  return (
    <main className="overflow-x-clip bg-background">
      <SEO
        title="Produtos Naturais, Suplementos, Sem Glúten e Fitoterápicos em Campinas"
        description="Amaryllis Produtos Naturais no Jardim Guanabara, Campinas (Rua Camargo Paes, 65). Parceira oficial Essential Nutrition, produtos naturais, dietéticos, orgânicos, integrais, sem glúten e sem lactose."
        jsonLd={[localBusinessJsonLd, websiteJsonLd]}
      />

      {/* ───────── 1. EXPERIÊNCIA CINEMÁTICA PRINCIPAL (HERO + BENTO + GOALS + MANIFESTO) ───────── */}
      <ImposingHomeExperience waUrl={waUrl} />

      {/* ───────── 2. VITRINE DE PRODUTOS MAIS DESEJADOS ───────── */}
      {products.length > 0 && (
        <section className="py-14 sm:py-20 lg:py-28 border-b border-border/60 bg-background">
          <div className="container">
            <div className="flex items-end justify-between mb-8 sm:mb-12">
              <div>
                <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                  Destaques da Semana
                </span>
                <h2 className="font-display text-2xl sm:text-4xl text-foreground font-semibold mt-1">
                  Mais Desejados da Amaryllis
                </h2>
              </div>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex rounded-full text-xs">
                <Link to="/catalogo">
                  Ver catálogo completo <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>

            {/* Carrossel de 2 Itens por Tela no Mobile */}
            <div className="sm:hidden -mx-4 px-4">
              <MobileCarousel itemWidthClass="w-[46%]" gapClass="gap-2.5">
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

            {/* Grid no Desktop */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

            <div className="text-center mt-8 sm:mt-12 sm:hidden">
              <Button
                asChild
                size="sm"
                className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-5"
              >
                <Link to="/catalogo">
                  Explorar Catálogo Completo <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ───────── 3. DEPOIMENTOS DE CLIENTES E PROFISSIONAIS ───────── */}
      {testimonials.length > 0 && (
        <section className="py-14 sm:py-20 lg:py-28 bg-secondary/10 border-b border-border/60">
          <div className="container">
            <SectionTitle
              title="A Confiança de Quem Vive com Mais Saúde"
              subtitle="Depoimentos de clientes, celíacos e nutricionistas que confiam na curadoria da Amaryllis"
            />
            {/* Carrossel Mobile para Depoimentos */}
            <div className="sm:hidden mt-8 -mx-4 px-4">
              <MobileCarousel itemWidthClass="w-[84%]" gapClass="gap-3">
                {testimonials.slice(0, 6).map((t: any) => (
                  <TestimonialCard
                    key={t.id}
                    name={t.name}
                    text={t.text}
                    rating={t.rating}
                  />
                ))}
              </MobileCarousel>
            </div>

            {/* Grid Desktop */}
            <div className="hidden sm:grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
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

      {/* ───────── 4. CTA FINAL DE ALTA CONVERSÃO ───────── */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-emerald-950 text-white">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[300px] bg-white/5 blur-[120px] rounded-full" />
        <div className="container relative text-center max-w-3xl">
          <Sparkles className="w-8 h-8 text-amber-300 mx-auto mb-5" />
          <h2 className="font-display text-3xl sm:text-5xl leading-[1.08] text-white">
            Sua saúde começa com escolhas verdadeiras.
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-white hover:bg-white/95 text-emerald-950 font-bold rounded-full h-14 px-8 text-base shadow-2xl transition-all hover:scale-105"
            >
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2 text-[#25D366]" />
                Falar com a Equipe no WhatsApp
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/15 rounded-full h-14 px-7 bg-white/5 backdrop-blur-md text-base"
            >
              <a
                href={AMARYLLIS_COMPANY.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5 mr-2 text-rose-300" />
                @amaryllisnaturais
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
