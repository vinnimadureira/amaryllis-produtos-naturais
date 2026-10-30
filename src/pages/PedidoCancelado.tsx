import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const PedidoCancelado = () => (
  <main className="pt-24 pb-20 min-h-[80vh]">
    <SEO title="Pedido cancelado — Amaryllis Produtos Naturais" description="Seu pedido foi cancelado." />
    <div className="container max-w-xl text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6"
      >
        <XCircle className="w-10 h-10 text-muted-foreground" />
      </motion.div>
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
        Pedido cancelado
      </h1>
      <p className="text-muted-foreground mb-8">
        Seu pagamento não foi concluído. Os itens continuam no seu carrinho — você pode tentar
        novamente quando quiser.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="bg-primary text-primary-foreground gap-2">
          <Link to="/catalogo">
            <ShoppingBag className="w-4 h-4" />
            Voltar ao catálogo
          </Link>
        </Button>
      </div>
    </div>
  </main>
);

export default PedidoCancelado;
