import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { faqJsonLd } from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionTitle from "@/components/SectionTitle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqSections = [
  {
    title: "🌿 Produtos, Suplementos e Parcerias",
    items: [
      {
        q: "O que você encontra na Amaryllis Produtos Naturais?",
        a: "Somos uma loja tradicional em Campinas especializada em produtos naturais, dietéticos, orgânicos, integrais, fitoterápicos, chás medicinais, produtos a granel e suplementos nutricionais. Além disso, contamos com curadoria completa de alimentos sem glúten e sem lactose.",
      },
      {
        q: "A Amaryllis é parceira oficial da Essential Nutrition?",
        a: "Sim! Somos parceira oficial da Essential Nutrition em Campinas, contando com a linha de proteínas isoladas e hidrolisadas (Cacao Whey, Vanilla Whey, Veggie Protein), Collagen Skin, Chocolift, Creatina, Ômega-3 e aminoácidos.",
      },
      {
        q: "Vocês trabalham com produtos a granel e fitoterápicos?",
        a: "Sim! Temos castanhas selecionadas (castanha-do-pará, caju, amêndoas, nozes), sementes, farinhas especiais low-carb e sem glúten, frutas secas, temperos puros e uma ampla variedade de chás e fitoterápicos.",
      },
    ],
  },
  {
    title: "🌾 Sem Glúten (Gluten Free Friendly) e Sem Lactose",
    items: [
      {
        q: "A loja possui opções seguras para celíacos?",
        a: "Sim! Nos identificamos como Gluten Free Friendly (destaque no guia Guindy em Campinas) e trabalhamos com pães, massas, biscoitos, snacks e farinhas industrializadas certificadas sem glúten.",
      },
      {
        q: "Vocês têm produtos sem lactose e zero açúcar (dietéticos)?",
        a: "Sim, contamos com bebidas vegetais, chocolates funcionais, doces dietéticos, adoçantes naturais (xilitol, eritritol, stevia, taumatina) e produtos desenvolvidos para intolerantes à lactose, veganos e diabéticos.",
      },
    ],
  },
  {
    title: "📍 Loja Física, WhatsApp e Entregas em Campinas",
    items: [
      {
        q: "Qual o endereço e telefone da Amaryllis Produtos Naturais?",
        a: "Nossa loja fica na Rua Camargo Paes, 65, Jardim Guanabara, Campinas - SP (CEP: 13073-350). Nosso telefone fixo é (19) 3243-5982 e nosso WhatsApp é (19) 99351-2766.",
      },
      {
        q: "Como faço para pedir pelo WhatsApp ou retirar na loja?",
        a: "Você pode adicionar os itens ao carrinho aqui no site e enviar o pedido direto para o nosso WhatsApp (19) 99351-2766, ou mandar uma foto da receita/lista da sua nutricionista. Separamos tudo para delivery em Campinas ou retirada rápida na loja.",
      },
      {
        q: "Quais são as formas de pagamento aceitas?",
        a: "Aceitamos Pix, cartões de crédito e débito na loja e nos pedidos pelo site/WhatsApp.",
      },
    ],
  },
];

const allFaqItems = faqSections.flatMap((s) => s.items);
const faqJsonLdData = faqJsonLd(allFaqItems);

const FAQ = () => (
  <main className="pt-24 pb-16">
    <SEO
      title="Perguntas Frequentes (FAQ) — Amaryllis Produtos Naturais"
      description="Tire suas dúvidas sobre a Amaryllis Produtos Naturais no Jardim Guanabara, Campinas: Essential Nutrition, produtos sem glúten, sem lactose, fitoterápicos e entregas."
      keywords="faq amaryllis produtos naturais, essential nutrition campinas, sem gluten campinas, loja produtos naturais jardim guanabara"
      jsonLd={faqJsonLdData}
    />
    <div className="container max-w-3xl">
      <Breadcrumbs items={[{ label: "Perguntas Frequentes" }]} />
      <SectionTitle
        title="Perguntas Frequentes"
        subtitle="Tudo sobre nossas linhas de produtos naturais, suplementos e atendimento em Campinas"
      />

      {faqSections.map((section, si) => (
        <motion.div
          key={si}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: si * 0.1 }}
          className="mb-8"
        >
          <h2 className="font-display text-2xl text-foreground mb-3">{section.title}</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {section.items.map((item, i) => (
              <AccordionItem
                key={i}
                value={`${si}-${i}`}
                className="border border-border rounded-xl px-4 bg-card data-[state=open]:border-primary/40 shadow-soft"
              >
                <AccordionTrigger className="text-left text-base font-medium text-foreground hover:text-primary py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      ))}
    </div>
  </main>
);

export default FAQ;
