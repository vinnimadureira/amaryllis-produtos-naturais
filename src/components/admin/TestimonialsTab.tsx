import { useState } from "react";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  active: boolean;
  display_order: number;
  created_at: string;
}

const TestimonialFormDialog = ({
  testimonial,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  testimonial?: Testimonial;
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
    name: testimonial?.name || "",
    text: testimonial?.text || "",
    rating: testimonial?.rating ?? 5,
    active: testimonial?.active ?? true,
    display_order: testimonial?.display_order ?? 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      text: form.text.trim(),
      rating: Math.min(5, Math.max(1, form.rating)),
      active: form.active,
      display_order: form.display_order,
    };

    let error;
    if (testimonial) {
      ({ error } = await supabase.from("testimonials").update(payload).eq("id", testimonial.id));
    } else {
      ({ error } = await supabase.from("testimonials").insert(payload));
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: testimonial ? "Depoimento atualizado" : "Depoimento adicionado" });
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {testimonial ? "Editar Depoimento" : "Novo Depoimento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Nome do Cliente</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Depoimento</label>
            <Textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              required
              rows={4}
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Nota (1-5)</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Ordem</label>
              <Input
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            {form.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Ativo (visível no site)
          </label>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-rose-dark">
            {testimonial ? "Salvar Alterações" : "Adicionar Depoimento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TestimonialsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Testimonial | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);

  const { data: testimonials = [] } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Depoimento excluído" });
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">Depoimentos</h2>
        <TestimonialFormDialog
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Novo Depoimento
            </Button>
          }
        />
      </div>
      <div className="space-y-3">
        {testimonials.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => setViewing(t)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewing(t); } }}
            className="bg-card rounded-lg p-4 flex items-start gap-4 shadow-sm cursor-pointer hover:shadow-md hover:bg-accent/5 transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground">{t.name}</h3>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < t.rating ? "text-accent fill-accent" : "text-border"}`}
                    />
                  ))}
                </div>
                {!t.active && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Inativo
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground italic line-clamp-2">"{t.text}"</p>
            </div>
            <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" onClick={() => setEditing(t)} aria-label="Editar">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(t.id)}
                className="text-destructive hover:text-destructive"
                aria-label="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum depoimento cadastrado.</p>
        )}
      </div>

      {/* Details dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Detalhes do Depoimento</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div><strong>Cliente:</strong> {viewing.name}</div>
              <div className="flex items-center gap-2">
                <strong>Nota:</strong>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < viewing.rating ? "text-accent fill-accent" : "text-border"}`} />
                  ))}
                </div>
              </div>
              <div><strong>Ordem:</strong> {viewing.display_order}</div>
              <div><strong>Status:</strong> {viewing.active ? "Ativo (visível)" : "Inativo"}</div>
              <div>
                <strong className="block mb-1">Depoimento:</strong>
                <p className="italic text-muted-foreground bg-muted/40 rounded-md p-3">"{viewing.text}"</p>
              </div>
              <Button
                onClick={() => { const t = viewing; setViewing(null); setEditing(t); }}
                className="w-full mt-2 gap-2"
              >
                <Pencil className="w-4 h-4" /> Alterar dados
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog (controlled) */}
      {editing && (
        <TestimonialFormDialog
          key={editing.id}
          testimonial={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir depoimento?"
        description="O depoimento será removido permanentemente."
        onConfirm={() => { if (deleteId) deleteTestimonial.mutate(deleteId); setDeleteId(null); }}
      />
    </div>
  );
};

export default TestimonialsTab;
