import { useEffect, useState } from "react";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUpdateSiteMedia, type SiteMediaRow, type SiteMediaMeta } from "@/hooks/useSiteMedia";
import MediaSlot from "./MediaSlot";

interface Props {
  row: SiteMediaRow;
  fallbackUrl: string;
  defaults: { name: string; tag: string; description: string };
}

const SaborEditor = ({ row, fallbackUrl, defaults }: Props) => {
  const { toast } = useToast();
  const update = useUpdateSiteMedia();

  const initial = {
    name: row.meta?.name ?? "",
    tag: row.meta?.tag ?? "",
    description: row.meta?.description ?? "",
  };
  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm({
      name: row.meta?.name ?? "",
      tag: row.meta?.tag ?? "",
      description: row.meta?.description ?? "",
    });
  }, [row.meta?.name, row.meta?.tag, row.meta?.description]);

  const dirty =
    form.name !== initial.name ||
    form.tag !== initial.tag ||
    form.description !== initial.description;

  async function handleSave() {
    const meta: SiteMediaMeta = {
      ...(row.meta || {}),
      name: form.name.trim() || undefined,
      tag: form.tag.trim() || undefined,
      description: form.description.trim() || undefined,
    };
    try {
      await update.mutateAsync({ key: row.key, meta });
      toast({ title: "Textos salvos!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  }

  async function handleResetText() {
    if (!confirm("Restaurar os textos padrão deste sabor?")) return;
    try {
      await update.mutateAsync({
        key: row.key,
        meta: { ...(row.meta || {}), name: undefined, tag: undefined, description: undefined },
      });
      toast({ title: "Textos restaurados" });
    } catch (err: any) {
      toast({ title: "Erro ao restaurar", description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card flex flex-col gap-4">
      <MediaSlot row={row} fallbackUrl={fallbackUrl} />

      <div className="border-t border-border pt-4 space-y-3">
        <div>
          <Label htmlFor={`${row.key}-name`} className="text-xs">
            Nome do sabor
          </Label>
          <Input
            id={`${row.key}-name`}
            value={form.name}
            placeholder={defaults.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 h-9 text-sm"
          />
        </div>

        <div>
          <Label htmlFor={`${row.key}-tag`} className="text-xs">
            Tag / Categoria (ex.: Clássico, Best-seller)
          </Label>
          <Input
            id={`${row.key}-tag`}
            value={form.tag}
            placeholder={defaults.tag}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            className="mt-1 h-9 text-sm"
          />
        </div>

        <div>
          <Label htmlFor={`${row.key}-desc`} className="text-xs">
            Descrição
          </Label>
          <Textarea
            id={`${row.key}-desc`}
            value={form.description}
            placeholder={defaults.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 text-sm min-h-[80px]"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || update.isPending}
            className="gap-1.5 flex-1 min-w-[100px]"
          >
            {update.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar textos
          </Button>
          {(row.meta?.name || row.meta?.tag || row.meta?.description) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetText}
              className="gap-1.5 text-muted-foreground"
              disabled={update.isPending}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaborEditor;
