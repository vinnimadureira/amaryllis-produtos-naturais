import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Leaf,
  Sparkles,
  ShieldCheck,
  Package,
  CheckCircle2,
  HeartHandshake,
  HelpCircle,
} from "lucide-react";

interface ProductDetailsProps {
  name: string;
  category?: string;
  description?: string;
  weightGrams?: number;
}

const KEYWORD_HIGHLIGHTS: Record<string, string[]> = {
  whey: [
    "Proteína isolada e hidrolisada de altíssima absorção",
    "Adoçado naturalmente com stevia e taumatina",
    "Isento de glúten, lactose e açúcares adicionados",
    "Parceira Oficial Essential Nutrition em Campinas",
  ],
  collagen: [
    "Peptídeos bioativos de colágeno Verisol®",
    "Enriquecido com ácido hialurônico, silício orgânico e biotina",
    "Zero açúcar, sem glúten e sem lactose",
    "Ideal para saúde da pele, unhas e cabelos",
  ],
  creatina: [
    "Creatina monohidratada micronizada 100% pura",
    "Auxilia na força muscular, recuperação e função cognitiva",
    "Sem sabor, sem aditivos e livre de glúten",
    "Excelente solubilidade",
  ],
  castanha: [
    "Oleaginosas selecionadas de safra fresca e crocante",
    "Fonte natural de selênio, magnésio, zinco e gorduras boas",
    "Sem conservantes artificiais",
    "Embaladas com higiene e controle de umidade",
  ],
};

const getHighlights = (name: string): string[] => {
  const lower = name.toLowerCase();
  for (const key in KEYWORD_HIGHLIGHTS) {
    if (lower.includes(key)) return KEYWORD_HIGHLIGHTS[key];
  }
  return [
    "Curadoria rigorosa de ingredientes naturais e funcionais",
    "Livre de gorduras trans e corantes artificiais",
    "Selecionado pela equipe Amaryllis Produtos Naturais",
    "Armazenamento climatizado que preserva nutrientes e frescor",
  ];
};

const ProductDetails = ({ name, category, description, weightGrams = 300 }: ProductDetailsProps) => {
  const highlights = getHighlights(name);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="mt-16 pt-12 border-t border-border"
    >
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Informações Nutricionais &amp; Uso
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-1">
            Benefícios, conservação e dúvidas
          </h2>
        </div>
      </div>

      <Tabs defaultValue="beneficios" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="beneficios" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary rounded-lg">
            <Leaf className="w-4 h-4" /> Composição &amp; Destaques
          </TabsTrigger>
          <TabsTrigger value="uso" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary rounded-lg">
            <Sparkles className="w-4 h-4" /> Sugestão de Uso
          </TabsTrigger>
          <TabsTrigger value="conservacao" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary rounded-lg">
            <Package className="w-4 h-4" /> Conservação
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary rounded-lg">
            <HelpCircle className="w-4 h-4" /> Perguntas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="beneficios" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/80 border border-border rounded-2xl p-6">
              <h3 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Diferenciais do produto
              </h3>
              <ul className="space-y-2.5">
                {highlights.map((ing) => (
                  <li key={ing} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
                Tem alguma restrição alimentar específica (doença celíaca, APLV ou intolerância à lactose)? Chame nossa equipe no WhatsApp (19) 99351-2766 para enviarmos a foto completa do rótulo e tabela nutricional do lote atual.
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 rounded-2xl p-6">
              <h3 className="font-serif text-xl font-semibold text-foreground mb-4">
                Ficha rápida
              </h3>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Peso líquido aproximado: {weightGrams}g
              </p>
              <dl className="divide-y divide-border/60 text-sm">
                {[
                  ["Categoria", category || "Produtos Naturais"],
                  ["Perfil", "Nutrição Saudável & Funcional"],
                  ["Disponibilidade", "Loja Física (Guanabara) & Delivery"],
                  ["Atendimento", "WhatsApp (19) 99351-2766"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold text-foreground text-right">{val}</dd>
                  </div>
                ))}
              </dl>
              {description && (
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="uso" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Sparkles,
                title: "Rotina Matinal",
                sub: "Mais energia e saciedade",
                steps: [
                  "Adicione em vitaminas, frutas, iogurtes ou bebidas vegetais",
                  "Combine com fibras e sementes para baixo índice glicêmico",
                ],
              },
              {
                icon: Leaf,
                title: "Pré ou Pós-Treino",
                sub: "Performance & Recuperação",
                steps: [
                  "Dilua a porção recomendada em água ou bebida vegetal",
                  "Ou consuma conforme orientação do seu nutricionista ou médico",
                ],
              },
              {
                icon: HeartHandshake,
                title: "Lanches & Receitas",
                sub: "Praticidade no dia a dia",
                steps: [
                  "Ideal para levar na bolsa, escritório ou preparar receitas funcionais",
                  "Sabor limpo, sem adição de açúcares refinados",
                ],
              },
            ].map((mode) => (
              <div
                key={mode.title}
                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <mode.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground">{mode.title}</h3>
                <p className="text-xs text-primary font-semibold mt-0.5 mb-3">{mode.sub}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {mode.steps.map((step) => (
                    <li key={step} className="flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conservacao" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Package,
                title: "Local Fresco e Seco",
                text: "Mantenha a embalagem sempre bem fechada, ao abrigo da luz solar direta, calor e umidade.",
              },
              {
                icon: ShieldCheck,
                title: "Potes Herméticos",
                text: "Para itens a granel, castanhas e farinhas, recomendamos armazenar em potes de vidro herméticos ou na geladeira para preservar a crocância.",
              },
              {
                icon: Leaf,
                title: "Validade e Lote",
                text: "Todos os produtos da Amaryllis possuem giro rápido e data de validade rigorosamente controlada em nossa loja no Jardim Guanabara.",
              },
            ].map((c) => (
              <div key={c.title} className="bg-card border border-border rounded-2xl p-6">
                <c.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-serif text-lg font-semibold text-foreground mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Accordion type="single" collapsible className="w-full bg-card border border-border rounded-2xl px-6">
            {[
              {
                q: "Posso retirar este produto na loja física em Campinas?",
                a: "Sim! Nossa loja fica na Rua Camargo Paes, 65 — Jardim Guanabara, Campinas - SP. Você pode comprar pelo site ou reservar pelo WhatsApp (19) 99351-2766 para retirada imediata.",
              },
              {
                q: "Vocês fazem entrega (delivery) em Campinas?",
                a: "Sim! Entregamos em Campinas e região com agilidade. Chame no WhatsApp (19) 99351-2766 para consultar a taxa e o prazo para o seu bairro.",
              },
              {
                q: "Como posso confirmar se o produto não contém glúten ou lactose?",
                a: "Trabalhamos com linha Gluten Free Friendly e sem lactose. Se você é celíaco ou alérgico severo, chame nossa equipe no WhatsApp que enviamos foto do rótulo completo do fabricante na hora.",
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-0">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>
    </motion.section>
  );
};

export default ProductDetails;
