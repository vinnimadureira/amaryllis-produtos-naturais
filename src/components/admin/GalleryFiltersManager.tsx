import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, GripVertical, Check, X, Eye, EyeOff, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "./ActivityLogsTab";
import ConfirmDialog from "@/components/ConfirmDialog";

export interface GalleryFilter {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
}

const GalleryFiltersManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deleteFilter, setDeleteFilter] = useState<GalleryFilter | null>(null);

  const { data: filters = [], isLoading } = useQuery({
    queryKey: ["admin-gallery-filters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_filters")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as GalleryFilter[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-gallery-filters"] });
    queryClient.invalidateQueries({ queryKey: ["gallery-filters"] });
  };

  const addFilter = useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Informe um nome");
      const nextOrder = filters.length ? Math.max(...filters.map((f) => f.display_order)) + 1 : 0;
      const { error } = await supabase
        .from("gallery_filters")
        .insert({ name: trimmed, display_order: nextOrder, active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Filtro adicionado" });
      logActivity("Adicionou filtro à galeria", "gallery_filters");
      setNewName("");
      invalidate();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const updateFilter = useMutation({
    mutationFn: async (payload: Partial<GalleryFilter> & { id: string }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("gallery_filters").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Filtro atualizado" });
      setEditingId(null);
      invalidate();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteFilterMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_filters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Filtro excluído" });
      logActivity("Excluiu filtro da galeria", "gallery_filters");
      invalidate();
    },
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; display_order: number }[]) => {
      for (const item of items) {
        await supabase.from("gallery_filters").update({ display_order: item.display_order }).eq("id", item.id);
      }
    },
    onSuccess: invalidate,
  });

  const handleDrop = useCallback((targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); return; }
    const arr = [...filters];
    const fromIdx = arr.findIndex((f) => f.id === draggedId);
    const toIdx = arr.findIndex((f) => f.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDraggedId(null); return; }
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    reorder.mutate(arr.map((f, i) => ({ id: f.id, display_order: i })));
    setDraggedId(null);
  }, [draggedId, filters, reorder]);

  const startEdit = (f: GalleryFilter) => {
    setEditingId(f.id);
    setEditName(f.name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateFilter.mutate({ id: editingId, name: editName.trim() });
  };

  return (
    <div className="mb-6 rounded-lg border border-border bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors rounded-lg"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Filtros da Galeria pública</span>
          <span className="text-xs text-muted-foreground">
            ({filters.filter((f) => f.active).length} ativo{filters.filter((f) => f.active).length !== 1 ? "s" : ""} · {filters.length} total)
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          <p className="text-xs text-muted-foreground">
            Estes filtros aparecem na página pública <strong>Galeria</strong>. Crie, renomeie, ative/desative ou arraste para reordenar.
            Use o mesmo nome ao categorizar uma foto para que ela apareça no filtro correspondente.
          </p>

          {/* Novo filtro */}
          <form
            onSubmit={(e) => { e.preventDefault(); addFilter.mutate(newName); }}
            className="flex gap-2"
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do filtro (ex: Industrial)"
              className="h-9"
            />
            <Button type="submit" size="sm" disabled={!newName.trim() || addFilter.isPending} className="gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </form>

          {/* Lista */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Carregando filtros...</p>
          ) : filters.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum filtro cadastrado.</p>
          ) : (
            <ul className="space-y-1.5">
              {filters.map((f) => (
                <li
                  key={f.id}
                  draggable
                  onDragStart={() => setDraggedId(f.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(f.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-md border bg-background transition-all ${
                    draggedId === f.id ? "opacity-50 border-primary" : "border-border"
                  } ${!f.active ? "opacity-60" : ""}`}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                  {editingId === f.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm flex-1"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                      />
                      <Button size="sm" className="h-8 gap-1" onClick={saveEdit} disabled={!editName.trim()}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">{f.name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">#{f.display_order}</span>
                      <div className="flex items-center gap-1.5 px-2 border-l border-border">
                        {f.active ? (
                          <Eye className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <Switch
                          checked={f.active}
                          onCheckedChange={(checked) => updateFilter.mutate({ id: f.id, active: checked })}
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(f)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteFilter(f)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteFilter}
        onOpenChange={(o) => !o && setDeleteFilter(null)}
        title="Excluir filtro?"
        description={`O filtro "${deleteFilter?.name}" será removido da Galeria pública. Fotos com essa categoria continuam existindo, mas o botão de filtro desaparece.`}
        onConfirm={() => { if (deleteFilter) deleteFilterMut.mutate(deleteFilter.id); setDeleteFilter(null); }}
      />
    </div>
  );
};

export default GalleryFiltersManager;
