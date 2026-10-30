import { useRef, useState } from "react";
import { Upload, Download, RotateCcw, Loader2, Image as ImageIcon, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateSiteMedia, type SiteMediaRow } from "@/hooks/useSiteMedia";

interface Props {
  row: SiteMediaRow;
  /** Bundled-asset URL used when no override is saved. */
  fallbackUrl: string;
}

const BUCKET = "site-media";
const STORAGE_MARKER = "/storage/v1/object/public/site-media/";

const MediaSlot = ({ row, fallbackUrl }: Props) => {
  const { toast } = useToast();
  const update = useUpdateSiteMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isVideo = row.type === "video";
  const isCustom = !!row.url;
  const currentUrl = row.url || fallbackUrl;

  async function handleUpload(file: File) {
    if (!file) return;
    const expectedPrefix = isVideo ? "video/" : "image/";
    if (!file.type.startsWith(expectedPrefix)) {
      toast({
        title: `Selecione um arquivo de ${isVideo ? "vídeo" : "imagem"}`,
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const safeKey = row.key.replace(/[^a-z0-9_]/gi, "_");
      const path = `${row.page}/${safeKey}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      // Delete old uploaded file if it was custom
      if (row.url && row.url.includes(STORAGE_MARKER)) {
        const oldPath = row.url.substring(row.url.indexOf(STORAGE_MARKER) + STORAGE_MARKER.length);
        await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => {});
      }

      await update.mutateAsync({ key: row.key, url: data.publicUrl });
      toast({ title: "Mídia atualizada!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleReset() {
    if (!isCustom) return;
    if (!confirm("Restaurar a mídia padrão? A versão personalizada será removida.")) return;
    try {
      if (row.url && row.url.includes(STORAGE_MARKER)) {
        const oldPath = row.url.substring(row.url.indexOf(STORAGE_MARKER) + STORAGE_MARKER.length);
        await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => {});
      }
      await update.mutateAsync({ key: row.key, url: null });
      toast({ title: "Mídia restaurada ao padrão" });
    } catch (err: any) {
      toast({ title: "Erro ao restaurar", description: err.message, variant: "destructive" });
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(currentUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = (currentUrl.split(".").pop() || (isVideo ? "mp4" : "jpg")).split("?")[0];
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${row.key.replace(/\./g, "_")}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err: any) {
      toast({ title: "Erro ao baixar", description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card flex flex-col gap-3">
      <div className="flex items-start gap-2">
        {isVideo ? <Film className="w-4 h-4 text-primary shrink-0 mt-0.5" /> : <ImageIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">{row.label}</h3>
          <p className="text-[11px] text-muted-foreground font-mono truncate">{row.key}</p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isCustom ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {isCustom ? "Personalizada" : "Padrão"}
        </span>
      </div>

      <div className="rounded-md overflow-hidden border border-border bg-muted/30 aspect-video flex items-center justify-center">
        {isVideo ? (
          <video src={currentUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <img src={currentUrl} alt={row.label} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={isVideo ? "video/*" : "image/*"}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        <Button
          size="sm"
          variant="default"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-1.5 flex-1 min-w-[100px]"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "Enviando..." : "Trocar"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Baixar
        </Button>
        {isCustom && (
          <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5 text-muted-foreground" disabled={update.isPending}>
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar
          </Button>
        )}
      </div>
    </div>
  );
};

export default MediaSlot;
