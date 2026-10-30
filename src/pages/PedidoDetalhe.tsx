import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, CheckCircle2, Clock, Truck, PackageCheck, XCircle,
  RefreshCcw, AlertCircle, MapPin, Tag, Loader2, MessageCircle, Mail, Phone,
  CreditCard, Factory,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price_cents: number;
}

interface Address {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

interface PublicOrder {
  id: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  coupon_code: string | null;
  shipping_address: Address | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Package; color: string; bg: string; subtitle: string }> = {
  pending: { label: "Aguardando pagamento", icon: Clock, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10", subtitle: "Estamos aguardando a confirmação do pagamento." },
  paid: { label: "Pagamento confirmado", icon: CheckCircle2, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", subtitle: "Recebemos seu pagamento. Em breve iniciaremos a produção." },
  fulfilled: { label: "Pedido enviado", icon: Truck, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-500/10", subtitle: "Seu pedido já saiu para entrega." },
  shipped: { label: "Pedido enviado", icon: Truck, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-500/10", subtitle: "Seu pedido já saiu para entrega." },
  delivered: { label: "Entregue", icon: PackageCheck, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", subtitle: "Seu pedido foi entregue. Obrigado pela compra!" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", subtitle: "Este pedido foi cancelado." },
  canceled: { label: "Cancelado", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", subtitle: "Este pedido foi cancelado." },
  refunded: { label: "Estornado", icon: RefreshCcw, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-500/10", subtitle: "O valor foi devolvido ao seu meio de pagamento." },
  failed: { label: "Pagamento falhou", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", subtitle: "Não foi possível confirmar seu pagamento." },
};

const formatBrl = (cents: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: (currency || "BRL").toUpperCase() }).format(
    (cents || 0) / 100,
  );

// ===== Timeline =====
// Mapeia os status do admin (pending, paid, fulfilled, delivered, cancelled, refunded, failed)
// numa linha do tempo visual com as etapas que o cliente acompanha.
type TimelineStep = {
  key: "pending" | "paid" | "fulfilled" | "delivered";
  label: string;
  description: string;
  icon: typeof Package;
};

const TIMELINE_STEPS: TimelineStep[] = [
  { key: "pending", label: "Pedido recebido", description: "Aguardando confirmação do pagamento.", icon: CreditCard },
  { key: "paid", label: "Em produção", description: "Pagamento confirmado, sua peça está sendo impressa.", icon: Factory },
  { key: "fulfilled", label: "Enviado", description: "Pedido despachado para entrega.", icon: Truck },
  { key: "delivered", label: "Entregue", description: "Pedido entregue. Bom proveito!", icon: PackageCheck },
];

const STEP_INDEX: Record<string, number> = {
  pending: 0,
  paid: 1,
  processing: 1,
  fulfilled: 2,
  shipped: 2,
  delivered: 3,
};

const OrderTimeline = ({ status }: { status: string }) => {
  const terminal = ["cancelled", "canceled", "refunded", "failed"].includes(status);
  const currentIndex = terminal ? -1 : STEP_INDEX[status] ?? 0;

  if (terminal) {
    const labels: Record<string, { label: string; color: string; bg: string; icon: typeof Package }> = {
      cancelled: { label: "Pedido cancelado", color: "text-muted-foreground", bg: "bg-muted", icon: XCircle },
      canceled: { label: "Pedido cancelado", color: "text-muted-foreground", bg: "bg-muted", icon: XCircle },
      refunded: { label: "Pagamento estornado", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10", icon: RefreshCcw },
      failed: { label: "Pagamento falhou", color: "text-destructive", bg: "bg-destructive/10", icon: AlertCircle },
    };
    const t = labels[status];
    const TIcon = t.icon;
    return (
      <div className={`rounded-2xl border border-border p-5 flex items-center gap-3 ${t.bg}`}>
        <TIcon className={`w-6 h-6 ${t.color}`} />
        <div>
          <p className={`font-semibold ${t.color}`}>{t.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Em caso de dúvidas, fale conosco no WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-5 sm:p-6">
      <h2 className="font-semibold text-sm mb-5">Andamento do pedido</h2>
      <ol className="relative">
        {TIMELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;
          const isLast = idx === TIMELINE_STEPS.length - 1;

          return (
            <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute left-5 top-10 bottom-0 w-px ${
                    isDone ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <motion.div
                animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={isCurrent ? { repeat: Infinity, duration: 2 } : { duration: 0 }}
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  isDone
                    ? "bg-primary text-primary-foreground border-primary"
                    : isCurrent
                      ? "bg-primary/15 text-primary border-primary"
                      : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </motion.div>
              <div className="flex-1 pt-1.5">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${isFuture ? "text-muted-foreground" : "text-foreground"}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Atual
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const PedidoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const printMode = searchParams.get("print") === "1";
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-print when requested via ?print=1 (after order loaded)
  useEffect(() => {
    if (!printMode || !order) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [printMode, order]);

  useEffect(() => {
    if (!id) {
      setError("ID do pedido não informado");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error: err } = await supabase.functions.invoke(
          `get-order-public?id=${id}`,
          { method: "GET" },
        );
        if (err) throw err;
        if ((data as any)?.error) throw new Error((data as any).error);
        setOrder(data as PublicOrder);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Pedido não encontrado");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Realtime: atualiza o status quando o admin muda no painel
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "customer_orders", filter: `id=eq.${id}` },
        (payload) => {
          const next = payload.new as Partial<PublicOrder>;
          setOrder((prev) => (prev ? { ...prev, ...next } : prev));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const cfg = order ? (STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending) : null;
  const Icon = cfg?.icon ?? Clock;
  const shortId = order?.id.slice(0, 8).toUpperCase();
  const addr = order?.shipping_address;
  const waPhone = "5519993512766";
  const waMessage = order
    ? `Olá! Tenho uma dúvida sobre meu pedido #${shortId} na Amaryllis Produtos Naturais.`
    : "Olá! Tenho uma dúvida sobre meu pedido.";
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <main className="pt-24 pb-20 min-h-[80vh]">
      <SEO
        title={`Pedido ${shortId ?? ""} — Amaryllis Produtos Naturais`}
        description="Acompanhe seu pedido na Amaryllis Produtos Naturais."
      />
      <div className="container max-w-3xl">
        <Breadcrumbs items={[{ label: "Pedido" }]} />

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando seu pedido…</p>
          </div>
        ) : error || !order || !cfg ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="font-serif text-2xl font-bold mb-3">Pedido não encontrado</h1>
            <p className="text-muted-foreground mb-6">{error || "Verifique o link e tente novamente."}</p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/catalogo">Voltar ao catálogo</Link>
              </Button>
              <Button asChild>
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${cfg.bg} mb-5`}
              >
                <Icon className={`w-10 h-10 ${cfg.color}`} />
              </motion.div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
                {cfg.label}
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">{cfg.subtitle}</p>
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-muted text-xs font-mono">
                <span className="text-muted-foreground">Pedido</span>
                <span className="font-semibold text-foreground">#{shortId}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(order.created_at).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
              </p>
            </div>

            {/* Timeline de status */}
            <OrderTimeline status={order.status} />

            {/* Cliente */}
            <div className="rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-sm mb-3">Cliente</h2>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                {order.customer_name && <div>{order.customer_name}</div>}
                {order.customer_email && (
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{order.customer_email}</div>
                )}
                {order.customer_phone && (
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{order.customer_phone}</div>
                )}
              </div>
              {addr && (addr.line1 || addr.city) && (
                <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    {addr.line1 && <div>{addr.line1}</div>}
                    {addr.line2 && <div>{addr.line2}</div>}
                    {(addr.city || addr.state || addr.postal_code) && (
                      <div>
                        {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(" — ")}
                      </div>
                    )}
                    {addr.country && <div>{addr.country}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-sm mb-3">Itens</h2>
              <div className="space-y-2">
                {order.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sem itens registrados.</p>
                ) : order.items.map((it) => (
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
                        {it.quantity}× {formatBrl(it.unit_price_cents, order.currency)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatBrl(it.unit_price_cents * it.quantity, order.currency)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="border-t border-border mt-4 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatBrl(order.subtotal_cents, order.currency)}</span>
                </div>
                {order.discount_cents > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Desconto {order.coupon_code && `(${order.coupon_code})`}
                    </span>
                    <span>-{formatBrl(order.discount_cents, order.currency)}</span>
                  </div>
                )}
                {order.shipping_cents > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frete</span>
                    <span>{formatBrl(order.shipping_cents, order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1.5 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatBrl(order.total_cents, order.currency)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/catalogo">Continuar comprando</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default PedidoDetalhe;
