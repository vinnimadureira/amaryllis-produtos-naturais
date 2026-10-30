import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Package, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { AMARYLLIS_PRODUCTS } from "@/lib/amaryllisFallbackData";

interface CrossSellProps {
  currentProductId: string;
  currentCategory?: string;
}

const CrossSell = ({ currentProductId }: CrossSellProps) => {
  const { items: cartItems } = useCart();

  const { data: rawPairing = [] } = useQuery({
    queryKey: ["xsell-pairing", currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .neq("id", currentProductId)
        .limit(4);
      if (error || !data || data.length === 0) {
        return AMARYLLIS_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, 3);
      }
      return data;
    },
  });

  const pairing =
    rawPairing.length > 0 && !rawPairing.some((p: any) => (p.name || "").toLowerCase().includes("cone"))
      ? rawPairing.slice(0, 3)
      : AMARYLLIS_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, 3);

  const cartIds = cartItems.map((i) => i.id);
  const complementary = AMARYLLIS_PRODUCTS.filter(
    (p) => p.id !== currentProductId && !cartIds.includes(p.id)
  ).slice(0, 4);

  return (
    <div className="mt-16 space-y-16">
      {pairing.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="pt-12 border-t border-border"
        >
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="w-3.5 h-3.5" /> Sugestão da Amaryllis
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-1">
                Combina com a sua rotina saudável
              </h2>
              <p className="text-muted-foreground mt-1">
                Complemente seu pedido com suplementos, castanhas, chás e itens sem glúten
              </p>
            </div>
            <Button asChild variant="ghost" className="gap-2 text-primary hover:bg-primary/10">
              <Link to="/catalogo">
                Ver catálogo completo <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pairing.map((p: any) => (
              <ProductCard
                key={p.id}
                id={p.id}
                image={p.image_url || "/placeholder.svg"}
                name={p.name}
                description={p.description || ""}
                price={p.price_display}
                priceNum={p.price}
                category={p.category}
              />
            ))}

            {/* Promotional Card */}
            <Link
              to="/catalogo"
              className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground p-6 flex flex-col justify-between min-h-[320px] border border-primary/40 shadow-gold hover:shadow-xl transition-shadow"
            >
              <div>
                <Leaf className="w-8 h-8 mb-3 opacity-90" />
                <h3 className="font-serif text-2xl font-bold leading-tight">
                  Monte sua cesta Amaryllis Naturais
                </h3>
                <p className="text-sm opacity-90 mt-2 leading-relaxed">
                  Combine Essential Nutrition, itens sem glúten, sem lactose, granel e fitoterápicos em um único pedido.
                </p>
              </div>
              <div className="flex items-center gap-2 font-semibold text-sm mt-4 group-hover:gap-3 transition-all">
                Explorar catálogo <ArrowRight className="w-4 h-4" />
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/10 blur-2xl pointer-events-none" />
            </Link>
          </div>
        </motion.section>
      )}

      {cartIds.length > 0 && complementary.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="pt-12 border-t border-border"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Baseado no seu carrinho
              </span>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground">
                Aproveite a entrega para incluir também
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {complementary.map((p: any) => (
              <ProductCard
                key={p.id}
                id={p.id}
                image={p.image_url || "/placeholder.svg"}
                name={p.name}
                description={p.description || ""}
                price={p.price_display}
                priceNum={p.price}
                category={p.category}
              />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default CrossSell;
