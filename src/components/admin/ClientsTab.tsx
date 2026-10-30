import { useState, useMemo } from "react";
import { Plus, Search, Phone, Edit2, User, Loader2, Trash2, Gift, Calendar, Trophy, Star, Cake } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/ConfirmDialog";
import { logActivity } from "@/components/admin/ActivityLogsTab";
import AdminPagination from "@/components/admin/AdminPagination";
import ClientHistoryPanel from "@/components/admin/ClientHistoryPanel";
import AddressFields, { emptyAddress, buildAddressString, type AddressValue } from "@/components/admin/AddressFields";
import ClientReadFields from "@/components/admin/ClientReadFields";
import ClientDetailDialog from "@/components/admin/ClientDetailDialog";
import ClientEditFields from "@/components/admin/ClientEditFields";
import DuplicateClientsCard from "@/components/admin/DuplicateClientsCard";

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}


// Aniversário: form guarda ISO (YYYY-MM-DD) quando válido; senão a string parcial em BR.
function birthdayToBR(iso: string): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  return iso;
}
function maskBirthdayInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  let br = digits;
  if (digits.length > 4) br = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  else if (digits.length > 2) br = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length === 8) {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    const dn = Number(d), mn = Number(m), yn = Number(y);
    if (mn >= 1 && mn <= 12 && dn >= 1 && dn <= 31 && yn >= 1900 && yn <= 2100) {
      return `${y}-${m}-${d}`;
    }
  }
  return br;
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: emptyAddress as AddressValue,
  notes: "",
  birthday: "",
  is_vip: false,
};

const PAGE_SIZE = 12;

const ClientsTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [topBuyers, setTopBuyers] = useState(false);
  const [onlyVip, setOnlyVip] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [viewingClient, setViewingClient] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: statsByClient = {} } = useQuery({
    queryKey: ["admin-clients-totals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_purchases")
        .select("client_id, amount");
      if (error) throw error;
      const map: Record<string, { total: number; count: number }> = {};
      (data || []).forEach((p: any) => {
        const cur = map[p.client_id] || { total: 0, count: 0 };
        cur.total += Number(p.amount) || 0;
        cur.count += 1;
        map[p.client_id] = cur;
      });
      return map;
    },
  });

  const totalsByClient = useMemo(() => {
    const m: Record<string, number> = {};
    Object.entries(statsByClient).forEach(([k, v]) => { m[k] = (v as any).total; });
    return m;
  }, [statsByClient]);

  const isVip = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if ((client as any)?.is_vip) return true;
    const s = (statsByClient as any)[clientId];
    if (!s) return false;
    return s.count >= 3 || s.total > 300;
  };

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filtered = useMemo(() => {
    let list = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || "").includes(searchQuery)
    );
    if (onlyVip) {
      list = list.filter((c) => isVip(c.id));
    }
    if (topBuyers) {
      return [...list].sort(
        (a, b) => (totalsByClient[b.id] || 0) - (totalsByClient[a.id] || 0)
      );
    }
    return list;
  }, [clients, searchQuery, topBuyers, onlyVip, totalsByClient, statsByClient]);

  const vipCount = useMemo(
    () => clients.filter((c) => isVip(c.id)).length,
    [clients, statsByClient]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageClients = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast({ title: "Cliente excluído" });
      logActivity("Excluiu cliente", "client");
    },
    onError: (e: any) => {
      const msg = String(e?.message || "");
      const friendly = msg.includes("Não é possível excluir")
        ? msg
        : "Não é possível excluir este cliente: existem agendas, compras ou pedidos vinculados. Exclua os pedidos e a agenda primeiro.";
      toast({ title: "Exclusão bloqueada", description: friendly, variant: "destructive" });
    },
  });

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(client: any) {
    setForm({
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
      address: {
        cep: client.cep || "",
        street: client.street || "",
        number: client.number || "",
        neighborhood: client.neighborhood || "",
        complement: client.complement || "",
        city: client.city || "",
        state: client.state || "",
      },
      notes: client.notes || "",
      birthday: client.birthday || "",
      is_vip: !!client.is_vip,
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const addr = form.address;
      const consolidated = buildAddressString(addr);
      const payload = {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        address: consolidated || null,
        cep: addr.cep || null,
        street: addr.street || null,
        number: addr.number || null,
        neighborhood: addr.neighborhood || null,
        complement: addr.complement || null,
        city: addr.city || null,
        state: addr.state || null,
        notes: form.notes || null,
        birthday: /^\d{4}-\d{2}-\d{2}$/.test(form.birthday) ? form.birthday : null,
        is_vip: form.is_vip,
      };

      if (editingId) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Cliente atualizado!" });
        logActivity("Atualizou cliente", "client", editingId, form.name);
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
        toast({ title: "Cliente cadastrado!" });
        logActivity("Cadastrou cliente", "client", undefined, form.name);
      }

      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      // Reflete a alteração em qualquer painel de pedido/agenda aberto
      queryClient.invalidateQueries({ queryKey: ["event-detail-client"] });
      queryClient.invalidateQueries({ queryKey: ["event-detail"] });
      queryClient.invalidateQueries({ queryKey: ["agenda-events"] });
      queryClient.invalidateQueries({ queryKey: ["client-history"] });
      setShowForm(false);
      setEditingId(null);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <DuplicateClientsCard />
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex items-center bg-card border border-border rounded-lg px-3 py-2 gap-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <Button
          type="button"
          variant={onlyVip ? "default" : "outline"}
          size="sm"
          onClick={() => { setOnlyVip((v) => !v); setPage(1); }}
          className={`gap-1.5 shrink-0 ${onlyVip ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white border-0" : ""}`}
          title="Mostrar apenas clientes VIP (3+ compras ou ticket > R$ 300)"
        >
          <Star className={`w-4 h-4 ${onlyVip ? "fill-white" : ""}`} /> VIP
          {vipCount > 0 && (
            <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
              onlyVip ? "bg-white/25 text-white" : "bg-amber-500/15 text-amber-700"
            }`}>
              {vipCount}
            </span>
          )}
        </Button>
        <Button
          type="button"
          variant={topBuyers ? "default" : "outline"}
          size="sm"
          onClick={() => { setTopBuyers((v) => !v); setPage(1); }}
          className="gap-1.5 shrink-0"
          title="Ordenar por valor total gasto"
        >
          <Trophy className="w-4 h-4" /> Top compradores
        </Button>
        <Button onClick={openNew} size="sm" className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
        {onlyVip && " · apenas VIP"}
        {topBuyers && " · ordenados por total gasto"}
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {pageClients.map((client, idx) => {
            const rank = topBuyers ? (page - 1) * PAGE_SIZE + idx + 1 : null;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            return (
            <div
              key={client.id}
              role="button"
              tabIndex={0}
              onClick={() => setViewingClient(client)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewingClient(client); } }}
              className="bg-card rounded-lg p-4 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md hover:bg-accent/5 transition-all"
            >
              {topBuyers ? (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-base font-bold text-primary">
                  {medal || `#${rank}`}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground truncate">{client.name}</h3>
                  {isVip(client.id) && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm flex items-center gap-1"
                      title="Cliente VIP — 3+ compras ou ticket total acima de R$ 300"
                    >
                      <Star className="w-2.5 h-2.5 fill-white" /> VIP
                    </span>
                  )}
                  {(totalsByClient[client.id] || 0) > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {formatBRL(totalsByClient[client.id])}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                  {client.birthday && (() => {
                    const bd = new Date(client.birthday + "T12:00:00");
                    const today = new Date();
                    const isBdayToday = bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth();
                    return (
                      <span className={`flex items-center gap-1 ${isBdayToday ? "text-pink-500 font-semibold" : ""}`}>
                        {isBdayToday ? <Cake className="w-3.5 h-3.5" /> : <Calendar className="w-3 h-3" />}
                        {bd.toLocaleDateString("pt-BR")}
                        {isBdayToday && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-500 border border-pink-500/30">Hoje!</span>}
                      </span>
                    );
                  })()}
                  {client.last_purchase_date && (
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      Última compra: {new Date(client.last_purchase_date).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={() => openEdit(client)} aria-label="Editar">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(client.id)} className="text-destructive hover:text-destructive" aria-label="Excluir">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            );
          })}
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog — usa o mesmo layout/estrutura de campos do detalhe (ClientEditFields) */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ClientEditFields
              value={{
                name: form.name,
                phone: form.phone,
                email: form.email,
                birthday: form.birthday,
                notes: form.notes,
                address: form.address,
              }}
              onChange={(v) => setForm((f) => ({
                ...f,
                name: v.name,
                phone: v.phone,
                email: v.email,
                birthday: v.birthday,
                notes: v.notes,
                address: v.address,
              }))}
              showName
              showNotes
            />

            <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Cliente VIP</p>
                  <p className="text-[11px] text-muted-foreground">Marcar manualmente como VIP (independente das regras automáticas)</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_vip}
                onClick={() => setForm((f) => ({ ...f, is_vip: !f.is_vip }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.is_vip ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    form.is_vip ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? "Salvar Alterações" : "Cadastrar Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog (componente compartilhado) */}
      <ClientDetailDialog
        client={viewingClient}
        open={!!viewingClient}
        onOpenChange={(o) => !o && setViewingClient(null)}
        isVip={viewingClient ? isVip(viewingClient.id) : false}
        onEdit={(c) => { setViewingClient(null); openEdit(c); }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir cliente?"
        description="O cliente será removido permanentemente."
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
      />
    </div>
  );
};

export default ClientsTab;
