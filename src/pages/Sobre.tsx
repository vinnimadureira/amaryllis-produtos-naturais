import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Sparkles, Store, HeartHandshake, Award } from "lucide-react";
import SectionTitle from "@/components/SectionTitle";
import SEO from "@/components/SEO";
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useSiteMedia } from "@/hooks/useSiteMedia";
import handsImgAsset from "@/assets/mrcone-hands.jpg.asset.json";

const handsImg = handsImgAsset.url;

const values = [
  {
    icon: Award,
    title: "Parceira Essential Nutrition",
    desc: "Linha oficial completa de proteínas, colágenos, aminoácidos e chocolates funcionais em Campinas.",
  },
  {
    icon: ShieldCheck,
    title: "Gluten Free & Sem Lactose",
    desc: "Reconhecida pelo guia Guindy como referência segura para celíacos e intolerantes à lactose.",
  },
  {
    icon: Leaf,
    title: "Fitoterápicos, Orgânicos & Granel",
    desc: "Chás medicinais, grãos integrais, castanhas selecionadas, farinhas especiais e dietéticos.",
  },
  {
    icon: HeartHandshake,
    title: "Tradição no Jardim Guanabara",
    desc: "Atendimento próximo, humano e especializado na Rua Camargo Paes, 65 em Campinas.",
  },
];

const Sobre = () => {
  const { getMedia } = useSiteMedia();
  const handsUrl = getMedia("sobre.hands_image", handsImg);
  return (
    <main className="pt-24 pb-16">
      <SEO
        title="Sobre a Amaryllis Produtos Naturais — Jardim Guanabara, Campinas"
        description="Conheça a Amaryllis Produtos Naturais e Dietéticos e Fitoterápicos, loja tradicional localizada na Rua Camargo Paes, 65, Jardim Guanabara, Campinas - SP."
        keywords="sobre amaryllis produtos naturais, loja produtos naturais campinas guanabara, essential nutrition campinas, sem gluten campinas"
        jsonLd={[localBusinessJsonLd, breadcrumbJsonLd([{ name: "Início", url: "/" }, { name: "Sobre a Loja" }])]}
      />
      <div className="container">
        <Breadcrumbs items={[{ label: "Sobre a Loja" }]} />
        <SectionTitle
          title="Tradição em saúde e bem-estar em Campinas"
          subtitle="Amaryllis Produtos Naturais, Dietéticos e Fitoterápicos"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-cinematic border border-border/60">
                <img
                  src={handsUrl}
                  alt="Amaryllis Produtos Naturais — Jardim Guanabara, Campinas"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary rounded-2xl -z-10" />
              <div className="absolute -top-3 -left-3 w-16 h-16 bg-accent rounded-xl -z-10" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold">
                Amaryllis Produtos Naturais · Campinas - SP
              </span>
            </div>
            <h3 className="font-display text-3xl sm:text-4xl text-foreground leading-tight">
              Sua referência em produtos naturais, suplementos e alimentação restritiva 🌿
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              A{" "}
              <strong className="text-foreground">Amaryllis Produtos Naturais e Dietéticos e Fitoterápicos</strong>{" "}
              construiu sua história em Campinas unindo curadoria rigorosa de produtos saudáveis e um atendimento acolhedor, próximo e prestativo.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Somos <strong className="text-foreground">Parceira Oficial da Essential Nutrition</strong>, oferecendo a linha completa de proteínas isoladas e hidrolisadas, colágenos, aminoácidos, creatina e chocolates funcionais. Também trabalhamos com marcas consagradas de nutrição clínica e esportiva, além de fitoterápicos, chás medicinais, mel orgânico, própolis e produtos a granel sempre frescos.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Para quem convive com doença celíaca, sensibilidade ao glúten, intolerância à lactose ou diabetes, a Amaryllis é reconhecida pelo guia{" "}
              <strong className="text-foreground">Guindy como Gluten Free Friendly</strong>: selecionamos opções industrializadas e artesanais seguras, saborosas e livres de contaminação para que sua rotina alimentar seja leve e prazerosa.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 bg-card rounded-2xl shadow-soft border border-border hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <v.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-display text-xl text-foreground mb-2">{v.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Sobre;
