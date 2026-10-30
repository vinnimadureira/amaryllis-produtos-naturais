import { useState, useEffect, useRef } from "react";
import { Save, Loader2, Film, Upload, Trash2, Sun } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import heroVideoAsset from "@/assets/hero-pizza-cone-v3.mp4.asset.json";

const KEYS = ["hero_video_url", "hero_video_brightness"] as const;
const DEFAULT_BRIGHTNESS = 0.58;
const MIN_BRIGHTNESS = 0;
const MAX_BRIGHTNESS = 1;

const clampBrightness = (value: number) => Math.min(MAX_BRIGHTNESS, Math.max(MIN_BRIGHTNESS, value));
const brightnessToPercent = (value: number) => Math.round(value * 100);
const getOverlayOpacity = (value: number) => {
  const darkness = 1 - clampBrightness(value);
  return {
    solid: darkness * 0.24,
    side: darkness * 0.72,
    bottom: darkness * 0.5,
    radial: darkness * 0.82,
  };
};

const HeroVideoSettings = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);

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
    const url = settings.find((s: any) => s.key === "hero_video_url")?.value || "";
    const b = parseFloat(settings.find((s: any) => s.key === "hero_video_brightness")?.value || String(DEFAULT_BRIGHTNESS));
    setVideoUrl(url);
    setBrightness(isFinite(b) ? clampBrightness(b) : DEFAULT_BRIGHTNESS);
  }, [settings]);

  const currentVideoUrl = videoUrl || heroVideoAsset.url;
  const isUsingDefaultVideo = !videoUrl;
  const overlayOpacity = getOverlayOpacity(brightness);

  async function persist(key: string, value: string | null) {
    const existing = settings.find((s: any) => s.key === key);
    if (existing) {
      return supabase.from("site_settings").update({ value }).eq("id", existing.id);
    }
    return supabase.from("site_settings").insert({ key, value });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const r1 = await persist("hero_video_url", videoUrl || null);
      const r2 = await persist("hero_video_brightness", String(Number(clampBrightness(brightness).toFixed(2))));
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
      toast({ title: "Configurações salvas!" });
      qc.invalidateQueries({ queryKey: ["hero-video-settings"] });
      qc.invalidateQueries({ queryKey: ["hero-video-public"] });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Selecione um arquivo de vídeo", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `hero/hero-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-media")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      setVideoUrl(data.publicUrl);
      // Save immediately
      const r = await persist("hero_video_url", data.publicUrl);
      if (r.error) throw r.error;
      toast({ title: "Vídeo enviado e salvo!" });
      qc.invalidateQueries({ queryKey: ["hero-video-settings"] });
      qc.invalidateQueries({ queryKey: ["hero-video-public"] });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm("Remover o vídeo do hero? O site voltará a usar o vídeo padrão.")) return;
    try {
      // Try to delete file from bucket if it's a site-media URL
      const marker = "/storage/v1/object/public/site-media/";
      const idx = videoUrl.indexOf(marker);
      if (idx >= 0) {
        const path = videoUrl.substring(idx + marker.length);
        await supabase.storage.from("site-media").remove([path]);
      }
      const r = await persist("hero_video_url", null);
      if (r.error) throw r.error;
      setVideoUrl("");
      toast({ title: "Vídeo removido" });
      qc.invalidateQueries({ queryKey: ["hero-video-settings"] });
      qc.invalidateQueries({ queryKey: ["hero-video-public"] });
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-foreground">Vídeo do Hero</h2>
            <p className="text-xs text-muted-foreground">Vídeo de fundo da página inicial e seu brilho</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </Button>
      </div>

      {/* Preview */}
      <div className="mb-6 rounded-lg overflow-hidden border border-border bg-brand-deep aspect-video relative">
        <video
          key={currentVideoUrl}
          src={currentVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          style={{ filter: `brightness(${brightness}) contrast(1.05) saturate(0.92)` }}
        />
        <div className="absolute inset-0 bg-brand-deep pointer-events-none" style={{ opacity: overlayOpacity.solid }} />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/80 to-transparent pointer-events-none" style={{ opacity: overlayOpacity.side }} />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/20 to-transparent pointer-events-none" style={{ opacity: overlayOpacity.bottom }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_58%_at_27%_55%,hsl(var(--brand-deep)/0.86),hsl(var(--brand-deep)/0.52)_48%,transparent_72%)] pointer-events-none" style={{ opacity: overlayOpacity.radial }} />
        <div className="absolute left-3 top-3 rounded-md bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm">
          {isUsingDefaultVideo ? "Vídeo padrão do site" : "Vídeo personalizado"} · brilho atual {(brightness * 100).toFixed(0)}%
        </div>
      </div>

      {/* Brightness */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Sun className="w-3.5 h-3.5" />Brilho do vídeo
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={brightnessToPercent(MIN_BRIGHTNESS)}
              max={brightnessToPercent(MAX_BRIGHTNESS)}
              step={1}
              value={brightnessToPercent(brightness)}
              onChange={(e) => setBrightness(clampBrightness(Number(e.target.value || brightnessToPercent(DEFAULT_BRIGHTNESS)) / 100))}
              className="h-8 w-20 text-right"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
        <Slider
          value={[brightness]}
          onValueChange={(v) => setBrightness(clampBrightness(v[0]))}
          min={MIN_BRIGHTNESS}
          max={MAX_BRIGHTNESS}
          step={0.01}
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          A prévia acima simula o mesmo escurecimento do site. Use 100% para brilho máximo/natural ou ajuste de 1 em 1%.
        </p>
      </div>

      {/* Upload / URL */}
      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          URL do vídeo
        </label>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Usando o vídeo padrão do site — envie um arquivo abaixo ou cole uma URL"
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gap-1.5"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Enviar novo vídeo
          </Button>
          {videoUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Excluir vídeo
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Recomendado: MP4 (H.264), até ~20 MB, 1920×1080, sem áudio.
        </p>
      </div>
    </div>
  );
};

export default HeroVideoSettings;
