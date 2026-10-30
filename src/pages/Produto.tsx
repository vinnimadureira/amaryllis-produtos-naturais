import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, ArrowLeft, ShieldCheck, Star, ShoppingBag, Award, Sparkles, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import ProductCard from "@/components/ProductCard";
import SEO from "@/components/SEO";
import { productJsonLd } from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGallery from "@/components/ProductGallery";
import ProductDetails from "@/components/ProductDetails";
import CrossSell from "@/components/CrossSell";
import SocialShare from "@/components/SocialShare";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { AMARYLLIS_COMPANY, AMARYLLIS_PRODUCTS } from "@/lib/amaryllisFallbackData";

const WHATSAPP_URL = `https://wa.me/${AMARYLLIS_COMPANY.whatsapp}?text=`;

const Produto = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: rawDbProduct, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .eq("active", true)
        .maybeSingle();
      if (error || !data) {
        return AMARYLLIS_PRODUCTS.find((p) => p.id === id) || null;
      }
      return data;
    },
    enabled: !!id,
  });

  const dbProduct = rawDbProduct || AMARYLLIS_PRODUCTS.find((p) => p.id === id) || null;
  const category = dbProduct?.category;

  const { data: productImages = [] } = useQuery({
    queryKey: ["product-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id!)
        .order("display_order", { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!id,
  });

  const { data: rawRelatedProducts = [] } = useQuery({
    queryKey: ["related-products", id, category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("category", category!)
        .neq("id", id!)
        .limit(4);
      if (error || !data || data.length === 0) {
        return AMARYLLIS_PRODUCTS.filter((p) => p.category === category && p.id !== id).slice(0, 4);
      }
      return data;
    },
    enabled: !!category && !!id,
  });

  const relatedProducts =
    rawRelatedProducts.length > 0
      ? rawRelatedProducts
      : AMARYLLIS_PRODUCTS.filter((p) => p.id !== id).slice(0, 4);

  const product = dbProduct
    ? {
        name: dbProduct.name,
        description: dbProduct.description || "",
        price: dbProduct.price_display,
        image: dbProduct.image_url || "/placeholder.svg",
        category: dbProduct.category,
      }
    : null;

  if (isLoading) {
    return (
      <main className="pt-24 pb-20">
        <div className="container">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="grid md:grid-cols-2 gap-10">
              <div className="aspect-square bg-muted rounded-2xl" />
              <div className="space-y-4">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-8 w-3/4 bg-muted rounded" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pt-24 pb-20">
        <div className="container text-center py-20">
          <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Produto não encontrado</h1>
          <p className="text-muted-foreground mb-6">Este produto pode ter sido removido ou está indisponível no momento.</p>
          <Button asChild variant="outline" className="gap-2 border-primary text-primary">
            <Link to="/catalogo"><ArrowLeft className="w-4 h-4" /> Voltar ao Catálogo</Link>
          </Button>
        </div>
      </main>
    );
  }

  const whatsappMessage = `Olá, Amaryllis Produtos Naturais! Gostaria de saber mais sobre: ${product.name} (${product.price})`;

  return (
    <main className="pt-24 pb-20">
      <SEO
        title={product.name}
        description={`${product.description.slice(0, 120)} — ${product.price}. Amaryllis Produtos Naturais em Campinas (Jardim Guanabara).`}
        image={product.image !== "/placeholder.svg" ? product.image : undefined}
        type="product"
        keywords={`${product.name}, amaryllis produtos naturais, ${product.category}, campinas, jardim guanabara`}
        jsonLd={productJsonLd({
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          id: id || "",
        })}
      />
      <div className="container">
        <Breadcrumbs items={[
          { label: "Catálogo", path: "/catalogo" },
          { label: product.name },
        ]} />

        <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ProductGallery
              images={[product.image, ...productImages.map((img: any) => img.image_url)]}
              alt={product.name}
              category={product.category}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col"
          >
            <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
              {product.category}
            </span>

            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-accent fill-accent" />
              ))}
              <span className="text-sm text-muted-foreground ml-2">Curadoria Amaryllis · Campinas</span>
            </div>

            <p className="font-serif text-3xl font-bold text-primary mb-6">{product.price}</p>

            <div className="prose prose-sm text-muted-foreground mb-8 leading-relaxed">
              <p>{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: ShieldCheck, text: "Procedência Garantida" },
                { icon: Leaf, text: "Nutrição Limpa & Saudável" },
                { icon: Award, text: "Curadoria Especializada" },
                { icon: Sparkles, text: "Loja Física no Guanabara" },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/60 border border-border/60 rounded-lg px-3 py-2.5">
                  <feat.icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{feat.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              {dbProduct?.allow_direct_purchase && (dbProduct?.price ?? 0) > 0 ? (
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base flex-1 rounded-full"
                  onClick={() => {
                    addItem({
                      id: id!,
                      name: product.name,
                      price: product.price,
                      priceNum: dbProduct?.price || 0,
                      image: product.image,
                    });
                    toast({ title: "Adicionado ao carrinho 🛒", description: product.name });
                    setTimeout(() => {
                      const btn = document.querySelector<HTMLButtonElement>(
                        "[data-checkout-button]",
                      );
                      btn?.focus({ preventScroll: false });
                      btn?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 350);
                  }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  Adicionar ao Carrinho
                </Button>
              ) : null}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 gap-2 text-base flex-1 rounded-full"
              >
                <a
                  href={`${WHATSAPP_URL}${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5" />
                  Pedir no WhatsApp
                </a>
              </Button>
            </div>

            <div className="mt-4">
              <SocialShare
                title={product.name}
                text={`Confira este produto na Amaryllis Produtos Naturais: ${product.name}`}
                url={typeof window !== "undefined" ? window.location.href : ""}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Leaf className="w-3.5 h-3.5 text-primary" />
                Rua Camargo Paes, 65 · Jardim Guanabara
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Gluten Free Friendly
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
                WhatsApp (19) 99351-2766
              </div>
            </div>
          </motion.div>
        </div>

        <ProductDetails
          name={product.name}
          category={product.category}
          description={product.description}
          weightGrams={dbProduct?.weight_grams ?? 300}
        />

        <CrossSell currentProductId={id || ""} currentCategory={product.category} />

        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
              Mais de {product.category}
            </h2>
            <p className="text-muted-foreground mb-8">Outras opções saudáveis selecionadas para você</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp: any) => (
                <ProductCard
                  key={rp.id}
                  id={rp.id}
                  image={rp.image_url || "/placeholder.svg"}
                  name={rp.name}
                  description={rp.description || ""}
                  price={rp.price_display}
                  priceNum={rp.price}
                  category={rp.category}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">
          <Button asChild variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
            <Link to="/catalogo">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Catálogo
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Produto;
