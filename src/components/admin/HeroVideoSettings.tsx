import { useState, useEffect } from "react";
import { Save, Loader2, Film, Sun, Sliders, Eye, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const KEYS = ["hero_overlay_opacity", "hero_video_brightness", "hero_overlay_theme"] as const;

const DEFAULT_OVERLAY_OPACITY = 0.30; // 30% padrão (suave e permite ver o vídeo com total clareza)
const DEFAULT_VIDEO_BRIGHTNESS = 1.00; // 100% brilho natural
const DEFAULT_THEME = "botanico"; // verde botânico suave

const HeroVideoSettings = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULT_OVERLAY_OPACITY);
  const [videoBrightness, setVideoBrightness] = useState(DEFAULT_VIDEO_BRIGHTNESS);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["hero-video-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", KEYS as unknown as string[]);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!settings || settings.length === 0) return;

    const op = settings.find((s: any) => s.key === "hero_overlay_opacity")?.value;
    const br = settings.find((s: any) => s.key === "hero_video_brightness")?.value;
    const th = settings.find((s: any) => s.key === "hero_overlay_theme")?.value;

    if (op !== undefined && op !== null) setOverlayOpacity(parseFloat(op));
    if (br !== undefined && br !== null) setVideoBrightness(parseFloat(br));
    if (th) setTheme(th);
  }, [settings]);

  async function persist(key: string, value: string) {
    const existing = settings.find((s: any) => s.key === key);
    if (existing) {
      return supabase.from("site_settings").update({ value }).eq("id", existing.id);
    }
    return supabase.from("site_settings").insert({ key, value });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const r1 = await persist("hero_overlay_opacity", overlayOpacity.toFixed(2));
      const r2 = await persist("hero_video_brightness", videoBrightness.toFixed(2));
      const r3 = await persist("hero_overlay_theme", theme);

      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
      if (r3.error) throw r3.error;

      toast({
        title: "Aparência do Hero atualizada!",
        description: `Escurecimento em ${(overlayOpacity * 100).toFixed(0)}% e brilho em ${(videoBrightness * 100).toFixed(0)}%.`,
      });
      qc.invalidateQueries({ queryKey: ["hero-video-settings"] });
      qc.invalidateQueries({ queryKey: ["hero-video-public"] });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Intensidade & Fundo do Vídeo (Hero)
            </h2>
            <p className="text-xs text-muted-foreground">
              Controle a transparência do fundo verde, brilho e contraste para deixar o vídeo mais visível ou mais escuro
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </Button>
      </div>

      {/* Prévia ao Vivo em Tempo Real */}
      <div className="mb-8 rounded-2xl overflow-hidden border border-border bg-emerald-950 aspect-video relative shadow-lg">
        <video
          src="/media/amaryllis-hero-tea.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: `brightness(${videoBrightness}) contrast(1.06) saturate(1.1)` }}
        />

        {/* Camada de Gradiente em Tempo Real com a Opacidade do Slider */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: overlayOpacity,
            background:
              theme === "cinematic"
                ? "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%)"
                : theme === "minimal"
                ? "radial-gradient(ellipse 65% 80% at 25% 50%, rgba(0,0,0,0.65), transparent 75%)"
                : "linear-gradient(to right, rgba(6,35,24,0.88) 0%, rgba(6,35,24,0.45) 50%, rgba(6,35,24,0.15) 100%)",
          }}
        />

        {/* Texto Simulado na Prévia */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold uppercase tracking-wider self-start">
            <Sparkles className="w-3 h-3 text-amber-300" /> Prévia em Tempo Real
          </div>

          <div className="max-w-lg">
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Fitoterápicos Puros &{" "}
              <span className="italic text-amber-200">Chás Medicinais.</span>
            </h3>
            <p className="text-xs sm:text-sm text-white/90 mt-2 font-light drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              Sabedoria botânica respaldada pela ciência: própolis verde, extratos padronizados e infusões aromáticas.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/80 bg-black/50 backdrop-blur-md p-2 rounded-lg">
            <span>Escurecimento: <strong>{(overlayOpacity * 100).toFixed(0)}%</strong></span>
            <span>Brilho do Vídeo: <strong>{(videoBrightness * 100).toFixed(0)}%</strong></span>
            <span>Estilo: <strong>{theme}</strong></span>
          </div>
        </div>
      </div>

      {/* Controles de Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-card border border-border shadow-soft">
        {/* Controle 1: Intensidade do Fundo / Escurecimento */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              <Sliders className="w-4 h-4 text-primary" />
              Escurecimento do Fundo
            </label>
            <span className="font-mono text-sm font-bold text-primary">
              {(overlayOpacity * 100).toFixed(0)}%
            </span>
          </div>

          <Slider
            value={[overlayOpacity]}
            onValueChange={(v) => setOverlayOpacity(v[0])}
            min={0}
            max={0.9}
            step={0.02}
          />

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>0% (Vídeo Puro)</span>
            <span className="text-primary font-medium">30% (Recomendado)</span>
            <span>90% (Mais Escuro)</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Diminua este valor para deixar o vídeo de fundo <strong>mais visível, claro e nítido</strong>. Em 30%, o vídeo aparece perfeitamente e o texto continua fácil de ler.
          </p>
        </div>

        {/* Controle 2: Brilho do Vídeo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              <Sun className="w-4 h-4 text-amber-500" />
              Brilho Natural do Vídeo
            </label>
            <span className="font-mono text-sm font-bold text-amber-600">
              {(videoBrightness * 100).toFixed(0)}%
            </span>
          </div>

          <Slider
            value={[videoBrightness]}
            onValueChange={(v) => setVideoBrightness(v[0])}
            min={0.6}
            max={1.4}
            step={0.02}
          />

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>60% (Suave)</span>
            <span className="text-amber-600 font-medium">100% (Natural)</span>
            <span>140% (Vívido)</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Ajusta o ganho de iluminação da gravação do vídeo. 100% preserva as cores naturais da câmera.
          </p>
        </div>
      </div>

      {/* Seletor de Estilo do Fundo */}
      <div className="mt-6 p-6 rounded-2xl bg-card border border-border shadow-soft">
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
          Tom da Atmosfera de Fundo
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "botanico",
              title: "Verde Botânico Suave",
              desc: "Gradiente esmeralda sutil, alinhado à identidade Amaryllis.",
            },
            {
              id: "cinematic",
              title: "Preto Fumê / Cinema",
              desc: "Tons neutros escuros sem matiz esverdeado.",
            },
            {
              id: "minimal",
              title: "Minimalista",
              desc: "Apenas sombra sob os textos, com o vídeo quase 100% descoberto.",
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`p-4 rounded-xl text-left border transition-all ${
                theme === t.id
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border hover:border-primary/40 bg-background"
              }`}
            >
              <p className="font-medium text-sm text-foreground">{t.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroVideoSettings;
