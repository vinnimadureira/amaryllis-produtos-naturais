import { motion } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SectionTitle from "@/components/SectionTitle";
import ProductCard from "@/components/ProductCard";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import MobileCarousel from "@/components/MobileCarousel";

interface LandingPageProps {
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  breadcrumb: string;
  heroTitle: string;
  heroSubtitle: string;
  heroEmoji: string;
  bodyText: string;
  ctaText: string;
  filterCategories?: string[];
}

const LandingPage = ({
  seo,
  breadcrumb,
  heroTitle,
  heroSubtitle,
  heroEmoji,
  bodyText,
  ctaText,
  filterCategories,
}: LandingPageProps) => {
  const { toggle, isFavorite } = useWishlist();

  const { data: products = [] } = useQuery({
    queryKey: ["landing-products", filterCategories],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);

      if (filterCategories && filterCategories.length > 0) {
        query = query.in("category", filterCategories);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const productIds = products.map((p) => p.id);
  const { data: productImages = [] } = useQuery({
    queryKey: ["landing-product-images", productIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .in("product_id", productIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0,
  });

  const imagesByProduct = productImages.reduce<Record<string, string[]>>((acc, img) => {
    if (!acc[img.product_id]) acc[img.product_id] = [];
    acc[img.product_id].push(img.image_url);
    return acc;
  }, {});

  return (
    <main className="pt-24 pb-10">
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
      />
      <div className="container">
        <Breadcrumbs items={[{ label: breadcrumb }]} />

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-5xl mb-4 block">{heroEmoji}</span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-4">
            {heroTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            {heroSubtitle}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Link to="/contato">
              <Flame className="w-5 h-5" />
              {ctaText}
            </Link>
          </Button>
        </motion.div>

        {/* Body text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <p className="text-muted-foreground leading-relaxed text-center">
            {bodyText}
          </p>
        </motion.div>

        {/* Products */}
        {products.length > 0 && (
          <section className="mb-16">
            <SectionTitle
              title="Sabores em destaque"
              subtitle="Cones e kits mais pedidos pela nossa comunidade"
            />
            <div className="sm:hidden">
              <MobileCarousel itemWidthClass="w-[78%]">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    image={product.image_url || "/placeholder.svg"}
                    name={product.name}
                    description={product.description || ""}
                    price={product.price_display}
                    priceNum={product.price}
                    category={product.category}
                    images={[product.image_url || "/placeholder.svg", ...(imagesByProduct[product.id] || [])]}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={toggle}
                  />
                ))}
              </MobileCarousel>
            </div>
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  image={product.image_url || "/placeholder.svg"}
                  name={product.name}
                  description={product.description || ""}
                  price={product.price_display}
                  priceNum={product.price}
                  category={product.category}
                  images={[product.image_url || "/placeholder.svg", ...(imagesByProduct[product.id] || [])]}
                  isFavorite={isFavorite(product.id)}
                  onToggleFavorite={toggle}
                />
              ))}
            </div>
            <div className="text-center mt-10">
              <Button asChild variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
                <Link to="/catalogo">
                  Ver catálogo completo
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-10 md:p-16 text-center bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-border"
        >
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
            Bateu fome?
          </h2>
          <p className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto">
            Fale com a gente no WhatsApp e monte seu pedido em minutos.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Link to="/contato">
              <Flame className="w-5 h-5" />
              Falar no WhatsApp
            </Link>
          </Button>
        </motion.div>
      </div>
    </main>
  );
};

export default LandingPage;
