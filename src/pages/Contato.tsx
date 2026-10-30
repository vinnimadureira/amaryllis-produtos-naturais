import { motion } from "framer-motion";
import {
  MessageCircle,
  Mail,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Truck,
  HelpCircle,
  Phone,
  MapPin,
  Instagram,
  Facebook,
} from "lucide-react";
import SEO from "@/components/SEO";
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
const buildWaLink = (raw: string, message?: string) => {
  const digits = onlyDigits(raw) || AMARYLLIS_COMPANY.whatsapp;
  const text = encodeURIComponent(
    message || "Olá, Amaryllis Produtos Naturais! Gostaria de consultar produtos ou fazer um pedido."
  );
  return `https://wa.me/${digits}?text=${text}`;
};

const FAQS = [
  {
    q: "Qual o endereço da loja física em Campinas?",
    a: "Estamos na Rua Camargo Paes, 65, no bairro Jardim Guanabara, Campinas - SP (CEP: 13073-350). Contamos com fácil acesso para você visitar ou retirar seu pedido.",
  },
  {
    q: "Vocês têm pronta-entrega da Essential Nutrition?",
    a: "Sim! Somos parceira oficial da Essential Nutrition em Campinas e trabalhamos com a linha completa de proteínas, colágenos, creatina, aminoácidos e Chocolift. Chame no WhatsApp (19) 99351-2766 para confirmar seu sabor favorito.",
  },
  {
    q: "A loja tem produtos seguros para celíacos e intolerantes à lactose?",
    a: "Sim! Temos perfil Gluten Free Friendly (destaque no guia Guindy) e uma seção inteira dedicada a produtos sem glúten, sem lactose, veganos, integrais e dietéticos (zero açúcar).",
  },
  {
    q: "Posso enviar minha lista da nutricionista pelo WhatsApp?",
    a: "Com certeza! Basta enviar a foto ou lista pelo nosso WhatsApp (19) 99351-2766. Nossa equipe separa todos os suplementos, fitoterápicos, chás e itens a granel para entrega ou retirada rápida na loja.",
  },
];

const TRUST_ITEMS = [
  { icon: Zap, label: "Atendimento Ágil", sub: "WhatsApp (19) 99351-2766 e Fixo (19) 3243-5982" },
  { icon: ShieldCheck, label: "Gluten Free Friendly", sub: "Opções sem glúten e sem lactose" },
  { icon: Truck, label: "Loja & Delivery", sub: "Jardim Guanabara · Campinas - SP" },
];

const Contato = () => {
  const company = useCompanyInfo();
  const waLink = buildWaLink(company.whatsapp);

  return (
    <main className="pt-24 pb-16">
      <SEO
        title="Contato & Localização — Amaryllis Produtos Naturais em Campinas"
        description="Fale com a Amaryllis Produtos Naturais no Jardim Guanabara, Campinas (Rua Camargo Paes, 65). Telefone (19) 3243-5982 e WhatsApp (19) 99351-2766."
        keywords="contato amaryllis produtos naturais, telefone amaryllis campinas, rua camargo paes 65 campinas, whatsapp amaryllis naturais"
        jsonLd={[localBusinessJsonLd, breadcrumbJsonLd([{ name: "Início", url: "/" }, { name: "Contato" }])]}
      />

      <div className="container">
        <Breadcrumbs items={[{ label: "Contato" }]} />

        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/50 p-8 md:p-14 mb-10 shadow-soft">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/15 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/15 blur-3xl pointer-events-none"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Jardim Guanabara · Campinas - SP · Atendimento Especializado
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-foreground tracking-tight leading-[1.06] mb-5">
              Fale com a Amaryllis.
              <br />
              <span className="text-gradient-ember">
                Sua saúde começa aqui.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8">
              Envie sua lista da nutricionista, consulte produtos sem glúten, sem lactose, fitoterápicos ou suplementos da <strong>Essential Nutrition</strong>. Você pode retirar na nossa loja ou receber em casa.
            </p>

            {/* CENTRAL DE CONTATO */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur p-6 md:p-7 shadow-warm-glow"
            >
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-glow">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-accent border-2 border-card" />
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Loja Física &amp; Televendas
                    </p>
                    <a
                      href="tel:1932435982"
                      className="block font-display text-2xl md:text-3xl text-foreground hover:text-primary transition-colors tracking-tight leading-tight"
                    >
                      (19) 3243-5982
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      WhatsApp direto: <strong>(19) 99351-2766</strong>
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-2.5 md:shrink-0">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow group rounded-full"
                  >
                    <a href={waLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Chamar no WhatsApp
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <a
                      href={AMARYLLIS_COMPANY.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      Ver no Mapa
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TRUST_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ENDEREÇO + HORÁRIO + FAQ */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-28 self-start">
            {/* Card Endereço */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-lg text-foreground leading-tight">
                    Onde estamos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jardim Guanabara · Campinas - SP
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground font-medium">
                Rua Camargo Paes, 65
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Jardim Guanabara, Campinas - SP · CEP: 13073-350
              </p>
              <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap gap-3">
                <a
                  href={AMARYLLIS_COMPANY.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Instagram className="w-3.5 h-3.5" /> @amaryllisnaturais
                </a>
                <a
                  href={AMARYLLIS_COMPANY.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
                >
                  <Facebook className="w-3.5 h-3.5" /> Facebook Oficial
                </a>
              </div>
            </motion.div>

            {/* Card Horário */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-lg text-foreground leading-tight">
                    Horário de funcionamento
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Loja física e WhatsApp
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center pb-2.5 border-b border-border/60">
                  <span className="text-muted-foreground">Segunda a Sexta</span>
                  <span className="text-foreground font-mono font-medium">
                    08h30 — 18h00
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border/60">
                  <span className="text-muted-foreground">Sábado</span>
                  <span className="text-foreground font-mono font-medium">
                    08h30 — 13h00
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Domingo</span>
                  <span className="text-muted-foreground/60 font-mono">
                    Fechado
                  </span>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* FAQ */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Dúvidas Rápidas
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
                    Perguntas frequentes
                  </h2>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="border-border"
                  >
                    <AccordionTrigger className="text-left font-display text-lg text-foreground hover:text-primary hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Contato;
