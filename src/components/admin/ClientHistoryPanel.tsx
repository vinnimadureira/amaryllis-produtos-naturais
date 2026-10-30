import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, ShoppingBag, MessageCircle, Loader2, Calendar, Sparkles,
  Eye, CreditCard, FileText, Tag, User as UserIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import EventDetailDialog from "./EventDetailDialog";
import OrderItemsBreakdown from "./OrderItemsBreakdown";
import { parseProductsField } from "./parseProductsField";

const channelOptions = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "presencial", label: "Presencial" },
];

const channelLabel = (v: string) => channelOptions.find((c) => c.value === v)?.label || v;

const formatBRL = (n: number | null | undefined) =>
  n != null
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

// Detecta entradas geradas automaticamente pela agenda ([evento:<id>])
const AUTO_TAG_RE = /^\s*\[evento:([0-9a-f-]+)\]\s*/i;
// Detecta compras geradas a partir de pedidos do site ("Pedido #XXXXXXXX")
const SITE_ORDER_RE = /Pedido\s+#([0-9A-Fa-f]{8})/;
const isAutoEntry = (text: string | null | undefined) => !!text && AUTO_TAG_RE.test(text);
const stripAutoTag = (text: string | null | undefined) =>
  text ? text.replace(AUTO_TAG_RE, "").trim() : "";
const extractEventId = (text: string | null | undefined): string | null => {
  if (!text) return null;
  const m = text.match(AUTO_TAG_RE);
  return m ? m[1] : null;
};
const extractSiteOrderShortId = (product: string | null | undefined): string | null => {
  if (!product) return null;
  const m = product.match(SITE_ORDER_RE);
  return m ? m[1].toLowerCase() : null;
};

interface Props {
  clientId: string;
}

interface ReadFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

const ReadField = ({ label, icon, value, className }: ReadFieldProps) => {
  const isEmpty =
    value === null || value === undefined || value === "" || value === "—";
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </Label>
      <div className="min-h-10 w-full rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground break-words whitespace-pre-wrap">
        {isEmpty ? <span className="text-muted-foreground italic">—</span> : value}
      </div>
    </div>
  );
};

const ClientHistoryPanel = ({ clientId }: Props) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [purchase, setPurchase] = useState({ purchase_date: new Date().toISOString().slice(0, 10), product: "", amount: "", notes: "" });
  const [message, setMessage] = useState({ channel: "whatsapp", summary: "" });
  const [viewingPurchase, setViewingPurchase] = useState<any | null>(null);
  const [viewingMessage, setViewingMessage] = useState<any | null>(null);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);

  const { data: purchases = [], isLoading: loadingP } = useQuery({
    queryKey: ["client-purchases", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_purchases")
        .select("*")
        .eq("client_id", clientId)
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: messages = [], isLoading: loadingM } = useQuery({
    queryKey: ["client-messages", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_messages")
        .select("*")
        .eq("client_id", clientId)
        .order("message_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalSpent = purchases.reduce((s, p: any) => s + (Number(p.amount) || 0), 0);

  const addPurchase = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("client_purchases").insert({
        client_id: clientId,
        purchase_date: purchase.purchase_date,
        product: purchase.product.trim(),
        amount: purchase.amount ? parseFloat(purchase.amount) : null,
        notes: purchase.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-purchases", clientId] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-clients-totals"] });
      toast({ title: "Compra registrada" });
      setPurchase({ purchase_date: new Date().toISOString().slice(0, 10), product: "", amount: "", notes: "" });
      setShowPurchaseForm(false);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deletePurchase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_purchases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-purchases", clientId] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-clients-totals"] });
      toast({ title: "Compra removida" });
    },
  });

  const addMessage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("client_messages").insert({
        client_id: clientId,
        channel: message.channel,
        summary: message.summary.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-messages", clientId] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast({ title: "Mensagem registrada" });
      setMessage({ channel: "whatsapp", summary: "" });
      setShowMessageForm(false);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-messages", clientId] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast({ title: "Mensagem removida" });
    },
  });

  return (
    <div className="space-y-5">
      {/* PURCHASES */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            Histórico de compras
            <span className="text-xs text-muted-foreground font-normal">
              ({purchases.length}{purchases.length > 0 && ` · ${formatBRL(totalSpent)}`})
            </span>
          </h4>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowPurchaseForm((v) => !v)}>
            <Plus className="w-3 h-3" /> {showPurchaseForm ? "Cancelar" : "Adicionar"}
          </Button>
        </div>

        {showPurchaseForm && (
          <div className="bg-muted/40 rounded-lg p-3 space-y-2 mb-2">
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={purchase.purchase_date} onChange={(e) => setPurchase((p) => ({ ...p, purchase_date: e.target.value }))} className="h-8 text-xs" />
              <Input placeholder="Valor (R$)" type="number" step="0.01" value={purchase.amount} onChange={(e) => setPurchase((p) => ({ ...p, amount: e.target.value }))} className="h-8 text-xs" />
            </div>
            <Input placeholder="Produto / descrição" value={purchase.product} onChange={(e) => setPurchase((p) => ({ ...p, product: e.target.value }))} className="h-8 text-xs" />
            <Textarea placeholder="Observações (opcional)" value={purchase.notes} onChange={(e) => setPurchase((p) => ({ ...p, notes: e.target.value }))} rows={2} className="text-xs" />
            <Button size="sm" className="w-full h-8 text-xs" disabled={!purchase.product.trim() || addPurchase.isPending} onClick={() => addPurchase.mutate()}>
              {addPurchase.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Salvar compra
            </Button>
          </div>
        )}

        {loadingP ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto my-3" />
        ) : purchases.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3 bg-muted/20 rounded-md">Nenhuma compra registrada.</p>
        ) : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {purchases.map((p: any) => {
              const hasAgendaLink = !!p.agenda_event_id;
              const hasSiteLink = !!p.customer_order_id;
              const auto = hasAgendaLink || hasSiteLink || isAutoEntry(p.notes);
              const siteShort = extractSiteOrderShortId(p.product);
              const linkable = hasAgendaLink || hasSiteLink || !!extractEventId(p.notes) || !!siteShort;
              const handlePurchaseClick = async () => {
                if (hasAgendaLink) {
                  setViewingEventId(p.agenda_event_id);
                  return;
                }
                if (hasSiteLink) {
                  const { data } = await supabase
                    .from("agenda_events")
                    .select("id")
                    .eq("customer_order_id", p.customer_order_id)
                    .is("parent_event_id", null)
                    .maybeSingle();
                  if (data?.id) {
                    setViewingEventId(data.id);
                    return;
                  }
                }
                const eid = extractEventId(p.notes);
                if (eid) {
                  setViewingEventId(eid);
                  return;
                }
                if (siteShort) {
                  const { data } = await supabase
                    .from("agenda_events")
                    .select("id")
                    .ilike("title", `Pedido #${siteShort.toUpperCase()}%`)
                    .order("scheduled_date", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                  if (data?.id) {
                    setViewingEventId(data.id);
                    return;
                  }
                }
                setViewingPurchase(p);
              };
              const originLabel = hasSiteLink || (siteShort && !hasAgendaLink) ? "Site" : (auto ? "Agenda" : null);
              return (
                <li
                  key={p.id}
                  onClick={handlePurchaseClick}
                  className="bg-card border border-border/60 rounded-md px-3 py-2 flex items-start gap-2 text-xs cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">{p.product}</span>
                      {p.amount != null && <span className="text-primary font-semibold">{formatBRL(Number(p.amount))}</span>}
                      {originLabel && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          <Sparkles className="w-2.5 h-2.5" /> {originLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.purchase_date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </div>
                    {p.notes && !auto && <p className="text-muted-foreground italic mt-1 line-clamp-1">{p.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    {!auto && !siteShort && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deletePurchase.mutate(p.id); }}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover compra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* MESSAGES */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Mensagens enviadas
            <span className="text-xs text-muted-foreground font-normal">({messages.length})</span>
          </h4>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowMessageForm((v) => !v)}>
            <Plus className="w-3 h-3" /> {showMessageForm ? "Cancelar" : "Registrar"}
          </Button>
        </div>

        {showMessageForm && (
          <div className="bg-muted/40 rounded-lg p-3 space-y-2 mb-2">
            <Select value={message.channel} onValueChange={(v) => setMessage((m) => ({ ...m, channel: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {channelOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Resumo da mensagem..." value={message.summary} onChange={(e) => setMessage((m) => ({ ...m, summary: e.target.value }))} rows={2} className="text-xs" />
            <Button size="sm" className="w-full h-8 text-xs" disabled={!message.summary.trim() || addMessage.isPending} onClick={() => addMessage.mutate()}>
              {addMessage.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Salvar mensagem
            </Button>
          </div>
        )}

        {loadingM ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto my-3" />
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3 bg-muted/20 rounded-md">Nenhuma mensagem registrada.</p>
        ) : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {messages.map((m: any) => {
              const auto = isAutoEntry(m.summary);
              const display = auto ? stripAutoTag(m.summary) : m.summary;
              return (
                <li
                  key={m.id}
                  onClick={() => setViewingMessage(m)}
                  className="bg-card border border-border/60 rounded-md px-3 py-2 flex items-start gap-2 text-xs cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {channelLabel(m.channel)}
                      </span>
                      {auto && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          <Sparkles className="w-2.5 h-2.5" /> Agenda
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {new Date(m.message_date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-foreground mt-1 line-clamp-2">{display}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteMessage.mutate(m.id); }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remover mensagem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* VIEW PURCHASE (read-only) */}
      <Dialog open={!!viewingPurchase} onOpenChange={(o) => !o && setViewingPurchase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Detalhes da compra
              {viewingPurchase && isAutoEntry(viewingPurchase.notes) && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded ml-1">
                  <Sparkles className="w-3 h-3" /> via Agenda
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReadField
                  label="Data da compra"
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  value={new Date(viewingPurchase.purchase_date + "T12:00:00").toLocaleDateString("pt-BR")}
                />
                <ReadField
                  label="Valor"
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                  value={
                    viewingPurchase.amount != null ? (
                      <span className="text-primary font-semibold">{formatBRL(Number(viewingPurchase.amount))}</span>
                    ) : null
                  }
                />
              </div>
              {(() => {
                const parsed = parseProductsField(viewingPurchase.product);
                const hasStructured = parsed.some((it) => Number(it.unit_price) > 0 || parsed.length > 1);
                return hasStructured ? (
                  <OrderItemsBreakdown
                    items={parsed}
                    orderTotal={viewingPurchase.amount != null ? Number(viewingPurchase.amount) : null}
                  />
                ) : (
                  <ReadField
                    label="Produto / descrição"
                    icon={<Tag className="w-3.5 h-3.5" />}
                    value={viewingPurchase.product}
                  />
                );
              })()}
              <ReadField
                label="Observações"
                icon={<FileText className="w-3.5 h-3.5" />}
                value={
                  isAutoEntry(viewingPurchase.notes)
                    ? stripAutoTag(viewingPurchase.notes) || (
                        <span className="text-muted-foreground italic">
                          Registro gerado automaticamente a partir de um evento da agenda.
                        </span>
                      )
                    : viewingPurchase.notes
                }
              />
              <div className="flex justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => setViewingPurchase(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW MESSAGE (read-only) */}
      <Dialog open={!!viewingMessage} onOpenChange={(o) => !o && setViewingMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" /> Detalhes da mensagem
              {viewingMessage && isAutoEntry(viewingMessage.summary) && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded ml-1">
                  <Sparkles className="w-3 h-3" /> via Agenda
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingMessage && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReadField
                  label="Canal"
                  icon={<UserIcon className="w-3.5 h-3.5" />}
                  value={channelLabel(viewingMessage.channel)}
                />
                <ReadField
                  label="Data"
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  value={new Date(viewingMessage.message_date).toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                />
              </div>
              <ReadField
                label="Resumo"
                icon={<FileText className="w-3.5 h-3.5" />}
                value={
                  isAutoEntry(viewingMessage.summary)
                    ? stripAutoTag(viewingMessage.summary)
                    : viewingMessage.summary
                }
              />
              <div className="flex justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => setViewingMessage(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW EVENT (read-only, shared) — for purchases auto-generated from agenda */}
      <EventDetailDialog
        open={!!viewingEventId}
        onOpenChange={(o) => !o && setViewingEventId(null)}
        eventId={viewingEventId}
      />
    </div>
  );
};

export default ClientHistoryPanel;
