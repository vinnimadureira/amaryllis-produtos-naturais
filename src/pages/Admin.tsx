import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, LogOut, Plus, Pencil, Trash2, Star, Eye, EyeOff, Upload, X, Image as ImageIcon, MessageSquareQuote, Clock, Megaphone, Camera, FolderOpen, GripVertical, Users, Building2, Globe, Send, Search } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";
import TestimonialsTab from "@/components/admin/TestimonialsTab";
import CsvUploadDialog from "@/components/admin/CsvUploadDialog";
import ActivityLogsTab, { logActivity } from "@/components/admin/ActivityLogsTab";
import CampaignsTab from "@/components/admin/CampaignsTab";

import ClientsTab from "@/components/admin/ClientsTab";
import BusinessDataSettings from "@/components/admin/BusinessDataSettings";
import UserManagementTab from "@/components/admin/UserManagementTab";
import MarketingTab from "@/components/admin/MarketingTab";
import AgendaTab from "@/components/admin/AgendaTab";
import DashboardOverview from "@/components/admin/DashboardOverview";
import ReportsTab from "@/components/admin/ReportsTab";
import ShoppingListTab from "@/components/admin/ShoppingListTab";
import ConfirmDialog from "@/components/ConfirmDialog";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import ProductGalleryPreview from "@/components/admin/ProductGalleryPreview";
import PagesContentTab from "@/components/admin/PagesContentTab";
import OrdersTab from "@/components/admin/OrdersTab";
import HeroVideoSettings from "@/components/admin/HeroVideoSettings";
import HomeMediaTab from "@/components/admin/HomeMediaTab";
import SaboresMediaTab from "@/components/admin/SaboresMediaTab";
import SobreMediaTab from "@/components/admin/SobreMediaTab";
import ContatoMediaTab from "@/components/admin/ContatoMediaTab";

type Product = Tables<"products">;
const STORAGE_URL = "/api/storage/v1/object/public/product-images";

const USER_ALLOWED_TABS = new Set(["clientes", "agenda", "marketing", "compras"]);

const Admin = () => {
  const { signOut, isAdmin, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? "dashboard" : "clientes");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // If a non-admin lands on a restricted tab, redirect them to the first allowed one.
  useEffect(() => {
    if (!isAdmin && role === "user" && !USER_ALLOWED_TABS.has(activeTab)) {
      setActiveTab("clientes");
    }
  }, [isAdmin, role, activeTab]);

  // Permite que componentes-filhos disparem navegação entre abas via CustomEvent
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) setActiveTab(detail.tab);
    };
    window.addEventListener("admin-navigate", handler);
    return () => window.removeEventListener("admin-navigate", handler);
  }, []);

  // Habilita PWA (manifest + service worker) somente quando o admin está
  // autenticado. Ao deslogar / sair, o limpador em AppLayout remove tudo.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    import("@/lib/adminPwa").then(({ enableAdminPWA }) => {
      if (!cancelled) enableAdminPWA();
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Aplica a tipografia do admin (Inter) ao <body> para que portais Radix
  // (Dialogs, Popovers, Toasts) também herdem a fonte profissional.
  useEffect(() => {
    document.body.classList.add("admin-active");
    return () => {
      document.body.classList.remove("admin-active");
    };
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: isAdmin,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("product_images").delete().eq("product_id", id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Produto excluído" });
      logActivity("Excluiu produto", "product");
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  const hasPanelAccess = isAdmin || role === "user";

  if (!hasPanelAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Acesso não autorizado.</p>
          <Button onClick={() => navigate("/admin/login")} variant="outline">Fazer login</Button>
        </div>
      </div>
    );
  }

  const canAccessTab = (tabId: string) => isAdmin || USER_ALLOWED_TABS.has(tabId);

  return (
    <div className="admin-shell font-admin min-h-screen bg-secondary flex">
      {/* Sidebar - desktop */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        className="hidden md:flex"
      />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
            >
              <AdminSidebar
                activeTab={activeTab}
                onTabChange={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
                collapsed={false}
                onCollapsedChange={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
                isAdmin={isAdmin}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-h-screen",
        "md:ml-[240px]",
        sidebarCollapsed && "md:ml-16"
      )}>
        <AdminHeader activeTab={activeTab} onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "dashboard" && canAccessTab("dashboard") && <DashboardOverview onNavigate={setActiveTab} />}
              {activeTab === "clientes" && canAccessTab("clientes") && <ClientsTab />}
              {activeTab === "negocio" && canAccessTab("negocio") && <BusinessDataSettings />}
              {activeTab === "equipe" && canAccessTab("equipe") && <UserManagementTab />}
              {activeTab === "produtos" && canAccessTab("produtos") && <ProductsTab products={products} categories={categories} onDelete={(id) => deleteProduct.mutate(id)} />}
              {activeTab === "categorias" && canAccessTab("categorias") && <CategoriesTab />}
              {activeTab === "depoimentos" && canAccessTab("depoimentos") && <TestimonialsTab />}
              {activeTab === "campanhas" && canAccessTab("campanhas") && <CampaignsTab />}
              
              {activeTab === "paginas" && canAccessTab("paginas") && <PagesContentTab />}
              {activeTab === "logs" && canAccessTab("logs") && <ActivityLogsTab />}
              {activeTab === "marketing" && canAccessTab("marketing") && <MarketingTab />}
              {activeTab === "agenda" && canAccessTab("agenda") && <AgendaTab />}
              {activeTab === "relatorios" && canAccessTab("relatorios") && <ReportsTab />}
              {activeTab === "compras" && canAccessTab("compras") && <ShoppingListTab />}
              {activeTab === "pedidos" && canAccessTab("pedidos") && <OrdersTab />}
             {activeTab === "hero-video" && canAccessTab("hero-video") && <HeroVideoSettings />}
             {activeTab === "midias-home" && canAccessTab("midias-home") && <HomeMediaTab />}
             {activeTab === "midias-sabores" && canAccessTab("midias-sabores") && <SaboresMediaTab />}
             {activeTab === "midias-sobre" && canAccessTab("midias-sobre") && <SobreMediaTab />}
             {activeTab === "midias-contato" && canAccessTab("midias-contato") && <ContatoMediaTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminMobileNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
    </div>
  );
};

/* ========== Categories Tab ========== */
const CategoriesTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const addCategory = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newName.trim(), display_order: categories.length });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Categoria adicionada" });
      logActivity("Adicionou categoria", "category", undefined, newName);
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  };

  const updateCategory = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("categories").update({ name: editName.trim() }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Categoria atualizada" });
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Categoria excluída" });
      logActivity("Excluiu categoria", "category", id);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    await Promise.all(
      reordered.map((c, i) =>
        supabase.from("categories").update({ display_order: i }).eq("id", c.id)
      )
    );
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Categorias</h2>

      <div className="flex gap-2 mb-4">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nova categoria..."
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
        />
        <Button onClick={addCategory} size="sm" className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <div className="space-y-2" ref={provided.innerRef} {...provided.droppableProps}>
              {categories.map((c, idx) => (
                <Draggable key={c.id} draggableId={c.id} index={idx} isDragDisabled={editId === c.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-card rounded-lg p-3 flex items-center gap-3 shadow-sm transition-shadow ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}
                    >
                      {editId === c.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && updateCategory(c.id)} />
                          <Button size="sm" onClick={() => updateCategory(c.id)}>Salvar</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <>
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewing(c)}
                            className="flex-1 text-left text-foreground hover:text-primary transition-colors truncate"
                          >
                            {c.name}
                          </button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditId(c.id); setEditName(c.name); }} aria-label="Editar">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="text-destructive hover:text-destructive" aria-label="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {categories.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada.</p>}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Details dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Detalhes da Categoria</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div><strong>Nome:</strong> {viewing.name}</div>
              <div><strong>Ordem:</strong> {viewing.display_order}</div>
              <div><strong>Status:</strong> {viewing.active ? "Ativa" : "Inativa"}</div>
              <div className="text-xs text-muted-foreground">Criada em {new Date(viewing.created_at).toLocaleDateString("pt-BR")}</div>
              <Button
                onClick={() => { setEditId(viewing.id); setEditName(viewing.name); setViewing(null); }}
                className="w-full mt-2 gap-2"
              >
                <Pencil className="w-4 h-4" /> Alterar dados
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir categoria?"
        description="A categoria será removida permanentemente."
        onConfirm={() => { if (deleteId) deleteCategory(deleteId); setDeleteId(null); }}
      />
    </div>
  );
};

/* ========== Product Form Dialog ========== */
const ProductFormDialog = ({
  product,
  categories,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  product?: Product;
  categories: any[];
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(product?.image_url || null);
  const [extraImages, setExtraImages] = useState<{ id?: string; url: string }[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    price_display: product?.price_display || "",
    category: product?.category || (categories[0]?.name ?? ""),
    image_url: product?.image_url || "",
    featured: product?.featured || false,
    active: product?.active ?? true,
    allow_direct_purchase: (product as any)?.allow_direct_purchase ?? true,
    weight_grams: ((product as any)?.weight_grams ?? 300).toString(),
    height_cm: ((product as any)?.height_cm ?? 6).toString(),
    width_cm: ((product as any)?.width_cm ?? 11).toString(),
    length_cm: ((product as any)?.length_cm ?? 16).toString(),
  });

  const loadExtraImages = async () => {
    if (!product) return;
    setLoadingExtras(true);
    const { data } = await supabase.from("product_images").select("*").eq("product_id", product.id).order("display_order");
    if (data) setExtraImages(data.map((d) => ({ id: d.id, url: d.image_url })));
    setLoadingExtras(false);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o && product) loadExtraImages();
    if (o) {
      setForm({
        name: product?.name || "",
        description: product?.description || "",
        price: product?.price?.toString() || "",
        price_display: product?.price_display || "",
        category: product?.category || (categories[0]?.name ?? ""),
        image_url: product?.image_url || "",
        featured: product?.featured || false,
        active: product?.active ?? true,
        allow_direct_purchase: (product as any)?.allow_direct_purchase ?? true,
        weight_grams: ((product as any)?.weight_grams ?? 300).toString(),
        height_cm: ((product as any)?.height_cm ?? 6).toString(),
        width_cm: ((product as any)?.width_cm ?? 11).toString(),
        length_cm: ((product as any)?.length_cm ?? 16).toString(),
      });
      setPreview(product?.image_url || null);
      if (!product) setExtraImages([]);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem ou vídeo.", variant: "destructive" });
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 10MB.", variant: "destructive" });
      return null;
    }
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }
    return `${STORAGE_URL}/${fileName}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) {
      setForm((prev) => ({ ...prev, image_url: url }));
      setPreview(url);
    }
    setUploading(false);
  };

  const handleExtraImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) setExtraImages((prev) => [...prev, { url }]);
    }
    setUploading(false);
    if (extraFileInputRef.current) extraFileInputRef.current.value = "";
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image_url: "" }));
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExtraImage = async (index: number) => {
    const img = extraImages[index];
    if (img.id) {
      await supabase.from("product_images").delete().eq("id", img.id);
    }
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      price_display: form.price_display,
      category: form.category,
      image_url: form.image_url || null,
      featured: form.featured,
      active: form.active,
      allow_direct_purchase: form.allow_direct_purchase,
      weight_grams: Math.max(parseInt(form.weight_grams) || 1, 1),
      height_cm: Math.max(parseFloat(form.height_cm) || 2, 2),
      width_cm: Math.max(parseFloat(form.width_cm) || 11, 11),
      length_cm: Math.max(parseFloat(form.length_cm) || 16, 16),
    };

    let error;
    let productId = product?.id;
    if (product) {
      ({ error } = await supabase.from("products").update(payload).eq("id", product.id));
    } else {
      const result = await supabase.from("products").insert(payload).select("id").single();
      error = result.error;
      productId = result.data?.id;
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    if (productId) {
      const newImages = extraImages.filter((img) => !img.id);
      if (newImages.length > 0) {
        await supabase.from("product_images").insert(
          newImages.map((img, i) => ({
            product_id: productId!,
            image_url: img.url,
            display_order: (extraImages.length - newImages.length) + i,
          }))
        );
      }
    }

    toast({ title: product ? "Produto atualizado" : "Produto adicionado" });
    logActivity(product ? "Atualizou produto" : "Adicionou produto", "product", product?.id, form.name);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    setOpen(false);
  };

  // Auto-load extras when controlled open with a product
  useEffect(() => {
    if (open && product) {
      loadExtraImages();
      setForm({
        name: product?.name || "",
        description: product?.description || "",
        price: product?.price?.toString() || "",
        price_display: product?.price_display || "",
        category: product?.category || (categories[0]?.name ?? ""),
        image_url: product?.image_url || "",
        featured: product?.featured || false,
        active: product?.active ?? true,
        allow_direct_purchase: (product as any)?.allow_direct_purchase ?? true,
        weight_grams: ((product as any)?.weight_grams ?? 300).toString(),
        height_cm: ((product as any)?.height_cm ?? 6).toString(),
        width_cm: ((product as any)?.width_cm ?? 11).toString(),
        length_cm: ((product as any)?.length_cm ?? 16).toString(),
      });
      setPreview(product?.image_url || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Nome</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Descrição</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Preço (número)</label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Preço (exibição)</label>
              <Input value={form.price_display} onChange={(e) => setForm({ ...form, price_display: e.target.value })} placeholder="R$ 89,90" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Categoria</label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Peso e Dimensões (cálculo de frete) */}
          <div className="rounded-lg border border-border p-3 bg-secondary/30 space-y-3">
            <div>
              <p className="text-sm font-medium">Peso e dimensões da embalagem</p>
              <p className="text-xs text-muted-foreground">Usado para calcular o frete real via Melhor Envio.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Peso (g)</label>
                <Input type="number" min={1} step={1} value={form.weight_grams}
                  onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Altura (cm)</label>
                <Input type="number" min={2} step={0.1} value={form.height_cm}
                  onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Largura (cm)</label>
                <Input type="number" min={11} step={0.1} value={form.width_cm}
                  onChange={(e) => setForm({ ...form, width_cm: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Comprimento (cm)</label>
                <Input type="number" min={16} step={0.1} value={form.length_cm}
                  onChange={(e) => setForm({ ...form, length_cm: e.target.value })} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Mínimos PAC: 11×2×16 cm e 1g. Padrões: 300g · 16×11×6 cm.
            </p>
          </div>

          {/* Main Image Upload */}
          <div>
            <label className="text-sm font-medium block mb-2">Imagem Principal</label>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
            {preview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
                <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-foreground/70 text-background rounded-full p-1 hover:bg-foreground/90 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                {uploading ? <span className="text-sm">Enviando...</span> : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span className="text-sm">Clique para enviar uma imagem</span>
                    <span className="text-xs">PNG, JPG até 10MB</span>
                  </>
                )}
              </button>
            )}
            {preview && (
              <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5 w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <ImageIcon className="w-4 h-4" />
                {uploading ? "Enviando..." : "Trocar imagem"}
              </Button>
            )}
          </div>

          {/* Extra Images */}
          <div>
            <label className="text-sm font-medium block mb-2">Fotos Adicionais</label>
            <input ref={extraFileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleExtraImageUpload} className="hidden" />
            {extraImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {extraImages.map((img, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden border border-border aspect-square">
                    <img src={img.url} alt={`Extra ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExtraImage(i)} className="absolute top-1 right-1 bg-foreground/70 text-background rounded-full p-0.5 hover:bg-foreground/90 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => extraFileInputRef.current?.click()} disabled={uploading}>
              <Plus className="w-4 h-4" />
              {uploading ? "Enviando..." : "Adicionar fotos"}
            </Button>
          </div>

          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              <Star className="w-4 h-4 text-accent" /> Destaque
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              {form.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} Ativo
            </label>
          </div>
          <div className="rounded-lg border border-border p-3 bg-secondary/40">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.allow_direct_purchase}
                onChange={(e) => setForm({ ...form, allow_direct_purchase: e.target.checked })}
              />
              <div>
                <span className="font-medium">Permitir compra direta (Mercado Pago)</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Desmarque para produtos sob orçamento (ex: combos personalizados, eventos grandes). O cliente
                  só verá o botão "Orçar pelo WhatsApp".
                </p>
              </div>
            </label>
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-rose-dark">
            {product ? "Salvar Alterações" : "Adicionar Produto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ========== Products Tab ========== */
const PRODUCTS_PAGE_SIZE = 12;

const ProductsTab = ({ products, categories, onDelete }: { products: Product[]; categories: any[]; onDelete: (id: string) => void }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "price_asc" | "price_desc">("recent");
  const [viewing, setViewing] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [products, search, catFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PAGE_SIZE);
  const pageProducts = filtered.slice((page - 1) * PRODUCTS_PAGE_SIZE, page * PRODUCTS_PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">Produtos</h2>
        <div className="flex gap-2">
          <CsvUploadDialog />
          <ProductFormDialog categories={categories} trigger={<Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Novo Produto</Button>} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="flex items-center bg-card border border-border rounded-lg px-3 py-2 gap-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none shrink-0"
        >
          <option value="all">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none shrink-0"
        >
          <option value="recent">Mais recentes</option>
          <option value="name">Nome A-Z</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground mb-4">{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</p>
      <div className="space-y-3">
        {pageProducts.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => setViewing(p)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewing(p); } }}
            className="bg-card rounded-lg p-4 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md hover:bg-accent/5 transition-all"
          >
            {p.image_url && (
              <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">{p.name}</h3>
                {p.featured && <Star className="w-3.5 h-3.5 text-accent fill-accent" />}
                {!p.active && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Inativo</span>}
              </div>
              <p className="text-sm text-muted-foreground">{p.category} · {p.price_display}</p>
            </div>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label="Editar">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="text-destructive hover:text-destructive" aria-label="Excluir">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado.</p>
        )}
      </div>
      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Details dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Detalhes do Produto</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              {viewing.image_url && (
                <img src={viewing.image_url} alt={viewing.name} className="w-full h-48 object-cover rounded-lg" />
              )}
              <div><strong>Nome:</strong> {viewing.name}</div>
              <div><strong>Categoria:</strong> {viewing.category}</div>
              <div><strong>Preço:</strong> {viewing.price_display} <span className="text-muted-foreground">({viewing.price})</span></div>
              {viewing.description && (
                <div>
                  <strong className="block mb-1">Descrição:</strong>
                  <p className="text-muted-foreground whitespace-pre-wrap">{viewing.description}</p>
                </div>
              )}
              <div className="flex gap-3 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-full bg-muted">{viewing.active ? "Ativo" : "Inativo"}</span>
                {viewing.featured && <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">Destaque</span>}
              </div>
              <ProductGalleryPreview productId={viewing.id} mainImageUrl={viewing.image_url} />
              <Button
                onClick={() => { const p = viewing; setViewing(null); setEditing(p); }}
                className="w-full mt-2 gap-2"
              >
                <Pencil className="w-4 h-4" /> Alterar dados
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editing && (
        <ProductFormDialog
          key={editing.id}
          product={editing}
          categories={categories}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir produto?"
        description="O produto será removido permanentemente do catálogo."
        onConfirm={() => { if (deleteId) onDelete(deleteId); setDeleteId(null); }}
      />
    </div>
  );
};

export default Admin;
