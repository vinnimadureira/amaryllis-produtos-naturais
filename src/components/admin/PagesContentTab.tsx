import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import {
  GripVertical,
  Pencil,
  Eye,
  EyeOff,
  Layout,
  Loader2,
  Save,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { logActivity } from "@/components/admin/ActivityLogsTab";
import SectionLivePreview from "@/components/admin/SectionLivePreview";

interface SectionRow {
  id: string;
  page_key: string;
  section_key: string;
  type: string;
  content: Record<string, any>;
  display_order: number;
  active: boolean;
}

const FIELD_SCHEMAS: Record<string, { key: string; label: string; type: "text" | "textarea" | "url" }[]> = {
  hero: [
    { key: "title", label: "Título", type: "text" },
    { key: "subtitle", label: "Subtítulo", type: "textarea" },
    { key: "cta_label", label: "Botão principal — texto", type: "text" },
    { key: "cta_link", label: "Botão principal — link", type: "url" },
    { key: "cta_secondary_label", label: "Botão secundário — texto", type: "text" },
    { key: "cta_secondary_link", label: "Botão secundário — link", type: "url" },
  ],
  about: [
    { key: "title", label: "Título", type: "text" },
    { key: "text", label: "Texto", type: "textarea" },
    { key: "cta_label", label: "Botão — texto", type: "text" },
    { key: "cta_link", label: "Botão — link", type: "url" },
  ],
  banner: [
    { key: "title", label: "Título", type: "text" },
    { key: "subtitle", label: "Subtítulo", type: "textarea" },
  ],
  testimonials: [
    { key: "title", label: "Título", type: "text" },
    { key: "limit", label: "Quantidade exibida", type: "text" },
  ],
  cta: [
    { key: "title", label: "Título", type: "text" },
    { key: "subtitle", label: "Subtítulo", type: "textarea" },
    { key: "cta_label", label: "Botão — texto", type: "text" },
    { key: "cta_link", label: "Botão — link", type: "url" },
  ],
};

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero (Banner principal)",
  about: "Sobre",
  banner: "Banner de campanhas",
  testimonials: "Depoimentos",
  cta: "Chamada final (CTA)",
};

const PagesContentTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pageKey, setPageKey] = useState("home");
  const [editing, setEditing] = useState<SectionRow | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deletePageOpen, setDeletePageOpen] = useState(false);

  // List of distinct pages currently in the table
  const { data: allPages = [] } = useQuery({
    queryKey: ["admin-page-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("page_key");
      if (error) throw error;
      const unique = Array.from(new Set((data || []).map((r: any) => r.page_key)));
      // Always include "home" as a baseline
      if (!unique.includes("home")) unique.unshift("home");
      return unique.sort();
    },
  });

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["admin-page-sections", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_key", pageKey)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as SectionRow[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (s: SectionRow) => {
      const { error } = await supabase
        .from("page_sections")
        .update({ active: !s.active })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: (_, s) => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-sections", pageKey] });
      queryClient.invalidateQueries({ queryKey: ["page-sections", pageKey] });
      logActivity(s.active ? "Ocultou seção" : "Ativou seção", "page_section", s.id, s.section_key);
    },
  });

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    await Promise.all(
      reordered.map((s, i) =>
        supabase.from("page_sections").update({ display_order: i }).eq("id", s.id)
      )
    );
    queryClient.invalidateQueries({ queryKey: ["admin-page-sections", pageKey] });
    queryClient.invalidateQueries({ queryKey: ["page-sections", pageKey] });
    toast({ title: "Ordem atualizada" });
  };

  const handleDuplicate = async (newKey: string) => {
    const cleanKey = newKey.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    if (!cleanKey) {
      toast({ title: "Slug inválido", variant: "destructive" });
      return;
    }
    if (allPages.includes(cleanKey)) {
      toast({ title: "Já existe uma página com esse slug", variant: "destructive" });
      return;
    }
    if (sections.length === 0) {
      toast({ title: "Nada para duplicar nesta página", variant: "destructive" });
      return;
    }
    const rows = sections.map((s) => ({
      page_key: cleanKey,
      section_key: s.section_key,
      type: s.type,
      content: s.content,
      display_order: s.display_order,
      active: s.active,
    }));
    const { error } = await supabase.from("page_sections").insert(rows);
    if (error) {
      toast({ title: "Erro ao duplicar", description: error.message, variant: "destructive" });
      return;
    }
    logActivity("Duplicou página", "page", cleanKey, `de ${pageKey}`);
    const fullUrl = `${window.location.origin}/p/${cleanKey}`;
    sonnerToast.success(`Página "${cleanKey}" criada`, {
      description: `${rows.length} seções clonadas\n${fullUrl}`,
      duration: 10000,
      action: {
        label: "Copiar link",
        onClick: () => {
          navigator.clipboard.writeText(fullUrl).then(
            () => sonnerToast.success("Link copiado!"),
            () => sonnerToast.error("Não foi possível copiar"),
          );
        },
      },
    });
    queryClient.invalidateQueries({ queryKey: ["admin-page-keys"] });
    setDuplicateOpen(false);
    setPageKey(cleanKey);
  };

  const handleDeletePage = async () => {
    if (pageKey === "home") {
      toast({ title: "A página Home não pode ser excluída", variant: "destructive" });
      setDeletePageOpen(false);
      return;
    }
    const { error } = await supabase.from("page_sections").delete().eq("page_key", pageKey);
    if (error) {
      toast({ title: "Erro ao excluir página", description: error.message, variant: "destructive" });
      return;
    }
    logActivity("Excluiu página", "page", pageKey);
    toast({ title: `Página "${pageKey}" excluída` });
    queryClient.invalidateQueries({ queryKey: ["admin-page-keys"] });
    setDeletePageOpen(false);
    setPageKey("home");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layout className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-foreground">Páginas & Conteúdo</h2>
            <p className="text-xs text-muted-foreground">
              Edite títulos, textos e botões das seções do site sem mexer no código.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5"
          >
            <a
              href={pageKey === "home" ? "/" : `/p/${pageKey}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver página
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDuplicateOpen(true)}
            className="gap-1.5"
            disabled={sections.length === 0}
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicar página
          </Button>
          {pageKey !== "home" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletePageOpen(true)}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1 mb-6 w-fit">
        {allPages.map((p) => (
          <button
            key={p}
            onClick={() => setPageKey(p)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
              pageKey === p
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p === "home" ? "Home" : p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="page-sections">
            {(provided) => (
              <div className="space-y-2" ref={provided.innerRef} {...provided.droppableProps}>
                {sections.map((s, idx) => (
                  <Draggable key={s.id} draggableId={s.id} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "bg-card rounded-lg p-3 flex items-center gap-3 shadow-sm transition-all border",
                          snapshot.isDragging && "shadow-lg ring-2 ring-primary/30",
                          !s.active && "opacity-60"
                        )}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground truncate">
                              {s.content?.title || s.section_key}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                              {TYPE_LABELS[s.type] || s.type}
                            </span>
                          </div>
                          {s.content?.subtitle && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {s.content.subtitle}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive.mutate(s)}
                          aria-label={s.active ? "Ocultar seção" : "Mostrar seção"}
                          title={s.active ? "Visível no site" : "Oculta no site"}
                        >
                          {s.active ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(s)}
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {sections.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Nenhuma seção cadastrada para esta página.
                  </p>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <SectionEditDialog
        section={editing}
        pageKey={pageKey}
        onClose={() => setEditing(null)}
      />

      <DuplicatePageDialog
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        sourceKey={pageKey}
        existingKeys={allPages}
        onConfirm={handleDuplicate}
      />

      <AlertDialog open={deletePageOpen} onOpenChange={setDeletePageOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir página "{pageKey}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as seções desta página serão removidas permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface SectionEditDialogProps {
  section: SectionRow | null;
  pageKey: string;
  onClose: () => void;
}

const SectionEditDialog = ({ section, pageKey, onClose }: SectionEditDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [content, setContent] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section) setContent({ ...(section.content || {}) });
    else setContent({});
  }, [section]);

  const fields = section ? FIELD_SCHEMAS[section.type] || [] : [];
  const isDirty = useMemo(() => {
    if (!section) return false;
    return JSON.stringify(content) !== JSON.stringify(section.content || {});
  }, [content, section]);

  const handleSave = async () => {
    if (!section) return;
    setSaving(true);
    try {
      const toSave = { ...content };
      const { error } = await supabase
        .from("page_sections")
        .update({ content: toSave })
        .eq("id", section.id);
      if (error) throw error;
      toast({ title: "Seção salva" });
      logActivity("Editou seção", "page_section", section.id, section.section_key);
      queryClient.invalidateQueries({ queryKey: ["admin-page-sections", pageKey] });
      queryClient.invalidateQueries({ queryKey: ["page-sections", pageKey] });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!section} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="font-serif">
            Editar: {section ? TYPE_LABELS[section.type] || section.section_key : ""}
          </DialogTitle>
        </DialogHeader>
        {section && (
          <div className="grid md:grid-cols-2 gap-0 max-h-[calc(92vh-72px)] overflow-hidden">
            {/* Form */}
            <div className="overflow-y-auto p-6 space-y-4 border-r">
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tipo de seção sem campos editáveis configurados.
                </p>
              )}
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <Textarea
                      value={content[f.key] ?? ""}
                      onChange={(e) =>
                        setContent((c) => ({ ...c, [f.key]: e.target.value }))
                      }
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={f.type === "url" ? "url" : "text"}
                      value={content[f.key] ?? ""}
                      onChange={(e) =>
                        setContent((c) => ({ ...c, [f.key]: e.target.value }))
                      }
                      placeholder={f.type === "url" ? "https://..." : ""}
                    />
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-2 justify-end pt-4 border-t mt-2">
                <Button variant="outline" onClick={onClose} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!section) return;
                    // Save draft override into sessionStorage and open preview tab.
                    try {
                      const key = `preview:${pageKey}`;
                      const existing = JSON.parse(
                        sessionStorage.getItem(key) || "{}",
                      ) as Record<string, any>;
                      existing[section.section_key] = { content };
                      sessionStorage.setItem(key, JSON.stringify(existing));
                    } catch {
                      // ignore storage errors — preview will just show saved version
                    }
                    const url =
                      pageKey === "home"
                        ? `/?preview=1`
                        : `/p/${pageKey}?preview=1`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  className="gap-1.5"
                  title="Abre uma aba com o rascunho atual sem salvar"
                >
                  <ExternalLink className="w-4 h-4" />
                  Pré-visualizar
                </Button>
                <Button onClick={handleSave} disabled={saving || !isDirty} className="gap-1.5">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-muted/30 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur px-4 py-2 border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pré-visualização ao vivo
              </div>
              <div className="p-4">
                <SectionLivePreview type={section.type} content={content} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface DuplicatePageDialogProps {
  open: boolean;
  onClose: () => void;
  sourceKey: string;
  existingKeys: string[];
  onConfirm: (newKey: string) => void;
}

const DuplicatePageDialog = ({
  open,
  onClose,
  sourceKey,
  existingKeys,
  onConfirm,
}: DuplicatePageDialogProps) => {
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    if (open) setNewKey("");
  }, [open]);

  const cleanPreview = newKey.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  const isInvalid = !cleanPreview || existingKeys.includes(cleanPreview);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Duplicar página
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Será criada uma nova página com todas as seções de{" "}
            <span className="font-semibold text-foreground">{sourceKey}</span>. Você poderá
            editá-las independentemente.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Slug da nova página
            </label>
            <Input
              autoFocus
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="ex: campanha-natal"
            />
            {newKey && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Slug:{" "}
                <code className="px-1 py-0.5 rounded bg-muted text-foreground">
                  {cleanPreview || "(inválido)"}
                </code>
                {existingKeys.includes(cleanPreview) && (
                  <span className="text-destructive ml-2">já existe</span>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => onConfirm(newKey)} disabled={isInvalid} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Criar página
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PagesContentTab;
