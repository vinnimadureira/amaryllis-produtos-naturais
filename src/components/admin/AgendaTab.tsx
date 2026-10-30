import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OriginBadge, getOrderOrigin } from "./orderOrigin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, CalendarDays, Clock, User, Trash2, Pencil, MessageCircle,
  Truck, Bell, Hammer, MapPin, DollarSign, List, CalendarRange, X, Zap, Search, AlertTriangle, CreditCard, CalendarIcon, Package, ClipboardCheck, Mail, Phone, Printer, FileText, Cake,
} from "lucide-react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, differenceInCalendarDays, addDays, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logActivity } from "./ActivityLogsTab";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TIPO_TOKENS, STATUS_TOKENS, TIPO_LIST, STATUS_LIST,
  type Tipo as TipoT, type Status as StatusT,
} from "./agendaTokens";
import AgendaClientAutocomplete from "./AgendaClientAutocomplete";
import EventDetailDialog from "./EventDetailDialog";
import ClientReadFields from "./ClientReadFields";
import OrderItemsBreakdown from "./OrderItemsBreakdown";

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
  customer_order_id?: string | null;
  mp_payment_method?: string | null;
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email?: string | null;
  address?: string | null;
  birthday?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  complement?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
}

interface ProductOption { id: string; name: string; price: number; }

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

interface EventItem {
  produto: string;
  produto_id: string;
  unit_price: string;
  quantidade: string;
}

const emptyItem = (): EventItem => ({ produto: "", produto_id: "", unit_price: "", quantidade: "1" });

const emptyForm = {
  title: "",
  notes: "",
  prod_start_date: "",
  prod_end_date: "",
  delivery_date: "",
  delivery_time: "09:00",
  status: "pendente",
  client_id: "",
  client_name: "",
  items: [emptyItem()] as EventItem[],
  endereco: "",
  phone: "",
  email: "",
  valor: "",
  payment_method: "",
};

// Soma preço × quantidade dos itens com preço definido. Itens sem preço (personalizados)
// não entram no total automático — usuário complementa manualmente no campo Valor.
const computeTotal = (items: EventItem[]) =>
  items.reduce((acc, it) => {
    const qty = Math.max(1, Number(it.quantidade) || 1);
    const price = Number(it.unit_price) || 0;
    return acc + price * qty;
  }, 0);

// Serializa a lista para o campo `produto` (texto):
//   "2× Caixa Rosa @ 19.90 | 1× Kit Vela @ 50.00"
// O sufixo "@ <preço>" é opcional e só aparece quando há preço unitário.
const normalizeProductName = (value: string) =>
  value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");

const serializeItems = (items: EventItem[], catalog: ProductOption[] = []) =>
  items
    .filter((it) => it.produto.trim())
    .map((it) => {
      const qty = Math.max(1, Number(it.quantidade) || 1);
      const name = it.produto.trim();
      const catalogPrice = catalog.find((p) => normalizeProductName(p.name) === normalizeProductName(name))?.price;
      const price = Number(it.unit_price) > 0 ? Number(it.unit_price) : Number(catalogPrice);
      const head = `${qty}× ${name}`;
      return Number.isFinite(price) && price > 0 ? `${head} @ ${price.toFixed(2)}` : head;
    })
    .join(" | ");

// Deserializa o texto do campo `produto` ("2× Caixa Rosa | 1× Kit Vela") em itens estruturados.
// Quando o nome bate com um produto do catálogo, recupera o preço para auto-cálculo.
// Marca usada nas notas de client_purchases / client_messages para identificar
// registros gerados automaticamente a partir de um evento da agenda.
const eventTag = (eventId: string) => `[evento:${eventId}]`;

// Sincroniza uma linha em client_purchases com o evento atual.
// Estratégia simples e idempotente: remove qualquer registro anterior marcado
// com a tag do evento e re-insere se houver client_id + valor.
const syncPurchaseFromEvent = async (
  eventId: string,
  data: {
    client_id: string | null;
    valor: number | null;
    produto: string | null;
    scheduled_date: string;
    payment_method: string | null;
  },
) => {
  const tag = eventTag(eventId);
  // Remove registro automático anterior vinculado a este evento (FK + fallback por tag)
  await supabase.from("client_purchases").delete().eq("agenda_event_id", eventId);
  await supabase.from("client_purchases").delete().like("notes", `${tag}%`);
  if (!data.client_id || !data.valor || data.valor <= 0) return;
  const purchaseDate = data.scheduled_date.slice(0, 10);
  const noteParts = [tag];
  if (data.payment_method) noteParts.push(`Pagamento: ${data.payment_method}`);
  await supabase.from("client_purchases").insert({
    client_id: data.client_id,
    agenda_event_id: eventId,
    purchase_date: purchaseDate,
    product: data.produto || "Encomenda",
    amount: data.valor,
    notes: noteParts.join(" · "),
  });
};

// Remove a compra automática quando o evento é excluído.
// Obs.: a FK ON DELETE CASCADE já cuida disso no banco — mantido como fallback.
const removePurchaseFromEvent = async (eventId: string) => {
  await supabase.from("client_purchases").delete().eq("agenda_event_id", eventId);
};

const parseItems = (
  raw: string | null | undefined,
  catalog: { id: string; name: string; price: number }[],
): EventItem[] => {
  if (!raw || !raw.trim()) return [emptyItem()];
  // Aceita "|" (cadastro manual) e " • " (gerado por sync_order_to_agenda do site)
  const parts = raw.split(/\s*[|•]\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return [emptyItem()];
  return parts.map((part) => {
    // Captura preço opcional " @ <num>" ao final
    const priceMatch = part.match(/^(.*?)\s*@\s*([\d]+(?:[.,]\d+)?)\s*$/);
    const head = (priceMatch ? priceMatch[1] : part).trim();
    const inlinePrice = priceMatch ? Number(priceMatch[2].replace(",", ".")) : NaN;
    const m = head.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    const qty = m ? m[1] : "1";
    const name = m ? m[2].trim() : head;
    const match = catalog.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const unit = Number.isFinite(inlinePrice)
      ? String(inlinePrice)
      : (match ? String(match.price || 0) : "");
    return {
      produto: name,
      produto_id: match?.id || "",
      unit_price: unit,
      quantidade: qty,
    };
  });
};

const AgendaTab = () => {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showFullMonth, setShowFullMonth] = useState(false);
  const [viewMode, setViewMode] = useState<"calendario" | "lista">("calendario");
  const [tipoFilter, setTipoFilter] = useState<Tipo | "todos">("todos");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [onlyEmProducao, setOnlyEmProducao] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIsSite, setEditingIsSite] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ id: string; status: "entregue" | "cancelado" } | null>(null);
  const [viewingEvent, setViewingEvent] = useState<AgendaEvent | null>(null);
  const [prodStartOpen, setProdStartOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  // ---- Frete (Melhor Envio) ----
  type ShippingOption = {
    id: number;
    name: string;
    company: string;
    companyLogo: string | null;
    priceCents: number;
    deliveryDays: number | null;
  };
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<string>(""); // editável pelo usuário
  const [shippingFree, setShippingFree] = useState(false); // isentar frete
  const [shippingCarrier, setShippingCarrier] = useState<string>(""); // nome da transportadora salvo

  // ---- Autocomplete de produtos (limit 5) ----
  const [productSuggestIdx, setProductSuggestIdx] = useState<number | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ["agenda-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_events")
        .select("*")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return (data || []) as AgendaEvent[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["agenda-clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, email, address, birthday, street, number, neighborhood, complement, city, state, cep")
        .order("name");
      if (error) throw error;
      return (data || []) as Client[];
    },
  });

  const { data: productLeadDays = 5 } = useQuery({
    queryKey: ["production-lead-days"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "production_lead_days")
        .maybeSingle();
      const n = parseInt(data?.value ?? "5", 10);
      return Number.isFinite(n) && n > 0 ? n : 5;
    },
  });

  const addBusinessDays = (start: Date, days: number): Date => {
    const d = new Date(start);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return d;
  };

  const { data: productOptions = [] } = useQuery({
    queryKey: ["agenda-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as ProductOption[];
    },
  });

  const clientMap = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients]);

  const filteredEvents = useMemo(
    () => {
      const now = new Date();
      const finalStatuses = ["entregue", "cancelado", "pronto"];
      return events.filter(e => {
        if (onlyEmProducao) return e.status === "em_producao";
        if (onlyOverdue) {
          if (finalStatuses.includes(e.status)) return false;
          const deadline = e.end_date ? parseISO(e.end_date) : parseISO(e.scheduled_date);
          if (deadline >= now) return false;
        }
        if (tipoFilter !== "todos" && e.tipo !== tipoFilter) return false;
        if (statusFilter.size > 0 && !statusFilter.has(e.status)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const onlyDigits = q.replace(/\D/g, "");
          const client = e.client_id ? clientMap[e.client_id] : null;
          const clientName = e.client_name || client?.name || "";
          const clientPhone = client?.phone || "";
          const clientPhoneDigits = clientPhone.replace(/\D/g, "");
          const haystack = `${clientName} ${clientPhone} ${e.title} ${e.produto || ""} ${e.endereco || ""}`.toLowerCase();
          const matchesText = haystack.includes(q);
          const matchesPhone = onlyDigits.length >= 3 && clientPhoneDigits.includes(onlyDigits);
          if (!matchesText && !matchesPhone) return false;
        }
        return true;
      });
    },
    [events, tipoFilter, statusFilter, onlyEmProducao, onlyOverdue, searchQuery, clientMap]
  );

  const emProducaoCount = useMemo(
    () => events.filter(e => e.status === "em_producao").length,
    [events]
  );

  const dayEvents = useMemo(
    () => showFullMonth
      ? filteredEvents.filter(e => isSameMonth(parseISO(e.scheduled_date), selectedDate))
      : filteredEvents.filter(e => isSameDay(parseISO(e.scheduled_date), selectedDate)),
    [filteredEvents, selectedDate, showFullMonth]
  );

  const dayInfo = useMemo(() => {
    const map = new Map<string, { types: Set<Tipo>; statuses: Set<string>; count: number }>();
    filteredEvents.forEach(e => {
      const key = format(parseISO(e.scheduled_date), "yyyy-MM-dd");
      const cur = map.get(key) || { types: new Set<Tipo>(), statuses: new Set<string>(), count: 0 };
      cur.types.add(e.tipo);
      cur.statuses.add(e.status);
      cur.count += 1;
      map.set(key, cur);
    });
    return map;
  }, [filteredEvents]);

  const datesWithEvents = useMemo(() => {
    const map = new Map<string, Tipo[]>();
    dayInfo.forEach((v, k) => map.set(k, Array.from(v.types)));
    return map;
  }, [dayInfo]);

  const statusPriority: Record<string, number> = {
    cancelado: 0, entregue: 1, pronto: 2, confirmado: 3, em_producao: 4, pendente: 5,
  };
  const dayStatusRing = useMemo(() => {
    const map = new Map<string, string>();
    dayInfo.forEach((v, k) => {
      let top = "pendente"; let topP = -1;
      v.statuses.forEach(s => {
        const p = statusPriority[s] ?? 0;
        if (p > topP) { topP = p; top = s; }
      });
      map.set(k, top);
    });
    return map;
  }, [dayInfo]);

  const producaoRanges = useMemo(() => {
    const start = new Set<string>();
    const middle = new Set<string>();
    const end = new Set<string>();
    filteredEvents.forEach(e => {
      if (e.tipo !== "producao" || !e.end_date) return;
      const s = parseISO(e.scheduled_date);
      const en = parseISO(e.end_date);
      const diff = differenceInCalendarDays(en, s);
      if (diff <= 0) return;
      start.add(format(s, "yyyy-MM-dd"));
      end.add(format(en, "yyyy-MM-dd"));
      for (let i = 1; i < diff; i++) {
        middle.add(format(addDays(s, i), "yyyy-MM-dd"));
      }
    });
    return { start, middle, end };
  }, [filteredEvents]);

  const monthStats = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const inMonth = filteredEvents.filter(e => {
      const d = parseISO(e.scheduled_date);
      return d >= start && d <= end;
    });
    return {
      total: inMonth.length,
      entregas: inMonth.filter(e => e.tipo === "entrega").length,
      lembretes: inMonth.filter(e => e.tipo === "lembrete").length,
      producao: inMonth.filter(e => e.tipo === "producao").length,
    };
  }, [filteredEvents, selectedDate]);

  const overdueCount = useMemo(() => {
    const now = new Date();
    return events.filter(e => {
      if (e.status === "entregue" || e.status === "cancelado" || e.status === "pronto") return false;
      const deadline = e.end_date ? parseISO(e.end_date) : parseISO(e.scheduled_date);
      return deadline < now;
    }).length;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter(e => parseISO(e.scheduled_date) >= now && e.status !== "cancelado" && e.status !== "entregue")
      .slice(0, 30);
  }, [filteredEvents]);

  // Computa a data de produção (início) a partir do form: se preenchida usa-a;
  // caso contrário, usa a data de entrega como anchor para o calendário/listas.
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validações de data — mensagens claras antes de qualquer chamada ao backend.
      if (!form.delivery_date) {
        throw new Error("Informe a Data de Entrega.");
      }
      if (form.prod_start_date && form.delivery_date && form.delivery_date < form.prod_start_date) {
        throw new Error("A Data de Entrega deve ser igual ou posterior à Data de Produção.");
      }
      // Validação dos dados do cliente (somente quando um cliente foi selecionado).
      if (form.client_id) {
        const missing: string[] = [];
        if (!form.client_name.trim()) missing.push("Nome");
        if (!form.phone.trim()) missing.push("WhatsApp/Telefone");
        if (!form.email.trim()) missing.push("E-mail");
        if (missing.length > 0) {
          throw new Error(
            `Preencha os dados do cliente antes de salvar: ${missing.join(", ")}.`,
          );
        }
      }
      // Pelo menos um item com nome preenchido.
      if (form.items.filter((it) => it.produto.trim()).length === 0) {
        throw new Error("Adicione ao menos um produto/encomenda ao evento.");
      }
      const deliveryISO = new Date(`${form.delivery_date}T${form.delivery_time || "09:00"}:00`);

      const prodStartISO = form.prod_start_date
        ? new Date(`${form.prod_start_date}T08:00:00`)
        : null;
      const prodEndISO = form.prod_end_date
        ? new Date(`${form.prod_end_date}T18:00:00`)
        : null;

      // Mantém o tipo original em modo edição; novos eventos são sempre 'entrega'.
      const editingTipo: Tipo =
        editingId
          ? (events.find((e) => e.id === editingId)?.tipo as Tipo) || "entrega"
          : "entrega";

      // scheduled_date = data principal exibida no calendário.
      // Para 'entrega' usamos a data de entrega; para 'producao' (legado) usamos prod start se existir.
      const scheduledISO =
        editingTipo === "producao" && prodStartISO ? prodStartISO : deliveryISO;

      const payload = {
        tipo: editingTipo,
        title: form.title || "Encomenda",
        description: null as string | null,
        notes: form.notes || null,
        scheduled_date: scheduledISO.toISOString(),
        // end_date sempre = data de entrega. A UI não expõe um campo separado de "fim da produção";
        // production_start_date marca o início e a entrega marca o fim do ciclo do pedido.
        end_date: deliveryISO.toISOString(),
        production_start_date: prodStartISO ? prodStartISO.toISOString() : null,
        status: form.status,
        client_id: form.client_id || null,
        client_name: form.client_name || null,
        produto: serializeItems(form.items, productOptions) || null,
        endereco: form.endereco || null,
        phone: form.phone || null,
        email: form.email || null,
        valor: Number(form.valor) || 0,
        payment_method: form.payment_method || null,
        shipping_carrier: shippingFree
          ? "Frete grátis"
          : (shippingCarrier && Number(shippingCost) > 0 ? shippingCarrier : null),
      };

      if (editingId) {
        // Para pedidos vindos do site, só permite alterar datas e status —
        // produtos, valor, frete, pagamento e dados do cliente são imutáveis aqui.
        const original = events.find((e) => e.id === editingId);
        const isSiteEdit = !!original?.customer_order_id;
        const updatePayload = isSiteEdit
          ? {
              scheduled_date: payload.scheduled_date,
              end_date: payload.end_date,
              production_start_date: payload.production_start_date,
              status: payload.status,
            }
          : payload;
        const { error } = await supabase.from("agenda_events").update(updatePayload).eq("id", editingId);
        if (error) throw error;
        // Sincroniza compra do cliente (atualiza/cria/remove conforme dados atuais)
        await syncPurchaseFromEvent(editingId, {
          client_id: payload.client_id,
          valor: payload.valor,
          produto: payload.produto,
          scheduled_date: payload.scheduled_date,
          payment_method: payload.payment_method,
        });
      } else {
        const { data: inserted, error } = await supabase
          .from("agenda_events")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;

        // Registra a compra atrelada ao evento recém-criado
        if (inserted?.id) {
          await syncPurchaseFromEvent(inserted.id, {
            client_id: payload.client_id,
            valor: payload.valor,
            produto: payload.produto,
            scheduled_date: payload.scheduled_date,
            payment_method: payload.payment_method,
          });
        }

        // Lembrete automático: 1 dia antes da entrega às 09:00.
        // Só cria se a data de entrega for daqui >= 1 dia.
        const reminderDate = new Date(deliveryISO);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(9, 0, 0, 0);
        const now = new Date();
        if (reminderDate > now && inserted?.id) {
          await supabase.from("agenda_events").insert({
            tipo: "lembrete",
            title: `Lembrete: ${payload.title}`,
            description: `Entrega prevista para ${format(deliveryISO, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
            notes: form.notes || null,
            scheduled_date: reminderDate.toISOString(),
            end_date: reminderDate.toISOString(),
            status: "pendente",
            client_id: form.client_id || null,
            client_name: form.client_name || null,
            produto: serializeItems(form.items, productOptions) || null,
            endereco: form.endereco || null,
            phone: form.phone || null,
            email: form.email || null,
            valor: 0,
            parent_event_id: inserted.id,
          } as any);
        }
      }
      return { isNew: !editingId };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["agenda-events"] });
      qc.invalidateQueries({ queryKey: ["dashboard-agenda-events"] });
      qc.invalidateQueries({ queryKey: ["client-purchases"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-clients-totals"] });
      setDialogOpen(false);
      setEditingId(null);
      setEditingIsSite(false);
      setForm(emptyForm);
      toast.success(r.isNew ? "Evento criado! Lembrete automático agendado." : "Evento atualizado!");
      logActivity(r.isNew ? "Criou evento na agenda" : "Editou evento da agenda", "agenda_event");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // O banco cuida de tudo via FK ON DELETE CASCADE:
      // - lembretes (agenda_events.parent_event_id)
      // - histórico automático (client_purchases.agenda_event_id)
      const { error } = await supabase.from("agenda_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-events"] });
      qc.invalidateQueries({ queryKey: ["dashboard-agenda-events"] });
      qc.invalidateQueries({ queryKey: ["client-purchases"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-clients-totals"] });
      toast.success("Evento excluído!");
      logActivity("Excluiu evento da agenda", "agenda_event");
    },
    onError: (e: Error) => {
      const msg = String(e?.message || "");
      const friendly = msg.includes("Não é possível excluir esta agenda")
        ? msg
        : "Não é possível excluir esta agenda: existe pedido vinculado. Exclua o pedido primeiro.";
      toast.error(friendly);
    },
  });


  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agenda_events").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-events"] });
      qc.invalidateQueries({ queryKey: ["dashboard-agenda-events"] });
      toast.success("Status atualizado!");
    },
  });

  const requestStatusChange = (id: string, status: string) => {
    if (status === "entregue" || status === "cancelado") {
      setPendingStatus({ id, status: status as "entregue" | "cancelado" });
      return;
    }
    statusMutation.mutate({ id, status });
  };

  const openNew = (_date?: Date, _tipo?: Tipo) => {
    setEditingId(null);
    setEditingIsSite(false);
    const start = _date ? new Date(_date) : new Date();
    const delivery = addBusinessDays(start, productLeadDays);
    setForm({
      ...emptyForm,
      prod_start_date: format(start, "yyyy-MM-dd"),
      delivery_date: format(delivery, "yyyy-MM-dd"),
    });
    setShippingOptions([]);
    setSelectedShippingId(null);
    setShippingError(null);
    setShippingCost("");
    setShippingFree(false);
    setShippingCarrier("");
    setDialogOpen(true);
  };

  const openEdit = async (e: AgendaEvent) => {
    const d = parseISO(e.scheduled_date);
    const end = e.end_date ? parseISO(e.end_date) : d;
    const prodStart = e.production_start_date
      ? parseISO(e.production_start_date)
      : (e.tipo === "producao" ? d : null);
    const prodEnd = e.tipo === "producao" || e.production_start_date ? end : null;
    const deliveryD = e.tipo === "producao"
      ? (e.end_date ? parseISO(e.end_date) : d)
      : d;

    setEditingId(e.id);
    setEditingIsSite(!!e.customer_order_id);

    // Para pedidos do site, hidrata itens/frete/pagamento a partir de customer_orders
    // (o campo agenda_events.produto pode estar vazio em registros legados).
    let parsedItems = parseItems(e.produto, productOptions);
    let inferredShipping = 0;
    let inferredCarrier = e.shipping_carrier || "";
    let inferredPaymentMethod = e.payment_method || "";
    let inferredValor = e.valor ? String(e.valor) : "";
    let isFreeShipping = false;
    const isSite = !!e.customer_order_id;

    if (isSite && e.customer_order_id) {
      const { data: order } = await supabase
        .from("customer_orders")
        .select("subtotal_cents, shipping_cents, discount_cents, total_cents, metadata")
        .eq("id", e.customer_order_id)
        .maybeSingle();
      const { data: items } = await supabase
        .from("customer_order_items")
        .select("product_name, quantity, unit_price_cents")
        .eq("order_id", e.customer_order_id)
        .order("created_at", { ascending: true });

      if (items && items.length) {
        parsedItems = items.map((it) => {
          const name = it.product_name || "";
          const match = productOptions.find(
            (p) => p.name.toLowerCase() === name.toLowerCase(),
          );
          const unit = ((it.unit_price_cents ?? 0) / 100).toFixed(2);
          return {
            produto: name,
            produto_id: match?.id || "",
            unit_price: unit,
            quantidade: String(it.quantity ?? 1),
          };
        });
      }
      if (order) {
        const ship = (order.shipping_cents ?? 0) / 100;
        const total = (order.total_cents ?? 0) / 100;
        inferredShipping = ship;
        isFreeShipping = ship === 0;
        if (total > 0) inferredValor = total.toFixed(2);
        const md = (order.metadata as Record<string, unknown> | null) || {};
        inferredCarrier = inferredCarrier || (md.shipping_label as string) || "";
      }
      // Mapeia método MP -> PAYMENT_METHODS conhecido
      if (!inferredPaymentMethod) {
        const map: Record<string, string> = {
          pix: "pix",
          credit_card: "cartao_credito",
          debit_card: "cartao_debito",
          ticket: "outro",
          bank_transfer: "transferencia",
          account_money: "outro",
        };
        inferredPaymentMethod = map[e.mp_payment_method || ""] || "outro";
      }
    }

    setForm({
      title: e.title || "",
      notes: e.notes || "",
      prod_start_date: prodStart ? format(prodStart, "yyyy-MM-dd") : "",
      prod_end_date: prodEnd ? format(prodEnd, "yyyy-MM-dd") : "",
      delivery_date: format(deliveryD, "yyyy-MM-dd"),
      delivery_time: format(deliveryD, "HH:mm"),
      status: e.status,
      client_id: e.client_id || "",
      client_name: e.client_name || (e.client_id ? clientMap[e.client_id]?.name : "") || "",
      items: parsedItems,
      endereco: e.endereco || "",
      phone: e.phone || (e.client_id ? clientMap[e.client_id]?.phone || "" : ""),
      email: e.email || (e.client_id ? clientMap[e.client_id]?.email || "" : ""),
      valor: inferredValor,
      payment_method: inferredPaymentMethod,
    });
    setShippingOptions([]);
    setSelectedShippingId(null);
    if (isSite) {
      setShippingFree(isFreeShipping);
      setShippingCost(isFreeShipping ? "0" : (inferredShipping > 0 ? inferredShipping.toFixed(2) : ""));
      setShippingCarrier(inferredCarrier);
    } else {
      // Cadastro manual: infere frete a partir de (valor − total dos itens)
      const orderTotal = Number(e.valor) || 0;
      const itemsTotal = computeTotal(parsedItems);
      const isFree = itemsTotal > 0 && Math.abs(orderTotal - itemsTotal) < 0.01;
      const inferred = isFree ? 0 : Math.max(0, orderTotal - itemsTotal);
      setShippingFree(isFree);
      setShippingCost(isFree ? "0" : inferred > 0 ? inferred.toFixed(2) : "");
      setShippingCarrier(e.shipping_carrier || "");
    }
    setDialogOpen(true);
  };

  const buildWhatsAppLink = (e: AgendaEvent) => {
    const client = e.client_id ? clientMap[e.client_id] : null;
    const rawPhone = e.phone || client?.phone || "";
    const phone = rawPhone.replace(/\D/g, "");
    const name = e.client_name || client?.name;
    if (!phone || !name) return null;
    const d = parseISO(e.scheduled_date);
    const dateF = format(d, "dd/MM/yyyy", { locale: ptBR });
    const timeF = format(d, "HH:mm");
    const produto = e.produto || e.title;
    const enderecoLine = e.endereco ? `\n📍 Endereço: ${e.endereco}` : "";

    // Mensagem personalizada por STATUS (prioritário sobre tipo)
    let msg = "";
    switch (e.status) {
      case "confirmado":
        msg = `Olá ${name}! 👋\n\nSeu pedido na *7S Soluções* foi *confirmado* com sucesso! ✅\n\n🧾 Produto: ${produto}\n📅 Data: ${dateF}\n🕐 Horário: ${timeF}${enderecoLine}\n\nJá entramos na fila de produção. Qualquer dúvida, é só chamar!`;
        break;
      case "em_producao":
        msg = `Olá ${name}! 👋\n\nSeu pedido já está *em produção* aqui na *7S Soluções*. 🖨️\n\n🧾 Produto: ${produto}\n📅 Entrega prevista: ${dateF} às ${timeF}\n\nEstamos cuidando de cada detalhe com precisão. ⚙️`;
        break;
      case "pronto":
        msg = `Olá ${name}! 👋\n\nSeu pedido já está *pronto* na *7S Soluções*! ✅\n\n🧾 Produto: ${produto}\n📅 Retirada/Entrega: ${dateF} às ${timeF}${enderecoLine}\n\nFicamos no aguardo!`;
        break;
      case "entregue":
        msg = `Olá ${name}! 👋\n\nObrigado por escolher a *7S Soluções*!\n\n🧾 ${produto}\n📅 ${dateF}\n\nEsperamos que o resultado tenha atendido às suas expectativas. Se puder, deixe um depoimento — sua opinião é muito importante para nós. ⭐`;
        break;
      case "cancelado":
        msg = `Olá ${name},\n\nPassando aqui da *7S Soluções* sobre o seu pedido:\n\n🧾 ${produto}\n📅 ${dateF}\n\nInfelizmente este pedido foi *cancelado*. Caso queira remarcar ou tirar qualquer dúvida, estamos à disposição.`;
        break;
      default:
        // Status "pendente" → mensagem segue o tipo do evento
        if (e.tipo === "entrega") {
          msg = `Olá ${name}! 👋\n\nSeu pedido na *7S Soluções* está agendado:\n\n🧾 Produto: ${produto}\n📅 Data: ${dateF}\n🕐 Horário: ${timeF}${enderecoLine}\n\nQualquer dúvida, é só chamar!`;
        } else if (e.tipo === "lembrete") {
          msg = `Olá ${name}! 👋\n\nPassando aqui da *7S Soluções* com um lembrete: ${e.title}${e.description ? `\n\n${e.description}` : ""}\n\nPosso preparar um orçamento para você? 🛠️`;
        } else {
          msg = `Olá ${name}! 👋\n\nAtualização do seu pedido na *7S Soluções*:\n\n🧾 ${produto}\n📅 Previsão: ${dateF}\n\nEstamos cuidando de cada detalhe com precisão. ⚙️`;
        }
    }
    return `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`;
  };

  // Registra mensagem em client_messages quando admin envia WhatsApp.
  // Não bloqueia o envio caso falhe — fluxo do admin continua.
  const logWhatsAppMessage = async (e: AgendaEvent) => {
    if (!e.client_id) return;
    const statusLabel = statusConfig[e.status]?.label || e.status;
    const summary = `[${statusLabel}] ${e.title}${e.produto ? ` — ${e.produto}` : ""}`.slice(0, 500);
    try {
      await supabase.from("client_messages").insert({
        client_id: e.client_id,
        channel: "whatsapp",
        summary: `${eventTag(e.id)} ${summary}`,
      });
      qc.invalidateQueries({ queryKey: ["client-messages", e.client_id] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    } catch {
      // silencioso
    }
  };

  // Abre a página pública da OS em nova aba e dispara a impressão automaticamente.
  const printOrdemServico = (e: AgendaEvent) => {
    const url = `${window.location.origin}/os/${e.id}?print=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Monta uma mensagem com o link público da OS e abre o WhatsApp do cliente.
  const sendOSWhatsApp = (e: AgendaEvent) => {
    const client = e.client_id ? clientMap[e.client_id] : null;
    const rawPhone = e.phone || client?.phone || "";
    const phone = rawPhone.replace(/\D/g, "");
    const name = e.client_name || client?.name || "";
    if (!phone || !name) {
      toast.error("Cliente sem telefone cadastrado para envio.");
      return;
    }
    const osNum = e.id.substring(0, 8).toUpperCase();
    const osUrl = `${window.location.origin}/os/${e.id}`;
    const isConcluido = e.status === "entregue" || e.status === "concluido";
    const firstName = name.split(" ")[0];

    const msg = isConcluido
      ? `Olá ${firstName}! 👋\n\nAqui é da *7S Soluções* 🖨️\n\nSua *Ordem de Serviço #${osNum}* foi finalizada. Você pode conferir todos os detalhes no link abaixo:\n\n📄 ${osUrl}\n\nAgradecemos pela preferência! Se puder, deixe um depoimento — sua opinião é muito importante para nós. ⭐`
      : `Olá ${firstName}! 👋\n\nAqui é da *7S Soluções* 🖨️\n\nPreparei sua *Ordem de Serviço #${osNum}* com todos os detalhes do pedido. É só clicar no link abaixo para visualizar:\n\n📄 ${osUrl}\n\nQualquer dúvida, estou à disposição!`;

    const link = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`;
    window.open(link, "_blank", "noopener,noreferrer");
    toast.success("OS enviada pelo WhatsApp!");
    // Loga a mensagem no histórico do cliente
    logWhatsAppMessage(e);
  };
  // Retorna a primeira mensagem de erro encontrada, ou null se válido.
  const getEventBlockReason = (e: AgendaEvent): string | null => {
    const start = e.production_start_date ? parseISO(e.production_start_date) : null;
    const delivery = parseISO(e.scheduled_date);
    if (start && delivery < start) {
      return "Data de Entrega anterior à Data de Produção.";
    }
    // Pedidos do site não preenchem o campo `produto` na agenda (itens vivem em customer_orders),
    // então não bloqueamos o WhatsApp por isso — basta haver cliente com telefone (validado no envio).
    return null;
  };

  // ===== Validações derivadas do formulário (recalculadas a cada render) =====
  const dateDeliveryInvalid =
    !!form.prod_start_date && !!form.delivery_date && form.delivery_date < form.prod_start_date;
  const hasDateError = dateDeliveryInvalid;
  const itemsTotal = computeTotal(form.items);
  const valorFinal = Number(form.valor) || itemsTotal;

  // Validação de cliente: quando um cliente é selecionado, nome/telefone/e-mail são obrigatórios.
  const clientMissingFields = form.client_id
    ? [
        !form.client_name.trim() && "Nome",
        !form.phone.trim() && "WhatsApp/Telefone",
        !form.email.trim() && "E-mail",
      ].filter(Boolean) as string[]
    : [];
  const clientHasError = clientMissingFields.length > 0;
  const noItems = form.items.filter((it) => it.produto.trim()).length === 0;

  // Carrega frete via Melhor Envio com base no CEP do cliente selecionado e nos itens do catálogo.
  // `preserveCost` mantém o valor de frete já preenchido (usado ao abrir edição) e apenas
  // marca como selecionada a opção cujo preço bate com o valor atual.
  const loadShipping = async (
    preserveCost = false,
    override?: {
      clientId?: string;
      items?: typeof form.items;
      currentCost?: string;
      currentCarrier?: string;
    },
  ) => {
    const clientId = override?.clientId ?? form.client_id;
    const itemsSource = override?.items ?? form.items;
    const costSource = override?.currentCost ?? shippingCost;
    const carrierSource = override?.currentCarrier ?? shippingCarrier;
    if (!clientId) return;
    const cepDigits = (clientMap[clientId]?.cep || "").replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      setShippingError("Cliente sem CEP cadastrado.");
      setShippingOptions([]);
      setSelectedShippingId(null);
      return;
    }
    const catalogItems = itemsSource
      .filter((i) => i.produto_id)
      .map((i) => ({ id: i.produto_id, quantity: Math.max(1, Number(i.quantidade) || 1) }));
    if (catalogItems.length === 0) {
      setShippingError("Adicione ao menos um produto do catálogo para calcular o frete.");
      setShippingOptions([]);
      setSelectedShippingId(null);
      return;
    }
    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedShippingId(null);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-shipping", {
        body: { cep: cepDigits, items: catalogItems },
      });
      if (error) throw new Error(error.message || "Falha ao calcular o frete");
      if ((data as any)?.error) throw new Error((data as any).error);
      const opts = ((data as any)?.options ?? []) as ShippingOption[];
      setShippingOptions(opts);
      if (opts.length > 0) {
        const carrierLabel = (o: ShippingOption) =>
          [o.company, o.name].filter(Boolean).join(" — ");
        if (preserveCost) {
          // 1) Casa pelo nome da transportadora salva (prioridade — foi o que o usuário escolheu).
          // 2) Fallback: casa pelo valor atual (centavos, tolerância 1 centavo).
          // 3) Se nada bater, não força seleção — mantém o valor manual.
          const savedCarrier = (carrierSource || "").trim().toLowerCase();
          const byCarrier = savedCarrier
            ? opts.find((o) => carrierLabel(o).toLowerCase() === savedCarrier)
            : null;
          const currentCents = Math.round((Number(costSource) || 0) * 100);
          const byPrice = !byCarrier
            ? opts.find((o) => Math.abs(o.priceCents - currentCents) <= 1)
            : null;
          const match = byCarrier || byPrice;
          if (match) {
            setSelectedShippingId(match.id);
            setShippingCarrier(carrierLabel(match));
          } else {
            setSelectedShippingId(null);
          }
        } else {
          setSelectedShippingId(opts[0].id);
          setShippingCarrier(carrierLabel(opts[0]));
          if (!shippingFree) setShippingCost((opts[0].priceCents / 100).toFixed(2));
        }
      }
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : "Falha ao calcular o frete");
    } finally {
      setShippingLoading(false);
    }
  };

  // Mantém o Valor (R$) sincronizado: total dos itens + frete (ou 0 se isento)
  const shippingValue = shippingFree ? 0 : (Number(shippingCost) || 0);
  useEffect(() => {
    const items = computeTotal(form.items);
    if (items <= 0 && shippingValue <= 0) return;
    const total = items + shippingValue;
    const next = total.toFixed(2);
    if (next !== form.valor) setForm((p) => ({ ...p, valor: next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingCost, shippingFree, form.items]);

  return (
    <div className="space-y-4">
      {/* Header com filtros e ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <TabsList>
              <TabsTrigger value="calendario" className="gap-1.5"><CalendarRange className="w-4 h-4" /> Calendário</TabsTrigger>
              <TabsTrigger value="lista" className="gap-1.5"><List className="w-4 h-4" /> Lista</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as typeof tipoFilter)} disabled={onlyEmProducao}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="entrega">📦 Entregas</SelectItem>
              <SelectItem value="producao">🛠️ Produção</SelectItem>
            </SelectContent>
          </Select>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={onlyEmProducao ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOnlyEmProducao(v => !v)}
                  className={cn(
                    "gap-1.5 h-10",
                    onlyEmProducao && "bg-teal-600 hover:bg-teal-700 text-white border-teal-600"
                  )}
                >
                  <Zap className="w-4 h-4" />
                  Em andamento
                  {emProducaoCount > 0 && (
                    <span
                      className={cn(
                        "ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold",
                        onlyEmProducao
                          ? "bg-white/25 text-white"
                          : "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                      )}
                    >
                      {emProducaoCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                Filtra por <strong>status</strong> "Em andamento", independente do tipo (Entrega, Lembrete ou Produção).
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={onlyOverdue ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOnlyOverdue(v => !v)}
                  className={cn(
                    "gap-1.5 h-10",
                    onlyOverdue && "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive"
                  )}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Atrasados
                  {overdueCount > 0 && (
                    <span
                      className={cn(
                        "ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold",
                        onlyOverdue
                          ? "bg-white/25 text-white"
                          : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {overdueCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                Eventos cuja data limite já passou e ainda não foram entregues nem cancelados — qualquer tipo.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button onClick={() => openNew()} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo evento
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar por cliente, telefone, produto ou endereço..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Status:</span>
        {(["pendente","confirmado","em_producao","pronto","entregue","cancelado"] as const).map(s => {
          const cfg = statusConfig[s];
          const active = statusFilter.has(s);
          const count = events.filter(e => e.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(prev => {
                  const next = new Set(prev);
                  if (next.has(s)) next.delete(s); else next.add(s);
                  return next;
                });
              }}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                active
                  ? cfg.pillClass + " ring-2 ring-offset-2 ring-offset-background ring-current shadow-md scale-105 font-semibold"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted",
              )}
            >
              {active && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />}
              {cfg.label}
              <span className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                active ? "bg-current/25 text-current" : "bg-background"
              )}>{count}</span>
            </button>
          );
        })}
        {statusFilter.size > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Mês atual" value={monthStats.total} icon={<CalendarDays className="w-4 h-4" />} />
        <StatCard label="Entregas" value={monthStats.entregas} icon={<Truck className="w-4 h-4 text-rose-500" />} />
        <StatCard label="Produção" value={monthStats.producao} icon={<Hammer className="w-4 h-4 text-violet-500" />} />
      </div>

      {viewMode === "calendario" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
          <Card className="shrink-0">
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                onMonthChange={(m) => setSelectedDate(m)}
                locale={ptBR}
                modifiers={{
                  hasEvent: (d) => datesWithEvents.has(format(d, "yyyy-MM-dd")),
                  prodStart: (d) => producaoRanges.start.has(format(d, "yyyy-MM-dd")),
                  prodMiddle: (d) => producaoRanges.middle.has(format(d, "yyyy-MM-dd")),
                  prodEnd: (d) => producaoRanges.end.has(format(d, "yyyy-MM-dd")),
                }}
                modifiersClassNames={{
                  hasEvent: "font-semibold",
                  prodStart: onlyEmProducao
                    ? "bg-violet-600 text-white font-bold rounded-l-md rounded-r-none ring-2 ring-violet-400 ring-inset"
                    : "bg-violet-500/15 text-violet-700 dark:text-violet-300 rounded-l-md rounded-r-none",
                  prodMiddle: onlyEmProducao
                    ? "bg-violet-600 text-white font-bold rounded-none"
                    : "bg-violet-500/15 text-violet-700 dark:text-violet-300 rounded-none",
                  prodEnd: onlyEmProducao
                    ? "bg-violet-600 text-white font-bold rounded-r-md rounded-l-none ring-2 ring-violet-400 ring-inset"
                    : "bg-violet-500/15 text-violet-700 dark:text-violet-300 rounded-r-md rounded-l-none",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const key = format(date, "yyyy-MM-dd");
                    const info = dayInfo.get(key);
                    const ringStatus = dayStatusRing.get(key);
                    const ringColor = ringStatus ? STATUS_TOKENS[ringStatus as StatusT]?.ringClass ?? "" : "";
                    // Status únicos do dia (cores conforme legenda)
                    const statusesOfDay = info
                      ? STATUS_LIST.filter(s => info.statuses.has(s))
                      : [];
                    return (
                      <div className={cn(
                        "relative flex h-9 w-9 items-center justify-center rounded-full",
                        info && "ring-2 ring-inset",
                        info && ringColor
                      )}>
                        <span className="leading-none">{date.getDate()}</span>
                        {statusesOfDay.length > 0 && (
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {statusesOfDay.slice(0, 3).map(s => (
                              <span
                                key={s}
                                className="w-1.5 h-1.5 rounded-full ring-1 ring-background"
                                style={{ backgroundColor: STATUS_TOKENS[s as StatusT].hsl }}
                                aria-label={STATUS_TOKENS[s as StatusT].label}
                              />
                            ))}
                          </div>
                        )}
                        {info && info.count > 1 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-[14px] text-center">
                            {info.count}
                          </span>
                        )}
                      </div>
                    );
                  },
                }}
                className={cn("p-3 pointer-events-auto rounded-md")}
                classNames={{
                  cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent [&:has([aria-selected].day-outside)]:bg-transparent first:[&:has([aria-selected])]:rounded-none last:[&:has([aria-selected])]:rounded-none",
                  day: cn(
                    "h-9 w-9 p-0 font-normal rounded-full inline-flex items-center justify-center transition-colors",
                    "hover:bg-accent/60 hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  ),
                  day_selected:
                    "!bg-primary !text-primary-foreground font-semibold rounded-full hover:!bg-primary hover:!text-primary-foreground focus:!bg-primary",
                  day_today: "bg-accent/40 text-accent-foreground rounded-full",
                  day_outside: "text-muted-foreground opacity-40",
                }}
              />
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                  Status
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                  {STATUS_LIST.map(s => (
                    <StatusLegend
                      key={s}
                      label={STATUS_TOKENS[s].label}
                      cls={STATUS_TOKENS[s].ringClass}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-lg font-semibold capitalize">
                    {showFullMonth
                      ? format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })
                      : format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <Button
                    type="button"
                    variant={showFullMonth ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFullMonth(v => !v)}
                    className="h-7 text-xs gap-1"
                  >
                    <CalendarRange className="w-3 h-3" />
                    {showFullMonth ? "Ver dia" : "Ver mês inteiro"}
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{dayEvents.length} evento(s)</span>
              </div>
              {dayEvents.length === 0 ? (
                <EmptyDay onCreate={() => openNew()} />
              ) : (
                <div className="space-y-2">
                  {dayEvents.map(e => (
                    <EventRow
                      key={e.id}
                      event={e}
                      onView={() => setViewingEvent(e)}
                      onEdit={() => openEdit(e)}
                      onDelete={() => setDeleteId(e.id)}
                      onStatusChange={(status) => requestStatusChange(e.id, status)}
                      whatsAppLink={buildWhatsAppLink(e)}
                      onWhatsAppSend={() => logWhatsAppMessage(e)}
                      onPrintOS={() => printOrdemServico(e)}
                      onSendOS={() => sendOSWhatsApp(e)}
                      blockReason={getEventBlockReason(e)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-serif text-lg font-semibold mb-4">Próximos eventos</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum evento agendado.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(e => (
                  <EventRow
                    key={e.id}
                    event={e}
                    showDate
                    onView={() => setViewingEvent(e)}
                    onEdit={() => openEdit(e)}
                    onDelete={() => setDeleteId(e.id)}
                    onStatusChange={(status) => requestStatusChange(e.id, status)}
                    whatsAppLink={buildWhatsAppLink(e)}
                    onWhatsAppSend={() => logWhatsAppMessage(e)}
                    onPrintOS={() => printOrdemServico(e)}
                    onSendOS={() => sendOSWhatsApp(e)}
                    blockReason={getEventBlockReason(e)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Editar evento" : "Novo evento na agenda"}
            </DialogTitle>
          </DialogHeader>

          {editingIsSite && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-0.5">Pedido feito pelo site</p>
                <p>
                  Apenas as <strong>datas de produção e entrega</strong> podem ser alteradas aqui.
                  Produtos, frete, valor e forma de pagamento são fixados pelo checkout.
                  Para alterar dados cadastrais, use o módulo <strong>Clientes</strong>.
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="cliente" className="mt-2">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="cliente" className="gap-1.5">
                <User className="w-4 h-4" /> Cliente
              </TabsTrigger>
              <TabsTrigger value="produto" className="gap-1.5">
                <Package className="w-4 h-4" /> Produto
              </TabsTrigger>
              <TabsTrigger value="resumo" className="gap-1.5">
                <ClipboardCheck className="w-4 h-4" /> Resumo
              </TabsTrigger>
            </TabsList>

            {/* ============== ABA 1: CLIENTE ============== */}
            <TabsContent value="cliente" className="space-y-3 mt-3">
              {/* d. Cliente — ao selecionar, sobrescreve endereço, telefone e e-mail */}
              <div>
                <Label>Cliente {form.client_id && <span className="text-destructive">*</span>}</Label>
                <fieldset disabled={editingIsSite} className={cn(editingIsSite && "opacity-70 pointer-events-none")}>
                <AgendaClientAutocomplete
                  clients={clients}
                  value={form.client_id}
                  selectedName={form.client_name}
                  onSelect={(id, name, c) =>
                    setForm({
                      ...form,
                      client_id: id,
                      client_name: name,
                      endereco: c?.address || "",
                      phone: c?.phone || "",
                      email: c?.email || "",
                    })
                  }
                />
                </fieldset>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {editingIsSite
                    ? "Cliente vinculado ao pedido do site. Edite os dados cadastrais no módulo Clientes."
                    : "Endereço, telefone e e-mail são preenchidos automaticamente ao selecionar o cliente."}
                </p>
              </div>

              {/* Painel de dados do cliente — sempre visível, em branco antes da seleção */}
              <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <User className="w-3.5 h-3.5" /> Dados do cliente
                </div>
                <ClientReadFields
                  alwaysShowAddressFields
                  data={{
                    name: form.client_id ? clientMap[form.client_id]?.name : null,
                    phone: form.client_id ? clientMap[form.client_id]?.phone : null,
                    email: form.client_id ? clientMap[form.client_id]?.email : null,
                    birthday: form.client_id ? clientMap[form.client_id]?.birthday : null,
                    address: form.client_id
                      ? {
                          street: clientMap[form.client_id]?.street,
                          number: clientMap[form.client_id]?.number,
                          neighborhood: clientMap[form.client_id]?.neighborhood,
                          complement: clientMap[form.client_id]?.complement,
                          city: clientMap[form.client_id]?.city,
                          state: clientMap[form.client_id]?.state,
                          cep: clientMap[form.client_id]?.cep,
                        }
                      : null,
                  }}
                />
              </div>

              {clientHasError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold mb-0.5">Dados do cliente incompletos</p>
                    <p>
                      Preencha: <strong>{clientMissingFields.join(", ")}</strong>.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ============== ABA 2: PRODUTO ============== */}
            <TabsContent value="produto" className="space-y-3 mt-3">
            {/* a. Título */}
            <div>
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Peça 3D sob medida para João"
                disabled={editingIsSite}
              />
            </div>

            {/* b. Data Produção (início e fim) com calendário */}
            <div>
              <Label className="flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-indigo-500" /> Data de Produção
                <span className="text-[10px] font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <div className="mt-1">
                <Popover open={prodStartOpen} onOpenChange={setProdStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !form.prod_start_date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.prod_start_date
                        ? format(parseISO(form.prod_start_date), "EEEE, dd/MM/yyyy", { locale: ptBR })
                        : <span>Início</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      selected={form.prod_start_date ? parseISO(form.prod_start_date) : undefined}
                      onSelect={(d) => {
                        if (!d) return;
                        const v = format(d, "yyyy-MM-dd");
                        setForm({ ...form, prod_start_date: v });
                        setProdStartOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                A data de entrega será ≥ data de início.
              </p>
            </div>

            {/* c. Data de Entrega (calendário) */}
            <div>
              <Label className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-fuchsia-500" /> Data de Entrega
                <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1">
                <Popover open={deliveryOpen} onOpenChange={setDeliveryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !form.delivery_date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.delivery_date
                        ? format(parseISO(form.delivery_date), "EEEE, dd/MM/yyyy", { locale: ptBR })
                        : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      selected={form.delivery_date ? parseISO(form.delivery_date) : undefined}
                      onSelect={(d) => {
                        if (!d) return;
                        setForm({ ...form, delivery_date: format(d, "yyyy-MM-dd") });
                        setDeliveryOpen(false);
                      }}
                      disabled={(date) => form.prod_start_date ? date < parseISO(form.prod_start_date) : false}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Validação inline das datas */}
            {hasDateError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  {dateDeliveryInvalid && (
                    <p>A <strong>Data de Entrega</strong> deve ser igual ou posterior à <strong>Data de Produção</strong>.</p>
                  )}
                </div>
              </div>
            )}

            <fieldset disabled={editingIsSite} className={cn(editingIsSite && "opacity-70")}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Produtos / Encomendas
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}
                >
                  <Plus className="w-3 h-3" /> Adicionar item
                </Button>
              </div>

              <div className="space-y-2">
                {form.items.map((item, idx) => {
                  const qtyNum = Math.max(1, Number(item.quantidade) || 1);
                  const priceNum = Number(item.unit_price) || 0;
                  const subtotal = priceNum * qtyNum;
                  return (
                    <div key={idx} className="rounded-md border border-border/60 bg-card/40 p-2 space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-7 relative">
                          <Input
                            value={item.produto}
                            onFocus={() => setProductSuggestIdx(idx)}
                            onBlur={() => setTimeout(() => setProductSuggestIdx((c) => (c === idx ? null : c)), 150)}
                            onChange={(e) => {
                              const name = e.target.value;
                              const match = productOptions.find(
                                (p) => p.name.toLowerCase() === name.toLowerCase(),
                              );
                              const nextItems = form.items.map((it, i) =>
                                i === idx
                                  ? {
                                      ...it,
                                      produto: name,
                                      produto_id: match?.id || "",
                                      unit_price: match ? String(match.price || 0) : "",
                                    }
                                  : it,
                              );
                              const total = computeTotal(nextItems);
                              setForm({ ...form, items: nextItems, valor: total ? total.toFixed(2) : form.valor });
                              setProductSuggestIdx(idx);
                            }}
                            placeholder={idx === 0 ? "Produto do catálogo ou personalizado" : "Outro produto..."}
                          />
                          {productSuggestIdx === idx && (() => {
                            const q = item.produto.trim().toLowerCase();
                            const list = productOptions
                              .filter((p) => !q || p.name.toLowerCase().includes(q))
                              .slice(0, 5);
                            if (list.length === 0) return null;
                            return (
                              <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                                {list.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent flex items-center justify-between gap-2"
                                    onMouseDown={(ev) => {
                                      ev.preventDefault();
                                      const nextItems = form.items.map((it, i) =>
                                        i === idx
                                          ? { ...it, produto: p.name, produto_id: p.id, unit_price: String(p.price || 0) }
                                          : it,
                                      );
                                      const total = computeTotal(nextItems);
                                      setForm({ ...form, items: nextItems, valor: total ? total.toFixed(2) : form.valor });
                                      setProductSuggestIdx(null);
                                    }}
                                  >
                                    <span className="truncate">{p.name}</span>
                                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                      R$ {Number(p.price || 0).toFixed(2).replace(".", ",")}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        <Input
                          className="col-span-2"
                          type="number"
                          min={1}
                          step={1}
                          value={item.quantidade}
                          onChange={(e) => {
                            const qty = Math.max(1, Number(e.target.value) || 1);
                            const nextItems = form.items.map((it, i) =>
                              i === idx ? { ...it, quantidade: String(qty) } : it,
                            );
                            const total = computeTotal(nextItems);
                            setForm({ ...form, items: nextItems, valor: total ? total.toFixed(2) : form.valor });
                          }}
                          aria-label="Quantidade"
                          title="Quantidade"
                        />
                        <Input
                          className="col-span-2"
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.unit_price}
                          onChange={(e) => {
                            const v = e.target.value;
                            const nextItems = form.items.map((it, i) =>
                              i === idx ? { ...it, unit_price: v, produto_id: "" } : it,
                            );
                            const total = computeTotal(nextItems);
                            setForm({ ...form, items: nextItems, valor: total ? total.toFixed(2) : form.valor });
                          }}
                          placeholder="Preço un."
                          aria-label="Preço unitário"
                          title="Preço unitário (R$)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="col-span-1 h-10 w-10 text-muted-foreground hover:text-destructive"
                          disabled={form.items.length === 1}
                          onClick={() => {
                            const nextItems = form.items.filter((_, i) => i !== idx);
                            const total = computeTotal(nextItems);
                            setForm({ ...form, items: nextItems, valor: total ? total.toFixed(2) : "" });
                          }}
                          title="Remover item"
                          aria-label="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {item.produto_id ? "Catálogo · " : item.produto.trim() ? "Personalizado · " : ""}
                        {priceNum > 0
                          ? `R$ ${priceNum.toFixed(2).replace(".", ",")} × ${qtyNum} = R$ ${subtotal.toFixed(2).replace(".", ",")}`
                          : "Sem preço definido — não soma no total automático."}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end mt-2 text-xs">
                <span className="text-muted-foreground mr-2">Total dos itens:</span>
                <span className="font-semibold tabular-nums">
                  R$ {computeTotal(form.items).toFixed(2).replace(".", ",")}
                </span>
              </div>

              {noItems && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Adicione ao menos um produto/encomenda ao evento.</span>
                </div>
              )}
            </div>

            {/* h + i. Valor e forma de pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 h-5 text-sm font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-primary" /> Valor (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="0,00"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 h-5 text-sm font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-primary" /> Forma de pagamento
                </Label>
                <Select
                  value={form.payment_method || "none"}
                  onValueChange={(v) => setForm({ ...form, payment_method: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Não informar —</SelectItem>
                    {PAYMENT_METHODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Frete (Melhor Envio) */}
            <div className="rounded-md border border-border/60 bg-card/40 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Truck className="w-3.5 h-3.5 text-fuchsia-500" /> Frete
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => loadShipping(false)}
                  disabled={shippingLoading || !form.client_id}
                >
                  {shippingLoading ? "Calculando..." : "Calcular frete"}
                </Button>
              </div>
              {!form.client_id && (
                <p className="text-[11px] text-muted-foreground">
                  Selecione um cliente com CEP para calcular o frete.
                </p>
              )}
              {shippingError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{shippingError}</span>
                </div>
              )}
              {shippingOptions.length > 0 && (
                <div className="space-y-1.5">
                  {shippingOptions.map((opt) => {
                    const checked = selectedShippingId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md border p-2 cursor-pointer text-sm transition-colors",
                          checked ? "border-primary bg-primary/10" : "border-border/60 hover:bg-accent/50",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="radio"
                            name="agenda-shipping"
                            checked={checked}
                            onChange={() => {
                              setSelectedShippingId(opt.id);
                              setShippingCarrier([opt.company, opt.name].filter(Boolean).join(" — "));
                              if (!shippingFree) setShippingCost((opt.priceCents / 100).toFixed(2));
                            }}
                            className="accent-primary"
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{opt.company} · {opt.name}</div>
                            {opt.deliveryDays != null && (
                              <div className="text-[11px] text-muted-foreground">
                                Entrega em até {opt.deliveryDays} dia(s) úteis
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold tabular-nums shrink-0">
                          R$ {(opt.priceCents / 100).toFixed(2).replace(".", ",")}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Valor do frete (editável) + isenção */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end pt-1">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Valor do frete (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={shippingFree ? "0" : shippingCost}
                    disabled={shippingFree}
                    onChange={(e) => {
                      setShippingCost(e.target.value);
                      // Se valor digitado não bate com a opção selecionada, perde a transportadora
                      const cents = Math.round((Number(e.target.value) || 0) * 100);
                      const sel = shippingOptions.find((o) => o.id === selectedShippingId);
                      if (!sel || Math.abs(sel.priceCents - cents) > 1) {
                        setSelectedShippingId(null);
                        setShippingCarrier("");
                      }
                    }}
                    placeholder="0,00"
                    className="h-9"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground h-9 px-2 rounded-md border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingFree}
                    onChange={(e) => setShippingFree(e.target.checked)}
                    className="accent-primary"
                  />
                  Isentar frete (grátis)
                </label>
              </div>
            </div>
            </fieldset>

            {/* j. Observações */}
            <div>
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Detalhes, cores, mensagens..."
                disabled={editingIsSite}
              />
            </div>

            {/* k. Status */}
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            </TabsContent>

            {/* ============== ABA 3: RESUMO ============== */}
            <TabsContent value="resumo" className="space-y-3 mt-3">
              <div className="rounded-lg border border-border bg-card/40 p-3 space-y-3">
                {/* Cliente */}
                {(() => {
                  const c = form.client_id ? clientMap[form.client_id] : null;
                  const birthdayFmt = c?.birthday
                    ? format(parseISO(c.birthday), "dd/MM/yyyy")
                    : null;
                  const hasAddress = !!(
                    c?.street || c?.number || c?.neighborhood || c?.complement ||
                    c?.city || c?.state || c?.cep || form.endereco
                  );
                  const dash = <span className="text-muted-foreground italic">—</span>;
                  return (
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Cliente
                      </h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-muted-foreground">Nome</dt>
                          <dd className="font-medium">{form.client_name || <span className="text-muted-foreground italic">Não informado</span>}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</dt>
                          <dd>{form.phone || dash}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground flex items-center gap-1"><Cake className="w-3 h-3" /> Aniversário</dt>
                          <dd>{birthdayFmt || dash}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</dt>
                          <dd className="break-all">{form.email || dash}</dd>
                        </div>
                      </dl>

                      <div className="mt-3">
                        <h5 className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                          <MapPin className="w-3 h-3" /> Endereço de entrega
                        </h5>
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 text-sm">
                          <div className="col-span-2 sm:col-span-3">
                            <dt className="text-[11px] text-muted-foreground">Logradouro</dt>
                            <dd className="break-words">{c?.street || dash}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-muted-foreground">Número</dt>
                            <dd className="tabular-nums">{c?.number || dash}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-[11px] text-muted-foreground">Bairro</dt>
                            <dd>{c?.neighborhood || dash}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-[11px] text-muted-foreground">Complemento</dt>
                            <dd>{c?.complement || dash}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-[11px] text-muted-foreground">Cidade</dt>
                            <dd>{c?.city || dash}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-muted-foreground">UF</dt>
                            <dd className="tabular-nums">{c?.state || dash}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-muted-foreground">CEP</dt>
                            <dd className="tabular-nums">{c?.cep || dash}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t border-border" />

                {/* Encomenda */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Encomenda
                  </h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">Título</dt>
                      <dd className="font-medium">{form.title || <span className="text-muted-foreground italic">Encomenda</span>}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground flex items-center gap-1"><Hammer className="w-3 h-3" /> Produção</dt>
                      <dd>
                        {form.prod_start_date
                          ? format(parseISO(form.prod_start_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : <span className="text-muted-foreground italic">—</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Entrega</dt>
                      <dd>
                        {form.delivery_date
                          ? `${format(parseISO(form.delivery_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                          : <span className="text-destructive italic">Pendente</span>}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-2">
                    <OrderItemsBreakdown
                      items={form.items.map((it) => ({
                        produto: it.produto,
                        unit_price: it.unit_price,
                        quantidade: it.quantidade,
                      }))}
                     shipping={shippingValue}
                      hideShipping={shippingValue <= 0}
                      carrier={
                        shippingFree
                          ? "Frete grátis"
                          : (shippingCarrier && Number(shippingCost) > 0 ? shippingCarrier : null)
                      }
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
                      <dd className="font-semibold tabular-nums text-base">
                        R$ {valorFinal.toFixed(2).replace(".", ",")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Forma de pagamento</dt>
                      <dd>
                        {form.payment_method
                          ? PAYMENT_METHODS.find((p) => p.value === form.payment_method)?.label || form.payment_method
                          : <span className="text-muted-foreground italic">—</span>}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Status</dt>
                      <dd>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                          statusConfig[form.status]?.pillClass,
                        )}>
                          {statusConfig[form.status]?.label || form.status}
                        </span>
                      </dd>
                    </div>
                    {form.notes && (
                      <div className="col-span-2">
                        <dt className="text-xs text-muted-foreground">Observações</dt>
                        <dd className="whitespace-pre-wrap text-sm">{form.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {hasDateError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Corrija as datas na aba <strong>Produto</strong> antes de salvar.</span>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* l. Aviso de lembrete automático */}
          {!editingId && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-700 dark:text-amber-300">
              <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Um <strong>lembrete automático</strong> será criado 1 dia antes da data de entrega, às 09:00.
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                hasDateError ||
                !form.delivery_date ||
                clientHasError ||
                noItems
              }
              className="flex-1"
            >
              {saveMutation.isPending ? "Salvando..." : (editingId ? "Salvar" : "Criar evento")}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir evento?"
        description="O evento será removido permanentemente da agenda."
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
      />

      {/* Dialog de visualização — usa o componente compartilhado para garantir
          a mesma estrutura do cadastro/histórico do cliente. */}
      <EventDetailDialog
        event={viewingEvent}
        open={!!viewingEvent}
        onOpenChange={(o) => !o && setViewingEvent(null)}
        onEdit={(ev) => openEdit(ev)}
      />

      <ConfirmDialog
        open={!!pendingStatus}
        onOpenChange={(o) => !o && setPendingStatus(null)}
        title={pendingStatus?.status === "entregue" ? "Marcar como entregue?" : "Cancelar evento?"}
        description={
          pendingStatus?.status === "entregue"
            ? "O evento será marcado como entregue. Você pode reverter manualmente alterando o status novamente."
            : "O evento será marcado como cancelado e removido dos atrasados e próximos. Confirma esta ação?"
        }
        confirmLabel={pendingStatus?.status === "entregue" ? "Marcar entregue" : "Cancelar evento"}
        onConfirm={() => {
          if (pendingStatus) statusMutation.mutate({ id: pendingStatus.id, status: pendingStatus.status });
          setPendingStatus(null);
        }}
      />
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="p-3 flex items-center justify-between">
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </div>
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
    </CardContent>
  </Card>
);

const Legend = ({ tipo }: { tipo: Tipo }) => {
  const cfg = tipoConfig[tipo];
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", cfg.dotClass)} /> {cfg.label}
    </span>
  );
};

const StatusLegend = ({ label, cls }: { label: string; cls: string }) => (
  <span className="flex items-center gap-1">
    <span className={cn("w-2.5 h-2.5 rounded-sm ring-1 ring-inset bg-background", cls)} />
    {label}
  </span>
);

const EmptyDay = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-10 border border-dashed border-border rounded-lg">
    <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
    <p className="text-sm text-muted-foreground mb-3">Nenhum evento neste dia.</p>
    <Button variant="outline" size="sm" onClick={onCreate} className="gap-1.5">
      <Plus className="w-3.5 h-3.5" /> Adicionar
    </Button>
  </div>
);

interface EventRowProps {
  event: AgendaEvent;
  showDate?: boolean;
  onView?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  whatsAppLink: string | null;
  onWhatsAppSend?: () => void;
  onPrintOS?: () => void;
  onSendOS?: () => void;
  blockReason?: string | null;
}

const EventRow = ({ event, showDate, onView, onEdit, onDelete, onStatusChange, whatsAppLink, onWhatsAppSend, onPrintOS, onSendOS, blockReason }: EventRowProps) => {
  const cfg = tipoConfig[event.tipo as Tipo] || tipoConfig.lembrete;
  const Icon = cfg.icon;
  const status = statusConfig[event.status] || statusConfig.pendente;
  const d = parseISO(event.scheduled_date);
  const endD = event.end_date ? parseISO(event.end_date) : null;
  const isProducao = event.tipo === "producao";
  const isLembrete = event.tipo === "lembrete";
  const dayDiff = endD ? differenceInCalendarDays(endD, d) : 0;
  const isMultiDay = isProducao && dayDiff > 0;

  const now = new Date();
  const finalStatuses = ["entregue", "cancelado", "pronto"];
  const deadline = endD || d;
  const isOverdue = !finalStatuses.includes(event.status) && deadline < now;
  const overdueDays = isOverdue ? Math.max(1, differenceInCalendarDays(now, deadline)) : 0;
  const isDueToday = !isOverdue && !finalStatuses.includes(event.status) && isSameDay(deadline, now);

  const renderTimeLabel = () => {
    if (isMultiDay && endD) {
      const totalDays = dayDiff + 1;
      return `${totalDays} dia${totalDays > 1 ? "s" : ""} · ${format(d, "dd/MM")} → ${format(endD, "dd/MM")}`;
    }
    return showDate ? format(d, "dd/MM HH:mm") : format(d, "HH:mm");
  };

  return (
    <div
      role={onView ? "button" : undefined}
      tabIndex={onView ? 0 : undefined}
      onClick={onView}
      onKeyDown={onView ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView(); } } : undefined}
      className={cn(
        "border rounded-lg p-3 transition-colors relative",
        onView && "cursor-pointer",
        isOverdue
          ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10 ring-1 ring-destructive/30"
          : isDueToday
            ? "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10"
            : "border-border hover:bg-muted/30"
      )}
    >
      {isOverdue && (
        <div className="absolute -top-2 left-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold shadow-sm">
          <AlertTriangle className="w-3 h-3" />
          Atrasado {overdueDays}d
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border", cfg.pillClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={cn("font-medium truncate", isOverdue ? "text-destructive" : "text-foreground")}>{event.title}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                {event.order_number && (
                  <span className="font-mono">#{String(event.order_number).padStart(4, "0")}</span>
                )}
                <span className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-destructive font-medium",
                  isDueToday && "text-amber-600 font-medium"
                )}>
                  {isMultiDay ? <CalendarRange className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {renderTimeLabel()}
                  {isDueToday && <span className="ml-1 text-[10px] font-semibold">· HOJE</span>}
                </span>
                <OriginBadge origin={getOrderOrigin(event)} short />
                {event.client_name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {event.client_name}</span>}
                {event.endereco && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.endereco}</span>}
                {event.valor && Number(event.valor) > 0 && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {Number(event.valor).toFixed(2).replace(".", ",")}</span>
                )}
              </div>
            </div>
            <Badge variant="outline" className={cn("shrink-0 text-[10px]", status.pillClass)}>{status.label}</Badge>
          </div>

          {!isLembrete && (
          <div className="flex items-center gap-1 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>

            <Select value={event.status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-7 text-xs w-auto"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {onSendOS && (
              blockReason ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled
                  className="h-7 text-xs gap-1 text-muted-foreground cursor-not-allowed"
                  title={blockReason}
                  onClick={(e) => e.stopPropagation()}
                >
                  <AlertTriangle className="w-3 h-3" /> WhatsApp
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={(e) => { e.stopPropagation(); onSendOS(); }}
                  title="Enviar OS por WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </Button>
              )
            )}
            {onPrintOS && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={(e) => { e.stopPropagation(); onPrintOS(); }}
                title="Imprimir OS"
              >
                <Printer className="w-3 h-3" />
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Editar"><Pencil className="w-3 h-3" /></Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Excluir"><Trash2 className="w-3 h-3" /></Button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgendaTab;
