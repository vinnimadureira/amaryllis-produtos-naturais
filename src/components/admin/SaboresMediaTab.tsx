import { Loader2, Pizza } from "lucide-react";
import { useSiteMediaByPage } from "@/hooks/useSiteMedia";
import SaborEditor from "./SaborEditor";
import margheritaAsset from "@/assets/sabores/margherita.jpg.asset.json";
const margherita = margheritaAsset.url;
import pepperoniAsset from "@/assets/sabores/pepperoni.jpg.asset.json";
const pepperoni = pepperoniAsset.url;
import quatroQueijosAsset from "@/assets/sabores/quatro-queijos.jpg.asset.json";
const quatroQueijos = quatroQueijosAsset.url;
import calabresaAsset from "@/assets/sabores/calabresa.jpg.asset.json";
const calabresa = calabresaAsset.url;
import frangoCatupiryAsset from "@/assets/sabores/frango-catupiry.jpg.asset.json";
const frangoCatupiry = frangoCatupiryAsset.url;
import portuguesaAsset from "@/assets/sabores/portuguesa.jpg.asset.json";
const portuguesa = portuguesaAsset.url;
import nutellaMorangoAsset from "@/assets/sabores/doce-nutella-morango.jpg.asset.json";
const nutellaMorango = nutellaMorangoAsset.url;
import romeuJulietaAsset from "@/assets/sabores/doce-romeu-julieta.jpg.asset.json";
const romeuJulieta = romeuJulietaAsset.url;
import integralAsset from "@/assets/sabores/cone-integral.jpg.asset.json";
const integral = integralAsset.url;
import chocolateAsset from "@/assets/sabores/cone-chocolate.jpg.asset.json";
const chocolate = chocolateAsset.url;

type SaborDefaults = { name: string; tag: string; description: string };

const FALLBACKS: Record<string, { url: string; defaults: SaborDefaults }> = {
  "sabores.margherita": {
    url: margherita,
    defaults: { name: "Margherita", tag: "Clássico", description: "Molho de tomate, mozzarella derretida e manjericão fresco." },
  },
  "sabores.pepperoni": {
    url: pepperoni,
    defaults: { name: "Pepperoni", tag: "Best-seller", description: "Pepperoni curado, mozzarella e aquele óleo dourado por cima." },
  },
  "sabores.quatro_queijos": {
    url: quatroQueijos,
    defaults: { name: "4 Queijos", tag: "Cremoso", description: "Mozzarella, gorgonzola, parmesão e provolone gratinados." },
  },
  "sabores.calabresa": {
    url: calabresa,
    defaults: { name: "Calabresa", tag: "Brasileiro", description: "Calabresa defumada, cebola roxa e orégano fresco." },
  },
  "sabores.frango_catupiry": {
    url: frangoCatupiry,
    defaults: { name: "Frango c/ Catupiry", tag: "Cremoso", description: "Frango desfiado e catupiry transbordando — com cebolinha." },
  },
  "sabores.portuguesa": {
    url: portuguesa,
    defaults: { name: "Portuguesa", tag: "Tradicional", description: "Presunto, ovo, cebola, azeitona preta e orégano sobre mozzarella." },
  },
  "sabores.integral": {
    url: integral,
    defaults: { name: "Integral", tag: "Fit", description: "Cone de massa integral artesanal, rústico e mais leve — ótimo com recheios salgados." },
  },
  "sabores.nutella_morango": {
    url: nutellaMorango,
    defaults: { name: "Nutella & Morango", tag: "Doce", description: "Nutella derretida, morangos frescos e açúcar de confeiteiro." },
  },
  "sabores.romeu_julieta": {
    url: romeuJulieta,
    defaults: { name: "Romeu & Julieta", tag: "Doce", description: "Queijo branco cremoso com goiabada derretendo por cima." },
  },
  "sabores.chocolate": {
    url: chocolate,
    defaults: { name: "Chocolate", tag: "Doce", description: "Cone de massa de cacau, perfeito para recheios doces, sorvete ou frutas." },
  },
};

const ORDER = [
  "sabores.margherita",
  "sabores.pepperoni",
  "sabores.quatro_queijos",
  "sabores.calabresa",
  "sabores.frango_catupiry",
  "sabores.portuguesa",
  "sabores.integral",
  "sabores.nutella_morango",
  "sabores.romeu_julieta",
  "sabores.chocolate",
];

const SaboresMediaTab = () => {
  const { rows, isLoading } = useSiteMediaByPage("sabores");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const visible = ORDER
    .map((k) => rows.find((r) => r.key === k))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Pizza className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-base font-semibold text-foreground">Sabores</h2>
          <p className="text-xs text-muted-foreground">
            Edite a foto, nome, tag e descrição de cada sabor exibido na home
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((row) => {
          const fb = FALLBACKS[row.key];
          return (
            <SaborEditor
              key={row.key}
              row={row}
              fallbackUrl={fb?.url || ""}
              defaults={fb?.defaults || { name: "", tag: "", description: "" }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SaboresMediaTab;
