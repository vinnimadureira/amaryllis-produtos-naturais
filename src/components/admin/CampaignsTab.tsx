import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "./ActivityLogsTab";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

const iconOptions = [
  { value: "heart", label: "Coração" },
  { value: "gift", label: "Presente" },
  { value: "sparkles", label: "Brilhos" },
];

const hslToHex = (hsl: string): string => {
  try {
    const parts = hsl.trim().split(/\s+/);
    const h = parseFloat(parts[0]) || 0;
    const s = (parseFloat(parts[1]) || 0) / 100;
    const l = (parseFloat(parts[2]) || 0) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch {
    return "#d4748a";
  }
};

const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const CampaignFormDialog = ({
  campaign,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  campaign?: Campaign;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) controlledOnOpenChange?.(v);
    else setInternalOpen(v);
  };
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: campaign?.title || "",
    subtitle: campaign?.subtitle || "",
    icon: campaign?.icon || "heart",
    badge: campaign?.badge || "",
    gradient_from: campaign?.gradient_from || "345 40% 65%",
    gradient_to: campaign?.gradient_to || "38 60% 55%",
    display_order: campaign?.display_order?.toString() || "0",
    active: campaign?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      icon: form.icon,
      badge: form.badge || null,
      gradient_from: form.gradient_from,
      gradient_to: form.gradient_to,
      display_order: parseInt(form.display_order) || 0,
      active: form.active,
    };

    let error;
    if (campaign) {
      ({ error } = await supabase.from("campaigns").update(payload).eq("id", campaign.id));
    } else {
      ({ error } = await supabase.from("campaigns").insert(payload));
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: campaign ? "Campanha atualizada" : "Campanha criada" });
      logActivity(campaign ? "Atualizou campanha" : "Criou campanha", "campaign", campaign?.id, form.title);
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{campaign ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Título</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Subtítulo</label>
            <Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Ícone</label>
              <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Badge (opcional)</label>
              <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Ex: 20% OFF" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Cor Inicial</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hslToHex(form.gradient_from)}
                  onChange={(e) => setForm({ ...form, gradient_from: hexToHsl(e.target.value) })}
                  className="w-10 h-10 rounded-md border border-border cursor-pointer p-0.5"
                />
                <span className="text-xs text-muted-foreground flex-1 truncate">{form.gradient_from}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Cor Final</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hslToHex(form.gradient_to)}
                  onChange={(e) => setForm({ ...form, gradient_to: hexToHsl(e.target.value) })}
                  className="w-10 h-10 rounded-md border border-border cursor-pointer p-0.5"
                />
                <span className="text-xs text-muted-foreground flex-1 truncate">{form.gradient_to}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Ordem</label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                {form.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} Ativa
              </label>
            </div>
          </div>
          <Button type="submit" className="w-full">
            {campaign ? "Salvar Alterações" : "Criar Campanha"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CampaignsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Campaign | null>(null);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("display_order");
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast({ title: "Campanha excluída" });
      logActivity("Excluiu campanha", "campaign");
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">Campanhas</h2>
        <CampaignFormDialog trigger={<Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nova Campanha</Button>} />
      </div>
      <div className="space-y-3">
        {campaigns.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => setViewing(c)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewing(c); } }}
            className="bg-card rounded-lg p-4 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md hover:bg-accent/5 transition-all"
          >
            <div
              className="w-12 h-12 rounded-lg shrink-0"
              style={{
                background: `linear-gradient(135deg, hsl(${c.gradient_from}), hsl(${c.gradient_to}))`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">{c.title}</h3>
                {!c.active && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Inativa</span>}
                {c.badge && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.badge}</span>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{c.subtitle}</p>
            </div>
            <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label="Editar">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="text-destructive hover:text-destructive" aria-label="Excluir">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma campanha cadastrada.</p>
        )}
      </div>

      {/* Details dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Detalhes da Campanha</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div
                className="w-full h-20 rounded-lg"
                style={{ background: `linear-gradient(135deg, hsl(${viewing.gradient_from}), hsl(${viewing.gradient_to}))` }}
              />
              <div><strong>Título:</strong> {viewing.title}</div>
              {viewing.subtitle && <div><strong>Subtítulo:</strong> {viewing.subtitle}</div>}
              {viewing.badge && <div><strong>Badge:</strong> {viewing.badge}</div>}
              <div><strong>Ícone:</strong> {viewing.icon}</div>
              <div><strong>Ordem:</strong> {viewing.display_order}</div>
              <div><strong>Status:</strong> {viewing.active ? "Ativa" : "Inativa"}</div>
              <Button
                onClick={() => { const c = viewing; setViewing(null); setEditing(c); }}
                className="w-full mt-2 gap-2"
              >
                <Pencil className="w-4 h-4" /> Alterar dados
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editing && (
        <CampaignFormDialog
          key={editing.id}
          campaign={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir campanha?"
        description="A campanha será removida permanentemente."
        onConfirm={() => { if (deleteId) deleteCampaign.mutate(deleteId); setDeleteId(null); }}
      />
    </div>
  );
};

export default CampaignsTab;
