import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Search, Eye, Mail, Phone, MapPin, CreditCard, Tag,
  CheckCircle2, Clock, XCircle, RefreshCw, AlertCircle, MessageCircle,
  BellRing, Send, CalendarClock, Printer, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { OriginBadge, getOrderOrigin, type OrderOrigin } from "./orderOrigin";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import EventDetailDialog from "./EventDetailDialog";
import { ReprocessMpButton } from "./ReprocessMpButton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded" | "failed";

interface CustomerOrder {
  id: string;
  status: OrderStatus | string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  coupon_code: string | null;
  shipping_address: any;
  payment_provider: string | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  metadata: any;
  whatsapp_paid_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price_cents: number;
}

import { STATUS_TOKENS } from "./agendaTokens";

// Reusa os mesmos tokens visuais da Agenda para os status equivalentes
// (pendente, confirmado, entregue, cancelado). Status exclusivos de pedido
// do site (fulfilled/refunded/failed) mantêm cores próprias.
const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: STATUS_TOKENS.pendente.label, icon: Clock, className: STATUS_TOKENS.pendente.pillClass },
  paid: { label: STATUS_TOKENS.confirmado.label, icon: CheckCircle2, className: STATUS_TOKENS.confirmado.pillClass },
  fulfilled: { label: "Enviado", icon: Package, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  cancelled: { label: STATUS_TOKENS.cancelado.label, icon: XCircle, className: STATUS_TOKENS.cancelado.pillClass },
  refunded: { label: "Estornado", icon: RefreshCw, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  failed: { label: "Falhou", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const formatBrl = (cents: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency.toUpperCase() }).format(
    (cents || 0) / 100,
  );

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? {
    label: status,
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  };
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
};

const OrdersTab = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<CustomerOrder | null>(null);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [notifyDismissed, setNotifyDismissed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-customer-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CustomerOrder[];
    },
    refetchInterval: 30000,
  });

  // Pedidos cadastrados manualmente via Agenda (não vinculados a um customer_order do site)
  const { data: manualAgendaOrders = [], refetch: refetchManual } = useQuery({
    queryKey: ["admin-manual-agenda-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_events")
        .select("id, order_number, title, client_name, phone, email, valor, status, scheduled_date, end_date, created_at, notes, payment_method, produto, endereco, tipo")
        .in("tipo", ["producao", "entrega"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filtra apenas eventos cadastrados manualmente (não criados pelo trigger do site)
      return (data ?? []).filter((e) => getOrderOrigin(e) === "manual");
    },
    refetchInterval: 30000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["admin-order-items", selected?.id],
    queryFn: async () => {
      if (!selected) return [];
      const { data, error } = await supabase
        .from("customer_order_items")
        .select("*")
        .eq("order_id", selected.id);
      if (error) throw error;
      return (data ?? []) as OrderItem[];
    },
    enabled: !!selected,
  });

  // Eventos da agenda vinculados a TODOS os pedidos do site (via customer_order_id ou metadata.agenda_event_id).
  // Usado tanto para a previsão de entrega quanto para abrir o painel da agenda ao clicar no pedido.
  const siteOrderIds = useMemo(() => orders.map((o) => o.id), [orders]);

  const { data: linkedAgendaEvents = [] } = useQuery({
    queryKey: ["admin-orders-linked-agenda", siteOrderIds.sort().join(",")],
    queryFn: async () => {
      if (siteOrderIds.length === 0) return [];
      const { data, error } = await supabase
        .from("agenda_events")
        .select("id, scheduled_date, customer_order_id")
        .in("customer_order_id", siteOrderIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: siteOrderIds.length > 0,
  });

  // Mapas: orderId -> eventId e eventId -> scheduled_date
  const eventIdByOrderId = useMemo(() => {
    const map = new Map<string, string>();
    linkedAgendaEvents.forEach((e: any) => {
      if (e.customer_order_id) map.set(e.customer_order_id, e.id);
    });
    return map;
  }, [linkedAgendaEvents]);

  const eventDateById = useMemo(() => {
    const map = new Map<string, string>();
    linkedAgendaEvents.forEach((e: any) => map.set(e.id, e.scheduled_date));
    return map;
  }, [linkedAgendaEvents]);

  const resolveEventId = (o: CustomerOrder): string | null =>
    (o.metadata?.agenda_event_id as string | undefined) ?? eventIdByOrderId.get(o.id) ?? null;

  // Itens de todos pedidos pagos a notificar (para incluir na mensagem)
  const ordersToNotify = useMemo(
    () => orders.filter((o) => o.status === "paid" && !o.whatsapp_paid_notified_at && o.customer_phone),
    [orders],
  );
  const notifyOrderIds = useMemo(() => ordersToNotify.map((o) => o.id), [ordersToNotify]);

  const { data: notifyItems = [] } = useQuery({
    queryKey: ["admin-notify-items", notifyOrderIds.sort().join(",")],
    queryFn: async () => {
      if (notifyOrderIds.length === 0) return [];
      const { data, error } = await supabase
        .from("customer_order_items")
        .select("order_id, product_name, quantity, unit_price_cents")
        .in("order_id", notifyOrderIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: notifyOrderIds.length > 0,
  });

  const itemsByOrder = useMemo(() => {
    const map = new Map<string, Array<{ product_name: string; quantity: number; unit_price_cents: number }>>();
    notifyItems.forEach((it: any) => {
      const list = map.get(it.order_id) ?? [];
      list.push(it);
      map.set(it.order_id, list);
    });
    return map;
  }, [notifyItems]);

  // Monta a mensagem WhatsApp de pagamento aprovado
  const buildPaidMessage = (
    order: CustomerOrder,
    orderItems: Array<{ product_name: string; quantity: number; unit_price_cents: number }>,
    deliveryDate: string | null,
  ) => {
    const shortId = order.id.slice(0, 8).toUpperCase();
    const total = formatBrl(order.total_cents, order.currency);
    const deliveryStr = deliveryDate
      ? new Date(deliveryDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
      : null;
    const itemsList = orderItems.length
      ? orderItems
          .map((it) => `• ${it.quantity}x ${it.product_name} — ${formatBrl(it.unit_price_cents * it.quantity, order.currency)}`)
          .join("\n")
      : null;
    const trackingUrl = `https://7ssolucoes.com.br/pedido/${order.id}`;

    return [
      `Olá${order.customer_name ? `, ${order.customer_name.split(" ")[0]}` : ""}! 💚`,
      ``,
      `Recebemos a confirmação do seu pagamento do pedido *#${shortId}* na *7S Soluções*.`,
      itemsList ? `` : null,
      itemsList,
      ``,
      `*Total: ${total}*`,
      order.coupon_code ? `Cupom: ${order.coupon_code}` : null,
      ``,
      deliveryStr
        ? `📅 *Previsão de entrega: até ${deliveryStr}*`
        : `📅 Em breve enviaremos a previsão de entrega.`,
      ``,
      `Acompanhe seu pedido aqui:`,
      trackingUrl,
      ``,
      `Qualquer dúvida, é só responder por aqui. Obrigado pela compra! 🙌`,
    ]
      .filter((l) => l !== null)
      .join("\n");
  };

  const sendPaidWhatsApp = async (order: CustomerOrder) => {
    const phoneRaw = (order.customer_phone || "").replace(/\D/g, "");
    if (!phoneRaw) {
      toast({ title: "Sem telefone", description: "Este pedido não tem WhatsApp cadastrado.", variant: "destructive" });
      return;
    }
    const phone = phoneRaw.startsWith("55") ? phoneRaw : `55${phoneRaw}`;
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const eid = resolveEventId(order);
    const deliveryDate = eid
      ? eventDateById.get(eid) ?? null
      : null;
    const msg = buildPaidMessage(order, orderItems, deliveryDate);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");

    // Marca como notificado
    const { error } = await supabase
      .from("customer_orders")
      .update({ whatsapp_paid_notified_at: new Date().toISOString() })
      .eq("id", order.id);
    if (!error) {
      toast({ title: "WhatsApp aberto!", description: "Pedido marcado como notificado." });
      refetch();
    }
  };

  // Linhas unificadas (site + agenda manual)
  type UnifiedRow = {
    key: string;
    origin: OrderOrigin;
    created_at: string;
    customer_name: string | null;
    contact: string | null;
    total_cents: number;
    currency: string;
    status: string;
    statusLabel: string;
    siteOrder?: CustomerOrder;
    agendaEvent?: any;
  };

  const unified: UnifiedRow[] = useMemo(() => {
    const siteRows: UnifiedRow[] = orders.map((o) => ({
      key: `site-${o.id}`,
      origin: "site",
      created_at: o.created_at,
      customer_name: o.customer_name,
      contact: o.customer_email || o.customer_phone || null,
      total_cents: o.total_cents,
      currency: o.currency,
      status: o.status,
      statusLabel: statusConfig[o.status]?.label ?? o.status,
      siteOrder: o,
    }));
    const manualRows: UnifiedRow[] = manualAgendaOrders.map((e: any) => ({
      key: `manual-${e.id}`,
      origin: "manual",
      created_at: e.created_at,
      customer_name: e.client_name,
      contact: e.email || e.phone || null,
      total_cents: Math.round(Number(e.valor || 0) * 100),
      currency: "BRL",
      status: e.status,
      statusLabel: e.status,
      agendaEvent: e,
    }));
    return [...siteRows, ...manualRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [orders, manualAgendaOrders]);

  const [originFilter, setOriginFilter] = useState<"all" | OrderOrigin>("all");

  const filtered = unified.filter((r) => {
    if (originFilter !== "all" && r.origin !== originFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const o = r.siteOrder;
    const e = r.agendaEvent;
    const haystack = [
      r.customer_name, r.contact, r.statusLabel,
      o?.coupon_code, o?.mp_payment_id, o?.id,
      e?.id, e?.order_number ? `#${String(e.order_number).padStart(4, "0")}` : null, e?.produto, e?.title,
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(term);
  });

  const stats = {
    total: unified.length,
    paid: unified.filter((r) =>
      r.origin === "site"
        ? r.status === "paid" || r.status === "fulfilled"
        : r.status === "entregue" || r.status === "concluido",
    ).length,
    pending: unified.filter((r) =>
      r.origin === "site"
        ? r.status === "pending"
        : r.status === "pendente" || r.status === "em_producao",
    ).length,
    revenue: unified
      .filter((r) =>
        r.origin === "site"
          ? r.status === "paid" || r.status === "fulfilled"
          : r.status !== "cancelado",
      )
      .reduce((sum, r) => sum + (r.total_cents || 0), 0),
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from("customer_orders")
      .update({ status: newStatus })
      .eq("id", id);
    setUpdating(false);
    if (!error) {
      await refetch();
      if (selected?.id === id) setSelected({ ...selected, status: newStatus });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.origin === "site" && deleteTarget.siteOrder) {
        // O banco cuida do cascade: itens, agenda vinculada (customer_order_id),
        // lembretes (parent_event_id) e histórico (customer_order_id) são apagados juntos.
        const { error } = await supabase
          .from("customer_orders")
          .delete()
          .eq("id", deleteTarget.siteOrder.id);
        if (error) throw error;
      } else if (deleteTarget.agendaEvent) {
        // Lembretes vinculados são removidos via FK ON DELETE CASCADE (parent_event_id)
        const { error } = await supabase
          .from("agenda_events")
          .delete()
          .eq("id", deleteTarget.agendaEvent.id);
        if (error) throw error;
      }
      toast({ title: "Pedido excluído", description: "O pedido foi removido com sucesso." });
      setDeleteTarget(null);
      refetch();
      refetchManual();
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const address = selected?.shipping_address as any;

  return (
    <div className="space-y-6">
      {/* Banner: pedidos pagos a notificar via WhatsApp */}
      <AnimatePresence>
        {ordersToNotify.length > 0 && !notifyDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-foreground">
                    {ordersToNotify.length} pedido{ordersToNotify.length > 1 ? "s pagos aguardam" : " pago aguarda"} aviso no WhatsApp
                  </h3>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setNotifyDismissed(true)}>
                    Esconder
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  Clique para abrir o WhatsApp com a confirmação de pagamento e a previsão de entrega já preenchidas.
                </p>
                <div className="space-y-2">
                  {ordersToNotify.slice(0, 5).map((o) => {
                    const eid = resolveEventId(o);
                    const eventDate = eid ? eventDateById.get(eid) : null;
                    return (
                      <div
                        key={o.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-background/60 border border-border"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {o.customer_name || <span className="italic text-muted-foreground">Sem nome</span>}
                            <span className="text-xs text-muted-foreground font-mono ml-2">
                              #{o.id.slice(0, 8).toUpperCase()}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                            <span>{formatBrl(o.total_cents, o.currency)}</span>
                            {eventDate && (
                              <span className="flex items-center gap-1">
                                <CalendarClock className="w-3 h-3" />
                                Entrega até {new Date(eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
                          onClick={() => sendPaidWhatsApp(o)}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Avisar
                        </Button>
                      </div>
                    );
                  })}
                  {ordersToNotify.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{ordersToNotify.length - 5} outros pedidos pagos a notificar.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Package, color: "text-foreground" },
          { label: "Pagos", value: stats.paid, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
          { label: "Receita", value: formatBrl(stats.revenue), icon: CreditCard, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`w-8 h-8 opacity-30 ${s.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email, telefone, cupom ou ID…"
            className="pl-9"
          />
        </div>
        <Select value={originFilter} onValueChange={(v) => setOriginFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            <SelectItem value="site">Pedidos do site</SelectItem>
            <SelectItem value="manual">Cadastro manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { refetch(); refetchManual(); }} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Carregando pedidos…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {unified.length === 0 ? "Nenhum pedido recebido ainda." : "Nenhum pedido encontrado para esses filtros."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const handleOpen = () => {
                    if (r.origin === "site" && r.siteOrder) {
                      const eid = resolveEventId(r.siteOrder);
                      if (eid) {
                        setViewingEventId(eid);
                      } else {
                        setSelected(r.siteOrder);
                      }
                    } else if (r.agendaEvent) {
                      setViewingEventId(r.agendaEvent.id);
                    }
                  };
                  return (
                    <motion.tr
                      key={r.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Abrir pedido de ${r.customer_name || "cliente sem nome"}`}
                      onClick={handleOpen}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpen();
                        }
                      }}
                      className="border-b border-border hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer transition-colors"
                    >
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
                      <TableCell className="font-medium">
                        <div className="space-y-0.5">
                          <div>{r.customer_name || <span className="text-muted-foreground italic">Sem nome</span>}</div>
                          {r.agendaEvent?.order_number && (
                            <div className="text-xs text-muted-foreground font-mono">
                              Pedido #{String(r.agendaEvent.order_number).padStart(4, "0")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.contact || "—"}</TableCell>
                      <TableCell><OriginBadge origin={r.origin} short /></TableCell>
                      <TableCell className="font-semibold">{formatBrl(r.total_cents, r.currency)}</TableCell>
                      <TableCell>
                        {r.origin === "site"
                          ? <StatusBadge status={r.status} />
                          : <Badge variant="outline" className="capitalize">{r.statusLabel.replace(/_/g, " ")}</Badge>}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label="Excluir pedido"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Shared agenda-style detail (used for manual orders and site orders linked to agenda) */}
      <EventDetailDialog
        open={!!viewingEventId}
        onOpenChange={(o) => !o && setViewingEventId(null)}
        eventId={viewingEventId}
      />

      {/* Detail dialog (fallback for site orders sem evento de agenda vinculado) */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 flex-wrap">
                  <Package className="w-5 h-5 text-primary" />
                  Pedido #{selected.id.slice(0, 8)}
                  <OriginBadge origin="site" />
                </DialogTitle>
                <DialogDescription>
                  Recebido em {formatDate(selected.created_at)}
                </DialogDescription>
              </DialogHeader>

              {/* Ações rápidas: WhatsApp + Imprimir (mesmo padrão da agenda) */}
              <div className="flex flex-wrap items-center gap-2 -mt-1">
                {selected.customer_phone ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => sendPaidWhatsApp(selected)}
                    title="Enviar comprovante/link do pedido por WhatsApp"
                    className="gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled
                    title="Pedido sem WhatsApp cadastrado"
                    className="gap-1.5 opacity-60"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> WhatsApp
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/pedido/${selected.id}?print=1`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  title="Imprimir comprovante do pedido"
                  className="gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </Button>
              </div>

              <div className="space-y-5">
                {/* Status switcher */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Status atual:</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => updateStatus(selected.id, v)}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Cliente</h3>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {selected.customer_email || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      {selected.customer_phone || "—"}
                    </div>
                  </div>
                  {address && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div>
                        {address.line1 && <div>{address.line1}</div>}
                        {address.line2 && <div>{address.line2}</div>}
                        {(address.city || address.state || address.postal_code) && (
                          <div>
                            {[address.city, address.state, address.postal_code].filter(Boolean).join(" — ")}
                          </div>
                        )}
                        {address.country && <div>{address.country}</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Itens</h3>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Carregando itens…</p>
                    ) : items.map((it) => (
                      <div key={it.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                        {it.product_image ? (
                          <img src={it.product_image} alt={it.product_name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{it.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {it.quantity}× {formatBrl(it.unit_price_cents, selected.currency)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatBrl(it.unit_price_cents * it.quantity, selected.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatBrl(selected.subtotal_cents, selected.currency)}</span>
                  </div>
                  {selected.discount_cents > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        Desconto {selected.coupon_code && `(${selected.coupon_code})`}
                      </span>
                      <span>-{formatBrl(selected.discount_cents, selected.currency)}</span>
                    </div>
                  )}
                  {selected.shipping_cents > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frete</span>
                      <span>{formatBrl(selected.shipping_cents, selected.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-1.5 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{formatBrl(selected.total_cents, selected.currency)}</span>
                  </div>
                </div>

                {/* Pagamento (Mercado Pago) */}
                {(selected.mp_payment_id || selected.mp_preference_id) && (
                  <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">Mercado Pago</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] uppercase tracking-wide">
                        {selected.status}
                      </span>
                    </div>
                    {selected.mp_payment_id && (
                      <div className="font-mono break-all flex items-center gap-1.5">
                        <span>Payment ID: {selected.mp_payment_id}</span>
                        <a
                          href={`https://www.mercadopago.com.br/activities/detail/${selected.mp_payment_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center"
                          title="Abrir no painel do Mercado Pago"
                        >
                          ↗
                        </a>
                      </div>
                    )}
                    {selected.mp_preference_id && (
                      <div className="font-mono break-all flex items-center gap-1.5">
                        <span>Preference ID: {selected.mp_preference_id}</span>
                        <a
                          href={`https://www.mercadopago.com.br/developers/panel/app/checkout-pro/preferences/${selected.mp_preference_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center"
                          title="Abrir preference no painel do Mercado Pago"
                        >
                          ↗
                        </a>
                      </div>
                    )}
                    <ReprocessMpButton
                      defaultPaymentId={selected.mp_payment_id}
                      onDone={() => refetch()}
                    />
                  </div>
                )}
                {!selected.mp_payment_id && (
                  <div className="border-t border-border pt-3">
                    <ReprocessMpButton onDone={() => refetch()} />
                  </div>
                )}

                {/* WhatsApp: avisar pagamento + recibo */}
                {selected.customer_phone && (
                  <div className="border-t border-border pt-3 space-y-2">
                    {selected.status === "paid" && (
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => sendPaidWhatsApp(selected)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {selected.whatsapp_paid_notified_at
                          ? "Reenviar aviso de pagamento (WhatsApp)"
                          : "Avisar pagamento + previsão de entrega (WhatsApp)"}
                      </Button>
                    )}
                    {selected.whatsapp_paid_notified_at && (
                      <p className="text-[11px] text-muted-foreground text-center">
                        Avisado em {new Date(selected.whatsapp_paid_notified_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const phone = (selected.customer_phone || "").replace(/\D/g, "");
                        const shortId = selected.id.slice(0, 8).toUpperCase();
                        const total = formatBrl(selected.total_cents, selected.currency);
                        const itemsList = items
                          .map((it) => `• ${it.quantity}x ${it.product_name} — ${formatBrl(it.unit_price_cents * it.quantity, selected.currency)}`)
                          .join("\n");
                        const trackingUrl = `https://7ssolucoes.com.br/pedido/${selected.id}`;
                        const msg = [
                          `Olá${selected.customer_name ? `, ${selected.customer_name}` : ""}! 👋`,
                          ``,
                          `Recibo do seu pedido *#${shortId}* na 7S Soluções:`,
                          ``,
                          itemsList,
                          ``,
                          `*Total: ${total}*`,
                          selected.coupon_code ? `Cupom: ${selected.coupon_code}` : null,
                          ``,
                          `Acompanhe: ${trackingUrl}`,
                          ``,
                          `Obrigado pela compra! 💚`,
                        ]
                          .filter(Boolean)
                          .join("\n");
                        const url = `https://wa.me/${phone.startsWith("55") ? phone : "55" + phone}?text=${encodeURIComponent(msg)}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar recibo por WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido
              {deleteTarget?.customer_name ? ` de ${deleteTarget.customer_name}` : ""}
              {deleteTarget?.agendaEvent?.order_number ? ` (#${String(deleteTarget.agendaEvent.order_number).padStart(4, "0")})` : ""}
              {deleteTarget?.siteOrder ? ` (#${deleteTarget.siteOrder.id.slice(0, 8).toUpperCase()})` : ""}
              {" "}será removido permanentemente
              {deleteTarget?.origin === "site" ? ", junto com seus itens e o evento da agenda vinculado" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo…" : "Excluir pedido"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersTab;
