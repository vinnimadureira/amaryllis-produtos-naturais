import { forwardRef } from "react";
import { Lock, Instagram, Facebook, MapPin, Phone, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import logoAsset from "@/assets/imperio-cones-logo.png.asset.json";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";

const Footer = forwardRef<HTMLElement>((_, ref) => (
  <footer
    ref={ref}
    className="relative mt-24 border-t border-border/70 bg-gradient-to-b from-background via-secondary/40 to-secondary overflow-hidden"
    role="contentinfo"
  >
    {/* Subtle botanical glow */}
    <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/10 blur-3xl rounded-full" />

    <div className="container relative py-14">
      <div className="grid md:grid-cols-4 gap-10 mb-10">
        <div className="md:col-span-1">
          <Link to="/" className="inline-flex items-center group">
            <img
              src={logoAsset.url}
              alt="Amaryllis Produtos Naturais"
              className="h-14 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Loja tradicional de produtos naturais, dietéticos, orgânicos, integrais e fitoterápicos no Jardim Guanabara em Campinas. Parceira oficial <strong>Essential Nutrition</strong> e referência <em>Gluten Free Friendly</em>.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-medium text-primary">
            <ShieldCheck className="w-3.5 h-3.5" />
            Gluten Free Friendly · Sem Lactose
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-foreground">Nossas Linhas</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/catalogo?ingrediente=Essential" className="text-muted-foreground hover:text-primary transition-colors">
                Parceira Oficial Essential Nutrition
              </Link>
            </li>
            <li>
              <Link to="/catalogo?ingrediente=Sem+Glúten" className="text-muted-foreground hover:text-primary transition-colors">
                Sem Glúten &amp; Sem Lactose
              </Link>
            </li>
            <li>
              <Link to="/catalogo?ingrediente=Granel" className="text-muted-foreground hover:text-primary transition-colors">
                Granel, Castanhas &amp; Grãos
              </Link>
            </li>
            <li>
              <Link to="/catalogo?ingrediente=Fitoterápico" className="text-muted-foreground hover:text-primary transition-colors">
                Fitoterápicos &amp; Chás Medicinais
              </Link>
            </li>
            <li>
              <Link to="/catalogo?ingrediente=Orgânico" className="text-muted-foreground hover:text-primary transition-colors">
                Orgânicos, Integrais &amp; Dietéticos
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-foreground">Institucional</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors">Sobre a Amaryllis</Link></li>
            <li><Link to="/catalogo" className="text-muted-foreground hover:text-primary transition-colors">Catálogo de Produtos</Link></li>
            <li><Link to="/galeria" className="text-muted-foreground hover:text-primary transition-colors">Destaques da Loja</Link></li>
            <li><Link to="/contato" className="text-muted-foreground hover:text-primary transition-colors">Localização &amp; Contato</Link></li>
            <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">Perguntas Frequentes (FAQ)</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-foreground">Loja Física · Campinas</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <a
                href={AMARYLLIS_COMPANY.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Rua Camargo Paes, 65 — Jardim Guanabara, Campinas - SP (CEP: 13073-350)
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <a href="tel:1932435982" className="hover:text-primary transition-colors">
                (19) 3243-5982 (Loja Fixo)
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-primary shrink-0" />
              <a
                href={`https://wa.me/${AMARYLLIS_COMPANY.whatsapp}?text=${encodeURIComponent("Olá, Amaryllis Produtos Naturais! Gostaria de consultar um produto.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors font-medium text-foreground"
              >
                (19) 99351-2766 (WhatsApp)
              </a>
            </li>
            <li className="flex items-center gap-4 pt-2">
              <a
                href={AMARYLLIS_COMPANY.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                <Instagram className="w-4 h-4 text-[hsl(var(--brand-brasa))]" /> @amaryllisnaturais
              </a>
              <a
                href={AMARYLLIS_COMPANY.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="w-4 h-4 text-primary" /> Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Amaryllis Produtos Naturais e Dietéticos. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors" aria-label="Área administrativa">
            <Lock className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  </footer>
));

Footer.displayName = "Footer";
export default Footer;
