import { useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Loader2, Compass, Home as HomeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionTitle from "@/components/SectionTitle";
import TestimonialCard from "@/components/TestimonialCard";
import { Button } from "@/components/ui/button";


interface SectionRow {
  id: string;
  page_key: string;
  section_key: string;
  type: string;
  content: Record<string, any>;
  display_order: number;
  active: boolean;
}

const WHATSAPP_URL =
  "https://wa.me/5519993512766?text=Olá!%20Gostaria%20de%20fazer%20um%20pedido";

const isExternal = (url?: string) => !!url && /^https?:\/\//i.test(url);
const isAnchor = (url?: string) => !!url && url.startsWith("#");
const isMailOrTel = (url?: string) =>
  !!url && (url.startsWith("mailto:") || url.startsWith("tel:"));

/**
 * Smart link wrapper:
 *  - http(s) → <a target="_blank">
 *  - mailto:/tel: → <a> sem target
 *  - #anchor → <a> com scroll suave
 *  - resto → React Router <Link> (mantém SPA + scroll-to-top global)
 */
const SmartLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  if (isMailOrTel(href)) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  if (isAnchor(href)) {
    return (
      <a
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          const id = href.slice(1);
          const target = document.getElementById(id);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", href);
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
};

const CtaButton = ({
  href,
  children,
  variant = "default",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}) => (
  <Button
    asChild
    size="lg"
    variant={variant}
    className={
      variant === "default"
        ? `bg-primary text-primary-foreground hover:bg-rose-dark gap-2 ${className}`
        : `border-2 border-primary text-primary hover:bg-rose-light gap-2 ${className}`
    }
  >
    <SmartLink href={href}>{children}</SmartLink>
  </Button>
);

const HeroSection = ({ content }: { content: Record<string, any> }) => (
  <section className="relative min-h-[60vh] flex items-center bg-rose-light py-20">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="inline-block bg-primary/30 backdrop-blur-sm rounded-2xl px-8 py-6 mb-6">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground">
            {content.title || "Título"}
          </h1>
          {content.subtitle && (
            <p className="text-lg md:text-xl text-foreground/80 mt-3 leading-relaxed">
              {content.subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          {content.cta_secondary_label && content.cta_secondary_link && (
            <CtaButton href={content.cta_secondary_link}>
              <MessageCircle className="w-5 h-5" />
              {content.cta_secondary_label}
            </CtaButton>
          )}
          {content.cta_label && content.cta_link && (
            <CtaButton href={content.cta_link} variant="outline">
              {content.cta_label}
              <ArrowRight className="w-4 h-4" />
            </CtaButton>
          )}
        </div>
      </motion.div>
    </div>
  </section>
);

const AboutSection = ({ content }: { content: Record<string, any> }) => (
  <section className="container py-16">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto text-center"
    >
      <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
        {content.title || "Sobre"}
      </h2>
      <p className="text-lg text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
        {content.text}
      </p>
      {content.cta_label && content.cta_link && (
        <CtaButton href={content.cta_link} variant="outline">
          {content.cta_label}
          <ArrowRight className="w-4 h-4" />
        </CtaButton>
      )}
    </motion.div>
  </section>
);

const BannerSection = ({ content }: { content: Record<string, any> }) => (
  <section className="bg-gradient-to-br from-primary/10 to-secondary/40 py-16">
    <div className="container text-center">
      <SectionTitle title={content.title || "Banner"} subtitle={content.subtitle || ""} />
    </div>
  </section>
);

const TestimonialsSection = ({ content }: { content: Record<string, any> }) => {
  const limit = Number(content.limit || 6);
  const { data: testimonials = [] } = useQuery({
    queryKey: ["landing-testimonials", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });

  if (testimonials.length === 0) return null;

  return (
    <section className="container py-16">
      <SectionTitle title={content.title || "Depoimentos"} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t: any) => (
          <TestimonialCard key={t.id} {...t} />
        ))}
      </div>
    </section>
  );
};

const CtaSection = ({ content }: { content: Record<string, any> }) => (
  <section className="container py-20">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="gradient-rose rounded-2xl p-10 md:p-16 text-center"
    >
      <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
        {content.title || "Vamos conversar?"}
      </h2>
      {content.subtitle && (
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          {content.subtitle}
        </p>
      )}
      {content.cta_label && content.cta_link && (
        <CtaButton href={content.cta_link}>
          <MessageCircle className="w-5 h-5" />
          {content.cta_label}
        </CtaButton>
      )}
    </motion.div>
  </section>
);

const renderSection = (s: SectionRow) => {
  switch (s.type) {
    case "hero":
      return <HeroSection key={s.id} content={s.content} />;
    case "about":
      return <AboutSection key={s.id} content={s.content} />;
    case "banner":
      return <BannerSection key={s.id} content={s.content} />;
    case "testimonials":
      return <TestimonialsSection key={s.id} content={s.content} />;
    case "cta":
      return <CtaSection key={s.id} content={s.content} />;
    default:
      return null;
  }
};

/**
 * Friendly empty/404 state for slugs that exist but have no content
 * (or simply don't exist yet). Keeps the visitor inside the funnel
 * with strong CTAs to catalog and WhatsApp instead of dumping them
 * on a generic 404.
 */
const LandingEmptyState = ({ slug }: { slug?: string }) => (
  <main className="min-h-screen flex items-center justify-center pt-24 pb-20 bg-rose-light/40">
    <SEO
      title="Página em preparação"
      description="Esta página está em preparação. Confira nosso catálogo ou fale conosco no WhatsApp."
      noIndex
    />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container max-w-xl text-center"
    >
      <div className="inline-flex w-20 h-20 rounded-full bg-primary/15 items-center justify-center mb-6">
        <Compass className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
        Esta página ainda está sendo preparada
      </h1>
      <p className="text-muted-foreground text-lg mb-8">
        {slug ? (
          <>
            Não encontramos conteúdo publicado em{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-sm">
              /p/{slug}
            </code>
            . Que tal explorar nossos produtos ou falar no WhatsApp?
          </>
        ) : (
          <>Que tal explorar nossos produtos ou falar com a equipe no WhatsApp?</>
        )}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          asChild
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-rose-dark gap-2"
        >
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="w-5 h-5" />
            Pedir no WhatsApp
          </a>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-2 border-primary text-primary hover:bg-rose-light gap-2"
        >
          <Link to="/catalogo">
            Ver catálogo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="gap-2">
          <Link to="/">
            <HomeIcon className="w-4 h-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </motion.div>
  </main>
);

const truncate = (s: string, max = 158) =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;

const LandingDynamic = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isPreview = searchParams.get("preview") === "1";

  // Auto-scroll to anchor if URL has hash (e.g. /p/foo#contato)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      // wait a tick so sections are rendered
      const t = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [location.hash, slug]);

  const { data: sections, isLoading } = useQuery({
    queryKey: ["landing-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_key", slug!)
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as SectionRow[];
    },
    enabled: !!slug,
  });

  // Apply preview overrides from sessionStorage when ?preview=1.
  // The admin editor writes drafts under `preview:<pageKey>` as a map
  // of section_key → content (or section_key → null to mark hidden).
  const previewedSections = useMemo<SectionRow[] | undefined>(() => {
    if (!sections || !isPreview || !slug) return sections;
    try {
      const raw = sessionStorage.getItem(`preview:${slug}`);
      if (!raw) return sections;
      const overrides = JSON.parse(raw) as Record<
        string,
        { content?: Record<string, any>; active?: boolean } | null
      >;
      return sections
        .map((s) => {
          const o = overrides[s.section_key];
          if (o === undefined) return s;
          if (o === null) return { ...s, active: false };
          return {
            ...s,
            content: o.content ? { ...s.content, ...o.content } : s.content,
            active: o.active ?? s.active,
          };
        })
        .filter((s) => s.active);
    } catch {
      return sections;
    }
  }, [sections, isPreview, slug]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!previewedSections || previewedSections.length === 0) {
    return <LandingEmptyState slug={slug} />;
  }

  // Build smarter SEO from page contents
  const heroSection = previewedSections.find((s) => s.type === "hero");
  const aboutSection = previewedSections.find((s) => s.type === "about");
  const bannerSection = previewedSections.find((s) => s.type === "banner");

  const seoTitle =
    (heroSection?.content?.title as string) ||
    (aboutSection?.content?.title as string) ||
    (slug ? slug.replace(/-/g, " ") : "Página");

  const rawDescription =
    (heroSection?.content?.subtitle as string) ||
    (aboutSection?.content?.text as string) ||
    (bannerSection?.content?.subtitle as string) ||
    "Confira esta página especial da Amaryllis Produtos Naturais — saúde e bem-estar em Campinas.";

  const seoDescription = truncate(rawDescription.replace(/\s+/g, " ").trim());

  const ogImage =
    (heroSection?.content?.image as string) ||
    (aboutSection?.content?.image as string) ||
    undefined;

  return (
    <main className="pt-24">
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={ogImage}
        type="article"
        noIndex={isPreview}
      />
      <div className="container">
        <Breadcrumbs items={[{ label: seoTitle }]} />
        {isPreview && (
          <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-primary/5 text-sm text-foreground flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              ✓
            </span>
            <span>
              <strong>Modo pré-visualização.</strong> Você está vendo um rascunho não
              publicado. Feche esta aba para descartar.
            </span>
          </div>
        )}
      </div>
      {previewedSections.map(renderSection)}
    </main>
  );
};

export default LandingDynamic;
