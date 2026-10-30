import { ArrowRight, MessageCircle, Star } from "lucide-react";

interface SectionLivePreviewProps {
  type: string;
  content: Record<string, any>;
}

/**
 * Lightweight, scaled-down rendering of a page section
 * — just enough to preview text/CTA changes inside the editor.
 * Buttons are non-interactive on purpose.
 */
const SectionLivePreview = ({ type, content }: SectionLivePreviewProps) => {
  switch (type) {
    case "hero":
      return (
        <div className="rounded-lg overflow-hidden bg-rose-light min-h-[260px] p-6 flex flex-col justify-center relative">
          <div className="absolute inset-0 bg-foreground/10" />
          <div className="relative z-10 max-w-md">
            <div className="inline-block bg-primary/30 backdrop-blur-sm rounded-xl px-5 py-4">
              <h1 className="font-serif text-xl font-bold text-foreground">
                {content.title || "Título do Hero"}
              </h1>
              {content.subtitle && (
                <p className="text-sm text-foreground/80 mt-2">{content.subtitle}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {content.cta_secondary_label && (
                <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium">
                  <MessageCircle className="w-3 h-3" />
                  {content.cta_secondary_label}
                </span>
              )}
              {content.cta_label && (
                <span className="inline-flex items-center gap-1.5 border-2 border-primary text-primary bg-background rounded-md px-3 py-1.5 text-xs font-medium">
                  {content.cta_label}
                  <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </div>
      );

    case "about":
      return (
        <div className="rounded-lg bg-card border p-6 text-center min-h-[200px] flex flex-col justify-center">
          <h2 className="font-serif text-xl font-bold text-foreground mb-2">
            {content.title || "Sobre nós"}
          </h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line mb-4">
            {content.text || "Texto descritivo da seção."}
          </p>
          {content.cta_label && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 border border-primary text-primary rounded-md px-3 py-1.5 text-xs font-medium">
                {content.cta_label}
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      );

    case "banner":
      return (
        <div className="rounded-lg bg-gradient-to-br from-primary/20 to-secondary/40 p-6 text-center min-h-[180px] flex flex-col justify-center">
          <h2 className="font-serif text-xl font-bold text-foreground mb-2">
            {content.title || "Título do banner"}
          </h2>
          {content.subtitle && (
            <p className="text-sm text-muted-foreground">{content.subtitle}</p>
          )}
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3">
            Cards de campanhas vêm da aba "Campanhas"
          </p>
        </div>
      );

    case "testimonials":
      return (
        <div className="rounded-lg bg-card border p-6 min-h-[200px]">
          <h2 className="font-serif text-xl font-bold text-foreground text-center mb-4">
            {content.title || "Depoimentos"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3">
                <div className="flex gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="w-3 h-3 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  "Adorei o produto, super recomendo!"
                </p>
                <p className="text-[10px] font-medium text-foreground mt-1.5">— Cliente</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3 text-center">
            Mostrando até {content.limit || 6} depoimentos
          </p>
        </div>
      );


    case "cta":
      return (
        <div className="rounded-lg bg-gradient-to-br from-primary/20 to-secondary/40 p-6 text-center min-h-[200px] flex flex-col justify-center">
          <h2 className="font-serif text-xl font-bold text-foreground mb-2">
            {content.title || "Chamada final"}
          </h2>
          {content.subtitle && (
            <p className="text-sm text-muted-foreground mb-4">{content.subtitle}</p>
          )}
          {content.cta_label && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-4 py-2 text-xs font-medium">
                <MessageCircle className="w-3 h-3" />
                {content.cta_label}
              </span>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="rounded-lg bg-card border p-6 text-center text-sm text-muted-foreground">
          Pré-visualização não disponível para este tipo de seção.
        </div>
      );
  }
};

export default SectionLivePreview;
