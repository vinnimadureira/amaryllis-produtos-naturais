import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, X, Pencil, GripVertical, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "./ActivityLogsTab";
import ConfirmDialog from "@/components/ConfirmDialog";
import AdminPagination from "@/components/admin/AdminPagination";
import GalleryFiltersManager from "@/components/admin/GalleryFiltersManager";
import galleryClientes from "@/assets/gallery-clientes.jpg";
import galleryProjetos from "@/assets/gallery-projetos.jpg";
import galleryEmbalagens from "@/assets/gallery-embalagens.jpg";
import galleryMomentos from "@/assets/gallery-momentos.jpg";
import galleryMassa from "@/assets/gallery-massa.jpg";
import galleryRecheado from "@/assets/gallery-recheado.jpg";
import galleryKit from "@/assets/gallery-kit.jpg";
import galleryCombos from "@/assets/gallery-combos.jpg";

const STORAGE_URL = "/api/storage/v1/object/public/product-images";

const staticImages = [
  { src: galleryClientes, label: "Cliente recebendo o pedido", category: "Clientes" },
  { src: galleryProjetos, label: "Sabores prontos pra entrega", category: "Projetos Entregues" },
  { src: galleryEmbalagens, label: "Embalagem térmica Império Cones", category: "Embalagens" },
  { src: galleryMomentos, label: "Bastidores da cozinha", category: "Momentos" },
  { src: galleryMassa, label: "Massa artesanal fresca", category: "Cones" },
  { src: galleryRecheado, label: "Cone recheado na hora", category: "Massas" },
  { src: galleryKit, label: "Kit completo Império Cones", category: "Kits" },
  { src: galleryCombos, label: "Combos pra todas as ocasiões", category: "Combos" },
];


interface GalleryPhoto {
  id: string;
  label: string;
  image_url: string;
  display_order: number;
  active: boolean;
  category: string | null;
  created_at: string;
}

const AddPhotoDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", image_url: "", display_order: "0", category: "" });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["gallery-combo-categories"],
    queryFn: async () => {
      const [cats, filters] = await Promise.all([
        supabase.from("categories").select("name").eq("active", true),
        supabase.from("gallery_filters").select("name").eq("active", true),
      ]);
      if (cats.error) throw cats.error;
      if (filters.error) throw filters.error;
      const names = [
        ...(filters.data || []).map((f) => f.name),
        ...(cats.data || []).map((c) => c.name),
      ];
      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem ou vídeo.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 20MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `gallery/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const url = `${STORAGE_URL}/${fileName}`;
    setForm((prev) => ({ ...prev, image_url: url }));
    setPreview(url);
    setUploading(false);
    toast({ title: "Arquivo enviado!" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) {
      toast({ title: "Envie uma imagem primeiro", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("gallery_photos").insert({
      label: form.label,
      image_url: form.image_url,
      display_order: parseInt(form.display_order) || 0,
      category: form.category || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Foto adicionada à galeria" });
      logActivity("Adicionou foto à galeria", "gallery");
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      setOpen(false);
      setForm({ label: "", image_url: "", display_order: "0", category: "" });
      setPreview(null);
    }
  };

  const isVideo = preview && /\.(mp4|webm|mov|avi)$/i.test(preview);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Adicionar Foto/Vídeo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Legenda</label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required placeholder="Ex: Caixa Surpresa" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Categoria</label>
            <Select value={form.category || "none"} onValueChange={(v) => setForm({ ...form, category: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {dbCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Ordem de exibição</label>
            <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Imagem ou Vídeo</label>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
            {preview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                {isVideo ? (
                  <video src={preview} className="w-full h-40 object-cover" muted />
                ) : (
                  <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => { setPreview(null); setForm((p) => ({ ...p, image_url: "" })); }}
                  className="absolute top-2 right-2 bg-foreground/70 text-background rounded-full p-1 hover:bg-foreground/90 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {uploading ? (
                  <span className="text-sm">Enviando...</span>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span className="text-sm">Clique para enviar</span>
                    <span className="text-xs">Imagem ou vídeo até 20MB</span>
                  </>
                )}
              </button>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={!form.image_url}>
            Adicionar à Galeria
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

const GALLERY_PAGE_SIZE = 12;

const GalleryTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: "", display_order: "", category: "" });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [seedingStatic, setSeedingStatic] = useState(false);
  const [deletePhoto, setDeletePhoto] = useState<GalleryPhoto | null>(null);
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<string>("Todas");

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as GalleryPhoto[];
    },
  });

  const seedStaticPhotos = async () => {
    setSeedingStatic(true);
    for (let i = 0; i < staticImages.length; i++) {
      const img = staticImages[i];
      await supabase.from("gallery_photos").insert({
        label: img.label,
        image_url: img.src,
        display_order: i,
        category: img.category,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
    toast({ title: "Fotos do site carregadas na galeria" });
    setSeedingStatic(false);
  };

  useEffect(() => {
    if (!isLoading && photos.length === 0) {
      seedStaticPhotos();
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const deletePhotoMutation = useMutation({
    mutationFn: async (photo: GalleryPhoto) => {
      const path = photo.image_url.split("/product-images/")[1];
      if (path) await supabase.storage.from("product-images").remove([path]);
      const { error } = await supabase.from("gallery_photos").delete().eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast({ title: "Foto excluída da galeria" });
      logActivity("Excluiu foto da galeria", "gallery");
    },
  });

  const updatePhoto = useMutation({
    mutationFn: async ({ id, label, display_order, category }: { id: string; label: string; display_order: number; category: string | null }) => {
      const { error } = await supabase.from("gallery_photos").update({ label, display_order, category }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast({ title: "Foto atualizada" });
      setEditingId(null);
    },
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["gallery-combo-categories"],
    queryFn: async () => {
      const [cats, filters] = await Promise.all([
        supabase.from("categories").select("name").eq("active", true),
        supabase.from("gallery_filters").select("name").eq("active", true),
      ]);
      if (cats.error) throw cats.error;
      if (filters.error) throw filters.error;
      const names = [
        ...(filters.data || []).map((f) => f.name),
        ...(cats.data || []).map((c) => c.name),
      ];
      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
    },
  });

  const reorderPhotos = useMutation({
    mutationFn: async (reordered: { id: string; display_order: number }[]) => {
      for (const item of reordered) {
        await supabase.from("gallery_photos").update({ display_order: item.display_order }).eq("id", item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
    },
  });

  const startEdit = (photo: GalleryPhoto) => {
    setEditingId(photo.id);
    setEditForm({ label: photo.label, display_order: photo.display_order.toString(), category: photo.category || "" });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updatePhoto.mutate({
      id: editingId,
      label: editForm.label,
      display_order: parseInt(editForm.display_order) || 0,
      category: editForm.category || null,
    });
  };

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = useCallback((targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); return; }
    const newPhotos = [...photos];
    const fromIdx = newPhotos.findIndex((p) => p.id === draggedId);
    const toIdx = newPhotos.findIndex((p) => p.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDraggedId(null); return; }
    const [moved] = newPhotos.splice(fromIdx, 1);
    newPhotos.splice(toIdx, 0, moved);
    const reordered = newPhotos.map((p, i) => ({ id: p.id, display_order: i }));
    reorderPhotos.mutate(reordered);
    setDraggedId(null);
  }, [draggedId, photos, reorderPhotos]);

  // Filtros gerenciáveis via admin (tabela gallery_filters)
  const { data: managedFilters = [] } = useQuery({
    queryKey: ["gallery-filters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_filters")
        .select("name, active, display_order")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return (data || []).map((f) => f.name);
    },
  });

  const allFilterCategories = useMemo(() => {
    const fromPhotos = photos.map((p) => p.category).filter((c): c is string => !!c);
    const merged = Array.from(new Set([...managedFilters, ...dbCategories, ...fromPhotos]));
    return merged;
  }, [photos, dbCategories, managedFilters]);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = { Todas: photos.length, "Sem categoria": 0 };
    for (const cat of allFilterCategories) map[cat] = 0;
    for (const p of photos) {
      if (!p.category) map["Sem categoria"] += 1;
      else map[p.category] = (map[p.category] || 0) + 1;
    }
    return map;
  }, [photos, allFilterCategories]);

  const filteredPhotos = useMemo(() => {
    if (filterCategory === "Todas") return photos;
    if (filterCategory === "Sem categoria") return photos.filter((p) => !p.category);
    return photos.filter((p) => p.category === filterCategory);
  }, [photos, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredPhotos.length / GALLERY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagePhotos = filteredPhotos.slice((currentPage - 1) * GALLERY_PAGE_SIZE, currentPage * GALLERY_PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">Galeria de Fotos e Vídeos</h2>
        <AddPhotoDialog trigger={<Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Adicionar</Button>} />
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {photos.length} ite{photos.length !== 1 ? "ns" : "m"} no total · Arraste para reordenar. Clique no lápis para editar legenda, categoria e ordem.
      </p>

      <GalleryFiltersManager />

      {/* Filtro por categoria com contadores */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
          {(["Todas", "Sem categoria", ...allFilterCategories] as string[]).map((cat) => {
            const count = countByCategory[cat] ?? 0;
            const isActive = filterCategory === cat;
            const isEmpty = count === 0 && cat !== "Todas";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setFilterCategory(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : isEmpty
                      ? "bg-muted/40 text-muted-foreground/60 border-border hover:bg-muted"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                }`}
              >
                {cat}
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-primary-foreground/20" : "bg-foreground/10"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhuma foto na galeria.</p>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <ImageIcon className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Nenhuma foto na categoria <strong>{filterCategory}</strong>.</p>
          <AddPhotoDialog trigger={<Button size="sm" variant="outline" className="gap-1.5"><Plus className="w-4 h-4" /> Adicionar foto nesta categoria</Button>} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pagePhotos.map((photo) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(photo.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(photo.id)}
                className={`relative group rounded-lg overflow-hidden border bg-card shadow-sm transition-all ${
                  draggedId === photo.id ? "opacity-50 border-primary" : "border-border"
                }`}
              >
                <div className="absolute top-2 left-2 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-5 h-5 text-primary-foreground drop-shadow-lg" />
                </div>
                {isVideoUrl(photo.image_url) ? (
                  <video src={photo.image_url} className="w-full h-40 object-cover" muted />
                ) : (
                  <img src={photo.image_url} alt={photo.label} className="w-full h-40 object-cover" />
                )}
                {editingId === photo.id ? (
                  <div className="p-3 space-y-2">
                    <Input
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      placeholder="Legenda"
                      className="text-sm h-8"
                    />
                    <Select
                      value={editForm.category || "none"}
                      onValueChange={(v) => setEditForm({ ...editForm, category: v === "none" ? "" : v })}
                    >
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {dbCategories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={editForm.display_order}
                        onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value })}
                        placeholder="Ordem"
                        className="text-sm h-8 w-20"
                      />
                      <Button size="sm" className="h-8 gap-1" onClick={saveEdit}>
                        <Check className="w-3 h-3" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">{photo.label}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Ordem: {photo.display_order}</p>
                      {photo.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 truncate">
                          {photo.category}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => startEdit(photo)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeletePhoto(photo)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <AdminPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!deletePhoto}
        onOpenChange={(open) => !open && setDeletePhoto(null)}
        title="Excluir da galeria?"
        description="Este item será removido permanentemente da galeria."
        onConfirm={() => { if (deletePhoto) deletePhotoMutation.mutate(deletePhoto); setDeletePhoto(null); }}
      />
    </div>
  );
};

export default GalleryTab;
