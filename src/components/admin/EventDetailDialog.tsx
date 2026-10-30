import { useQuery, useQueryClient } from "@tanstack/react-query";
import MercadoPagoPaymentBlock from "./MercadoPagoPaymentBlock";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays, User, Package, ClipboardCheck, MapPin, Mail, Phone,
  Hammer, Truck, CreditCard, DollarSign, Loader2, Cake, Pencil, ShoppingBag,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OriginBadge, getOrderOrigin } from "./orderOrigin";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import ClientReadFields from "./ClientReadFields";
import OrderItemsBreakdown from "./OrderItemsBreakdown";
import { parseProductsField } from "./parseProductsField";
import {
  TIPO_TOKENS, STATUS_TOKENS,
  type Tipo as TipoT,
} from "./agendaTokens";

type Tipo = TipoT;

interface AgendaEvent {
  id: string;
  order_number?: number | null;
  parent_event_id?: string | null;
  tipo: Tipo;
  title: string;
  description: string | null;
  notes: string | null;
  scheduled_date: string;
  end_date: string | null;
  production_start_date?: string | null;
  created_at?: string | null;
  status: string;
  client_id: string | null;
  client_name: string | null;
  produto: string | null;
  endereco: string | null;
  phone?: string | null;
  email?: string | null;
  valor: number | null;
  payment_method: string | null;
  shipping_carrier?: string | null;
  mp_init_point?: string | null;
  mp_preference_id?: string | null;
  mp_payment_id?: string | null;
  mp_payment_status?: string | null;
  mp_paid_at?: string | null;
  mp_receipt_url?: string | null;
  mp_payment_method?: string | null;
  customer_order_id?: string | null;
}

const tipoConfig = TIPO_TOKENS as Record<Tipo, { label: string; icon: typeof Truck; pillClass: string; dotClass: string; hsl: string }>;
const statusConfig = STATUS_TOKENS as Record<string, { label: string; pillClass: string; ringClass: string; buttonOutlineClass: string; hsl: string }>;

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
];

interface ParsedItem {
  produto: string;
  unit_price: string;
  quantidade: string;
}

interface SiteOrderItem {
  product_name: string;
  quantity: number | null;
  unit_price_cents: number | null;
}

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

interface ParsedAddress {
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  complement: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

const formatCep = (cep: string | null | undefined): string | null => {
  if (!cep) return null;
  const digits = cep.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return cep;
};

/**
 * Mercado Pago (BR) costuma devolver endereço em line1/line2 em formato livre.
 * Tentamos heurística para separar número, bairro e complemento.
 *  - line1: "Rua das Flores, 123" ou "Rua das Flores 123 - Centro"
 *  - line2: "Apto 42" ou "Bairro Centro" ou "Centro / Apto 42"
 */
const parseShippingAddress = (addr: ShippingAddress | null | undefined): ParsedAddress => {
  const empty: ParsedAddress = {
    street: null, number: null, neighborhood: null, complement: null,
    city: null, state: null, postal_code: null, country: null,
  };
  if (!addr) return empty;

  let street: string | null = null;
  let number: string | null = null;
  let neighborhood: string | null = null;
  let complement: string | null = null;

  const l1 = (addr.line1 || "").trim();
  if (l1) {
    // "Rua X, 123 - Bairro" ou "Rua X, 123, Bairro"
    const m = l1.match(/^(.+?)[,\s]+(\d+[A-Za-z]?)\s*(?:[-,/]\s*(.+))?$/);
    if (m) {
      street = m[1].trim().replace(/[,\s]+$/, "");
      number = m[2].trim();
      if (m[3]) neighborhood = m[3].trim();
    } else {
      street = l1;
    }
  }

  const l2 = (addr.line2 || "").trim();
  if (l2) {
    // Aceita "Bairro - Complemento", "Bairro / Apto 12", "Bairro | Apto 12"
    // (o webhook do site grava com " - " entre bairro e complemento)
    const parts = l2.split(/\s+[-/|]\s+/);
    if (parts.length > 1) {
      if (!neighborhood) neighborhood = parts[0].trim();
      complement = parts.slice(1).join(" - ").trim();
    } else if (!neighborhood) {
      // Se a string parece complemento (apto/bloco/sala/casa), trata como tal
      if (/^(apto|apart|bloco|bl\.?|sala|casa|fundos|cs|lote|qd)/i.test(l2)) {
        complement = l2;
      } else {
        neighborhood = l2;
      }
    } else {
      complement = l2;
    }
  }

  return {
    street,
    number,
    neighborhood,
    complement,
    city: addr.city || null,
    state: addr.state || null,
    postal_code: formatCep(addr.postal_code),
    country: addr.country || null,
  };
};

/**
 * Fallback: parsear o campo texto `agenda_events.endereco` (string única
 * concatenada por vírgulas).  Formato gerado pelo trigger é:
 *   "line1, line2, city, state, postal_code"
 */
const parseFlatAddress = (raw: string | null | undefined): ParsedAddress => {
  const empty: ParsedAddress = {
    street: null, number: null, neighborhood: null, complement: null,
    city: null, state: null, postal_code: null, country: null,
  };
  if (!raw || !raw.trim()) return empty;
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  // Tenta achar CEP (8 dígitos) e UF (2 letras)
  let postal_code: string | null = null;
  let state: string | null = null;
  const remaining: string[] = [];
  for (const p of parts) {
    if (!postal_code && /^\d{5}-?\d{3}$/.test(p)) {
      postal_code = formatCep(p);
    } else if (!state && /^[A-Z]{2}$/.test(p)) {
      state = p;
    } else {
      remaining.push(p);
    }
  }
  // Heurística simples: line1 (rua + nº) | line2 (bairro/complemento) | city
  const line1 = remaining[0] || null;
  const line2 = remaining[1] || null;
  const city = remaining[2] || null;
  return parseShippingAddress({
    line1,
    line2,
    city,
    state,
    postal_code,
  });
};
const parseItems = parseProductsField;

interface ReadFieldProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}

const ReadField = ({ label, icon, value, mono, className }: ReadFieldProps) => {
  const isEmpty = value === null || value === undefined || value === "" || value === "—";
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </Label>
      <div
        className={cn(
          "min-h-10 w-full rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground break-words whitespace-pre-wrap",
          mono && "tabular-nums",
        )}
      >
        {isEmpty ? <span className="text-muted-foreground italic">—</span> : value}
      </div>
    </div>
  );
};

interface Props {
  /** Pass the event directly, OR pass `eventId` to fetch it. */
  event?: AgendaEvent | null;
  eventId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional. When provided, shows an "Editar" button (hidden for lembretes). */
  onEdit?: (event: AgendaEvent) => void;
}

/**
 * Shared read-only dialog that displays an agenda event with the same
 * three-tab layout used in the edit modal (Cliente · Produto · Resumo),
 * styled as "closed inputs". No edit or WhatsApp buttons.
 *
 * Reuse this in any admin screen that needs to show event details
 * (Reports, Client history, etc).
 */
const EventDetailDialog = ({ event: eventProp, eventId, open, onOpenChange, onEdit }: Props) => {
  const qc = useQueryClient();
  // Fetch event by id when only id is provided (e.g. from a linked purchase)
  const { data: fetched, isLoading } = useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("agenda_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as AgendaEvent | null;
    },
    enabled: open && !eventProp && !!eventId,
  });

  const rawEvent = eventProp || fetched || null;

  // Quando o evento é um lembrete, buscamos o pedido pai pelo vínculo técnico.
  // Não usamos mais título/cliente, pois pedidos iguais para o mesmo cliente são válidos.
  const isReminder = rawEvent?.tipo === "lembrete";
  const { data: parentEvent } = useQuery({
    queryKey: ["event-detail-parent", rawEvent?.id, rawEvent?.parent_event_id],
    queryFn: async () => {
      if (!isReminder || !rawEvent?.parent_event_id) return null;
      const { data, error } = await supabase
        .from("agenda_events")
        .select("*")
        .eq("id", rawEvent.parent_event_id)
        .maybeSingle();
      if (error) throw error;
      return data as AgendaEvent | null;
    },
    enabled: open && !!isReminder && !!rawEvent?.parent_event_id,
  });

  // Mescla: usa o lembrete como base (preserva título, data e tipo) e completa
  // os campos vazios com dados do pedido pai. Se não houver pai, usa o lembrete como veio.
  const event: AgendaEvent | null = rawEvent
    ? (parentEvent
        ? {
            ...rawEvent,
            order_number: rawEvent.order_number ?? parentEvent.order_number,
            production_start_date: rawEvent.production_start_date ?? parentEvent.production_start_date,
            end_date: rawEvent.end_date ?? parentEvent.end_date,
            client_name: rawEvent.client_name || parentEvent.client_name,
            phone: rawEvent.phone || parentEvent.phone,
            email: rawEvent.email || parentEvent.email,
            endereco: rawEvent.endereco || parentEvent.endereco,
            produto: rawEvent.produto || parentEvent.produto,
            valor: rawEvent.valor && Number(rawEvent.valor) > 0 ? rawEvent.valor : parentEvent.valor,
            payment_method: rawEvent.payment_method || parentEvent.payment_method,
            shipping_carrier: rawEvent.shipping_carrier || parentEvent.shipping_carrier,
            notes: rawEvent.notes || parentEvent.notes,
          }
        : rawEvent)
    : null;
  const origin = event ? getOrderOrigin(event) : null;

  // Resolve client (for fallback phone/email)
  const { data: client } = useQuery({
    queryKey: ["event-detail-client", event?.client_id],
    queryFn: async () => {
      if (!event?.client_id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, email, address, birthday, street, number, neighborhood, complement, city, state, cep")
        .eq("id", event.client_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!event?.client_id,
  });

  const { data: siteOrder } = useQuery({
    queryKey: ["event-detail-site-order", event?.id],
    queryFn: async () => {
      if (!event?.id) return null;

      // Caminho preferido: vínculo real via agenda_events.customer_order_id
      let orderRow: any = null;
      const { data: byEvent } = await supabase
        .from("agenda_events")
        .select("customer_order_id")
        .eq("id", event.id)
        .maybeSingle();

      if (byEvent?.customer_order_id) {
        const { data } = await supabase
          .from("customer_orders")
          .select("id, shipping_cents, subtotal_cents, total_cents, discount_cents, coupon_code, shipping_address")
          .eq("id", byEvent.customer_order_id)
          .maybeSingle();
        orderRow = data;
      }

      // Fallback legado: pedidos antigos guardam o vínculo só em metadata
      if (!orderRow) {
        const { data } = await supabase
          .from("customer_orders")
          .select("id, shipping_cents, subtotal_cents, total_cents, discount_cents, coupon_code, shipping_address")
          .contains("metadata", { agenda_event_id: event.id })
          .maybeSingle();
        orderRow = data;
      }

      if (!orderRow?.id) return null;

      const { data: items, error } = await supabase
        .from("customer_order_items")
        .select("product_name, quantity, unit_price_cents")
        .eq("order_id", orderRow.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { ...orderRow, items: (items ?? []) as SiteOrderItem[] };
    },
    enabled: open && !!event?.id && origin === "site",
  });

  const siteOrderItems = siteOrder?.items ?? [];
  const shippingCents = siteOrder?.shipping_cents ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden sm:max-w-2xl [&>*]:min-w-0">
        {isLoading && !event ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !event ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Evento não encontrado.
          </div>
        ) : (
          (() => {
            const cfg = tipoConfig[event.tipo as Tipo] || tipoConfig.lembrete;
            const TipoIcon = cfg.icon;
            const status = statusConfig[event.status] || statusConfig.pendente;
            const d = parseISO(event.scheduled_date);
            const endD = event.end_date ? parseISO(event.end_date) : null;
            const prodStart = event.production_start_date
              ? parseISO(event.production_start_date)
              : null;
            const prodEnd = endD;
            const deliveryD = d;
            // Para pedidos do site, o "valor total" deve refletir subtotal + frete - desconto
            // (o evento.valor armazena apenas o subtotal/itens, sem o frete).
            const siteTotalCents = siteOrder
              ? Math.max(
                  (siteOrder.subtotal_cents ?? 0) + (siteOrder.shipping_cents ?? 0) - (siteOrder.discount_cents ?? 0),
                  siteOrder.total_cents ?? 0,
                )
              : 0;
            const displayValor = origin === "site" && siteTotalCents > 0
              ? siteTotalCents / 100
              : (Number(event.valor) || 0);
            const valorFmt = displayValor > 0
              ? `R$ ${displayValor.toFixed(2).replace(".", ",")}`
              : "—";
            // Para pedidos do site o método vem do Mercado Pago (mp_payment_method).
            const mpMethodLabel = (m: string | null | undefined) => {
              if (!m) return null;
              const map: Record<string, string> = {
                pix: "Pix",
                credit_card: "Cartão de crédito",
                debit_card: "Cartão de débito",
                ticket: "Boleto",
                bank_transfer: "Transferência",
                account_money: "Saldo Mercado Pago",
                mercadopago: "Mercado Pago",
              };
              return map[m] || m;
            };
            const pagamentoFmt = event.payment_method
              ? PAYMENT_METHODS.find((p) => p.value === event.payment_method)?.label || event.payment_method
              : (origin === "site" ? (mpMethodLabel(event.mp_payment_method) || "Mercado Pago") : null);
            const prodFmt = prodStart
              ? format(prodStart, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : null;
            const entregaFmt = deliveryD
              ? format(deliveryD, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : null;
            const purchaseD = event.created_at ? parseISO(event.created_at) : null;
            const compraFmt = purchaseD
              ? format(purchaseD, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : null;
            // Quando o evento está vinculado a um cliente, o cliente é a fonte da verdade
            // (qualquer edição em Clientes reflete aqui automaticamente). Sem vínculo,
            // caímos no valor capturado no evento/pedido.
            const phone = (event.client_id ? client?.phone : null) || event.phone || client?.phone || null;
            const email = (event.client_id ? client?.email : null) || event.email || client?.email || null;
            const clientName = (event.client_id ? client?.name : null) || event.client_name || client?.name || null;
            const birthday = client?.birthday || null;
            const birthdayFmt = birthday
              ? new Date(birthday + "T12:00:00").toLocaleDateString("pt-BR")
              : null;
            const clientHasStructuredAddress = !!(
              client && (client.street || client.number || client.neighborhood || client.complement || client.city || client.state || client.cep)
            );
            const parsedAddress: ParsedAddress = clientHasStructuredAddress
              ? {
                  street: client!.street || null,
                  number: client!.number || null,
                  neighborhood: client!.neighborhood || null,
                  complement: client!.complement || null,
                  city: client!.city || null,
                  state: client!.state || null,
                  postal_code: formatCep(client!.cep),
                  country: null,
                }
              : (siteOrder?.shipping_address as ShippingAddress | null)
                ? parseShippingAddress(siteOrder!.shipping_address as ShippingAddress)
                : parseFlatAddress(event.endereco);
            const hasAddress = Object.values(parsedAddress).some((v) => !!v);
            const siteItems = siteOrderItems.map((it) => ({
              produto: it.product_name,
              unit_price: String((it.unit_price_cents ?? 0) / 100),
              quantidade: String(it.quantity ?? 1),
            }));
            const items = siteItems.length > 0 ? siteItems : parseItems(event.produto || "");
            const eventValor = Number(event.valor) || 0;
            const explicitShippingValue = origin === "site" && shippingCents > 0 ? shippingCents / 100 : null;

            return (
              <>
                <DialogHeader className="pr-8 min-w-0 max-w-full">
                  <DialogTitle className="font-serif text-xl pr-2 flex items-start gap-2 min-w-0 max-w-full leading-tight">
                    <span className={cn("inline-flex items-center justify-center w-7 h-7 rounded-md border shrink-0 mt-0.5", cfg.pillClass)}>
                      <TipoIcon className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] whitespace-normal">{event.title}</span>
                  </DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap mt-1 min-w-0">
                    {event.order_number && (
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        Pedido #{String(event.order_number).padStart(4, "0")}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground capitalize break-words">
                      {format(d, "EEEE, d 'de' MMMM", { locale: ptBR })} · {format(d, "HH:mm")}
                    </p>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", status.pillClass)}>
                      {status.label}
                    </Badge>
                    <OriginBadge origin={origin || "manual"} />
                  </div>
                </DialogHeader>

                <Tabs defaultValue="cliente" className="mt-3 min-w-0">
                  <TabsList className="grid w-full min-w-0 grid-cols-3">
                    <TabsTrigger value="cliente" className="min-w-0 gap-1.5 px-2 text-xs sm:text-sm">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate">Cliente</span>
                    </TabsTrigger>
                    <TabsTrigger value="produto" className="min-w-0 gap-1.5 px-2 text-xs sm:text-sm">
                      <Package className="h-4 w-4 shrink-0" />
                      <span className="truncate">Produto</span>
                    </TabsTrigger>
                    <TabsTrigger value="resumo" className="min-w-0 gap-1.5 px-2 text-xs sm:text-sm">
                      <ClipboardCheck className="h-4 w-4 shrink-0" />
                      <span className="truncate">Resumo</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* CLIENTE */}
                  <TabsContent value="cliente" className="mt-3 min-w-0 space-y-3">
                    <ClientReadFields
                      showName
                      data={{
                        name: clientName,
                        phone,
                        email,
                        birthday,
                        address: {
                          street: parsedAddress.street,
                          number: parsedAddress.number,
                          neighborhood: parsedAddress.neighborhood,
                          complement: parsedAddress.complement,
                          city: parsedAddress.city,
                          state: parsedAddress.state,
                          cep: parsedAddress.postal_code,
                        },
                      }}
                    />
                  </TabsContent>

                  {/* PRODUTO */}
                  <TabsContent value="produto" className="mt-3 min-w-0 space-y-3">
                    <ReadField label="Título" value={event.title} />

                    <ReadField
                      label={<>Data da Compra <span className="text-[10px] font-normal text-muted-foreground">(automática)</span></>}
                      icon={<ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />}
                      value={compraFmt}
                    />

                    <ReadField
                      label={<>Data de Produção <span className="text-[10px] font-normal text-muted-foreground">(opcional)</span></>}
                      icon={<Hammer className="w-3.5 h-3.5 text-indigo-500" />}
                      value={prodFmt}
                    />

                    <ReadField
                      label="Data de Entrega"
                      icon={<Truck className="w-3.5 h-3.5 text-fuchsia-500" />}
                      value={entregaFmt}
                    />

                    <OrderItemsBreakdown
                      items={items}
                      shipping={explicitShippingValue}
                      orderTotal={eventValor || null}
                      carrier={event.shipping_carrier || null}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ReadField
                        label="Valor (R$)"
                        icon={<CreditCard className="w-3.5 h-3.5 text-primary" />}
                        value={valorFmt}
                        mono
                      />
                      <ReadField
                        label="Forma de pagamento"
                        icon={<CreditCard className="w-3.5 h-3.5 text-primary" />}
                        value={pagamentoFmt}
                      />
                    </div>

                    <ReadField
                      label="Observações"
                      value={event.notes ? <span className="whitespace-pre-wrap">{event.notes}</span> : null}
                    />

                    <div>
                      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        Status
                      </Label>
                      <div className="mt-1.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
                          status.pillClass,
                        )}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <MercadoPagoPaymentBlock
                      eventId={event.id}
                      isSiteOrder={!!event.customer_order_id}
                      clientName={clientName}
                      phone={phone}
                      valor={event.valor}
                      mp_init_point={event.mp_init_point}
                      mp_preference_id={event.mp_preference_id}
                      mp_payment_id={event.mp_payment_id}
                      mp_payment_status={event.mp_payment_status}
                      mp_paid_at={event.mp_paid_at}
                      mp_receipt_url={event.mp_receipt_url}
                      mp_payment_method={event.mp_payment_method}
                      onUpdated={() => {
                        qc.invalidateQueries({ queryKey: ["event-detail", event.id] });
                        qc.invalidateQueries({ queryKey: ["agenda-events"] });
                      }}
                    />
                  </TabsContent>

                  {/* RESUMO */}
                  <TabsContent value="resumo" className="mt-3 min-w-0 space-y-3">
                    <div className="rounded-lg border border-border bg-card/40 p-3 space-y-3">
                      {/* Cliente */}
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Cliente
                        </h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-muted-foreground">Nome</dt>
                            <dd className="font-medium">{clientName || <span className="text-muted-foreground italic">Não informado</span>}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</dt>
                            <dd>{phone || <span className="text-muted-foreground italic">—</span>}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground flex items-center gap-1"><Cake className="w-3 h-3" /> Aniversário</dt>
                            <dd>{birthdayFmt || <span className="text-muted-foreground italic">—</span>}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</dt>
                            <dd className="break-all">{email || <span className="text-muted-foreground italic">—</span>}</dd>
                          </div>
                        </dl>

                        {/* Endereço estruturado */}
                        <div className="mt-3">
                          <h5 className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                            <MapPin className="w-3 h-3" /> Endereço de entrega
                          </h5>
                          {!hasAddress ? (
                            <p className="text-sm text-muted-foreground italic">Não informado.</p>
                          ) : (
                            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 text-sm">
                              <div className="col-span-2 sm:col-span-3">
                                <dt className="text-[11px] text-muted-foreground">Logradouro</dt>
                                <dd className="break-words">{parsedAddress.street || <span className="text-muted-foreground italic">—</span>}</dd>
                              </div>
                              <div>
                                <dt className="text-[11px] text-muted-foreground">Número</dt>
                                <dd className="tabular-nums">{parsedAddress.number || <span className="text-muted-foreground italic">—</span>}</dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-[11px] text-muted-foreground">Bairro</dt>
                                <dd>{parsedAddress.neighborhood || <span className="text-muted-foreground italic">—</span>}</dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-[11px] text-muted-foreground">Complemento</dt>
                                <dd>{parsedAddress.complement || <span className="text-muted-foreground italic">—</span>}</dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-[11px] text-muted-foreground">Cidade</dt>
                                <dd>{parsedAddress.city || <span className="text-muted-foreground italic">—</span>}</dd>
                              </div>
                              <div>
                                <dt className="text-[11px] text-muted-foreground">UF</dt>
                                <dd className="tabular-nums">{parsedAddress.state || <span className="text-muted-foreground italic">—</span>}</dd>
                              </div>
                              <div>
                                <dt className="text-[11px] text-muted-foreground">CEP</dt>
                                <dd className="tabular-nums">{parsedAddress.postal_code || <span className="text-muted-foreground italic">—</span>}</dd>
                              </div>
                            </dl>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-border" />

                      {/* Encomenda */}
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" /> Encomenda
                        </h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {event.order_number && (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-muted-foreground">Pedido</dt>
                              <dd className="font-mono font-medium">#{String(event.order_number).padStart(4, "0")}</dd>
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-muted-foreground">Título</dt>
                            <dd className="font-medium">{event.title}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Compra</dt>
                            <dd>{compraFmt || <span className="text-muted-foreground italic">—</span>}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground flex items-center gap-1"><Hammer className="w-3 h-3" /> Produção</dt>
                            <dd>{prodFmt || <span className="text-muted-foreground italic">—</span>}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Entrega</dt>
                            <dd>{entregaFmt || <span className="text-destructive italic">Pendente</span>}</dd>
                          </div>
                        </dl>

                        <div className="mt-2">
                          <OrderItemsBreakdown
                            items={items}
                            shipping={explicitShippingValue}
                            orderTotal={eventValor || null}
                            carrier={event.shipping_carrier || null}
                          />
                        </div>
                      </div>

                      <div className="border-t border-border" />

                      {/* Pagamento e status */}
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" /> Pagamento & Status
                        </h4>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">Valor total</dt>
                            <dd className="font-semibold tabular-nums text-base">{valorFmt}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Forma de pagamento</dt>
                            <dd>{pagamentoFmt || <span className="text-muted-foreground italic">—</span>}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-xs text-muted-foreground">Status</dt>
                            <dd>
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                                status.pillClass,
                              )}>
                                {status.label}
                              </span>
                            </dd>
                          </div>
                          {event.notes && (
                            <div className="col-span-2">
                              <dt className="text-xs text-muted-foreground">Observações</dt>
                              <dd className="whitespace-pre-wrap text-sm">{event.notes}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-4 pt-4 border-t border-border/60 flex justify-end gap-2">
                  {onEdit && event.tipo !== "lembrete" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        onEdit(event);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                    Fechar
                  </Button>
                </div>
              </>
            );
          })()
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
