import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ShoppingCart, Pencil, Trash2, Loader2, Filter, Tag, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { logActivity } from "./ActivityLogsTab";
import { cn } from "@/lib/utils";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string | null;
  notes: string | null;
  category: string | null;
  done: boolean;
  display_order: number;
  created_at: string;
}

const emptyForm = {
  name: "",
  quantity: "",
  notes: "",
  category: "",
};

const ShoppingListTab = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["shopping-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopping_list")
        .select("*")
        .order("done", { ascending: true })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ShoppingItem[];
    },
  });

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter === "pending" && i.done) return false;
      if (filter === "done" && !i.done) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${i.name} ${i.category || ""} ${i.notes || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => !i.done).length,
    done: items.filter((i) => i.done).length,
  }), [items]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Nome obrigatório");
      const payload = {
        name: form.name.trim(),
        quantity: form.quantity.trim() || null,
        notes: form.notes.trim() || null,
        category: form.category.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("shopping_list").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shopping_list").insert(payload);
        if (error) throw error;
      }
      return { isNew: !editingId };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: r.isNew ? "Item adicionado!" : "Item atualizado!" });
      logActivity(r.isNew ? "Adicionou item à lista de compras" : "Editou item da lista de compras", "shopping_item");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("shopping_list").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shopping_list").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
      toast({ title: "Item excluído" });
      logActivity("Excluiu item da lista de compras", "shopping_item");
    },
  });

  const clearDoneMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shopping_list").delete().eq("done", true);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
      toast({ title: "Itens concluídos removidos" });
    },
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      quantity: item.quantity || "",
      notes: item.notes || "",
      category: item.category || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold">Lista de Compras</h2>
            <p className="text-xs text-muted-foreground">
              Itens para comprar — marque conforme conclui
            </p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBlock label="Total" value={stats.total} active={filter === "all"} onClick={() => setFilter("all")} />
        <StatBlock label="Pendentes" value={stats.pending} active={filter === "pending"} onClick={() => setFilter("pending")} accent="amber" />
        <StatBlock label="Concluídos" value={stats.done} active={filter === "done"} onClick={() => setFilter("done")} accent="emerald" />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, categoria ou nota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {items.length === 0 ? "Sua lista de compras está vazia." : "Nenhum item encontrado neste filtro."}
            </p>
            {items.length === 0 && (
              <Button onClick={openNew} variant="outline" className="gap-1.5">
                <Plus className="w-4 h-4" /> Adicionar primeiro item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id} className={cn("transition-all", item.done && "opacity-60")}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox
                  checked={item.done}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, done: !!checked })}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-sm font-medium text-foreground truncate", item.done && "line-through")}>
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        {item.quantity}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {item.category}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)} aria-label="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(item.id)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stats.done > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearDoneMutation.mutate()}
            className="text-muted-foreground hover:text-destructive gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar concluídos ({stats.done})
          </Button>
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Editar item" : "Novo item da lista"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Nome *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Fitas de cetim rosa"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium block mb-1">Quantidade</label>
                <Input
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="Ex: 5 metros"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Categoria</label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: Embalagens"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Observações</label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Cor, marca preferida, fornecedor..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.name.trim()}
                className="flex-1"
              >
                {saveMutation.isPending ? "Salvando..." : (editingId ? "Salvar" : "Adicionar")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir item?"
        description="O item será removido da lista de compras."
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
      />
    </div>
  );
};

const StatBlock = ({
  label, value, active, onClick, accent,
}: { label: string; value: number; active: boolean; onClick: () => void; accent?: "amber" | "emerald" }) => {
  const accentClass = accent === "amber"
    ? "border-amber-500 bg-amber-500/5"
    : accent === "emerald"
      ? "border-emerald-500 bg-emerald-500/5"
      : "border-primary bg-primary/5";
  return (
    <button
      onClick={onClick}
      className={cn(
        "border rounded-lg p-3 text-left transition-all",
        active ? accentClass : "border-border bg-card hover:bg-muted/30"
      )}
    >
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
    </button>
  );
};

export default ShoppingListTab;
