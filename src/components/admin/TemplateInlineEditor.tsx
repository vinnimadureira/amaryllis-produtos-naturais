import { useState } from "react";
import { Pencil, X, Check, Trash2, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Template {
  id: string;
  name: string;
  template: string;
  sort_order: number;
  active: boolean;
}

interface Props {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export default function TemplateInlineEditor({ templates, selectedTemplateId, onSelect, loading }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", template: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function startEdit(tpl: Template) {
    setCreating(false);
    setEditingId(tpl.id);
    setForm({ name: tpl.name, template: tpl.template });
  }

  function startCreate() {
    setEditingId(null);
    setCreating(true);
    setForm({ name: "", template: "" });
  }

  function cancel() {
    setEditingId(null);
    setCreating(false);
  }

  async function save() {
    if (!form.name.trim() || !form.template.trim()) {
      toast({ title: "Preencha nome e mensagem", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("message_templates")
          .update({ name: form.name, template: form.template })
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Modelo atualizado" });
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert({ name: form.name, template: form.template, sort_order: templates.length + 1 });
        if (error) throw error;
        toast({ title: "Modelo criado" });
      }
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      cancel();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("message_templates").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Modelo excluído" });
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      if (editingId === deleteId) cancel();
    }
    setDeleteId(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {templates.map((tpl) => (
          <div key={tpl.id}>
            {editingId === tpl.id ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg border border-primary bg-primary/5 space-y-2"
              >
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome do modelo"
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground"
                />
                <textarea
                  value={form.template}
                  onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
                  placeholder="Mensagem... use {nome} para personalizar"
                  rows={3}
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground resize-none"
                />
                <div className="flex items-center justify-between">
                  <button onClick={() => setDeleteId(tpl.id)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1">
                    <button onClick={cancel} className="p-1.5 rounded hover:bg-muted transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={save} disabled={saving} className="p-1.5 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                whileTap={{ scale: 0.97 }}
                className={`relative group text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedTemplateId === tpl.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => onSelect(tpl.id)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(tpl); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📩</span>
                  <span className="text-sm font-semibold text-foreground">{tpl.name}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{tpl.template.replace("{nome}", "Cliente")}</p>
              </motion.div>
            )}
          </div>
        ))}

        {/* New template button / form */}
        {creating ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-lg border border-primary bg-primary/5 space-y-2"
          >
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome do modelo"
              className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground"
            />
            <textarea
              value={form.template}
              onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
              placeholder="Mensagem... use {nome} para personalizar"
              rows={3}
              className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground resize-none"
            />
            <div className="flex justify-end gap-1">
              <button onClick={cancel} className="p-1.5 rounded hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={save} disabled={saving} className="p-1.5 rounded bg-primary text-primary-foreground hover:brightness-110 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={startCreate}
            className="p-3 rounded-lg border border-dashed border-border hover:border-primary/50 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary min-h-[80px]"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Novo Modelo</span>
          </motion.button>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir modelo?"
        description="Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
      />
    </>
  );
}
