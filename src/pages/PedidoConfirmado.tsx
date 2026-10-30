import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, Package, MessageCircle, Loader2, Clock, AlertCircle, XCircle,
  Mail, Phone, MapPin, Tag, Copy, Check, Truck, PackageCheck, RefreshCcw, StickyNote,
  ShieldCheck, Printer, FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface VerifyItem {
  name: string;
  notes?: string | null;
  quantity: number;
  unit_amount: number;
  amount_subtotal: number;
  amount_total: number;
  image: string | null;
}

interface VerifyAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

interface VerifyResult {
  status: string;
  payment_status: string;
  amount_subtotal: number | null;
  amount_total: number | null;
  amount_discount: number;
  amount_shipping: number;
  currency: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_address: VerifyAddress | null;
  coupon_code: string | null;
  items: VerifyItem[];
  order_id: string;
  created: number;
  order_status: string | null;
  order_db_id: string | null;
  order_updated_at: string | null;
}

type OrderStatus =
  | "paid"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "expired"
  | "failed"
  | "canceled"
  | "refunded"
  | "unknown";

const formatCurrency = (cents: number | null, currency = "BRL") => {
  if (cents == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: (currency || "BRL").toUpperCase(),
  }).format(cents / 100);
};

const PedidoConfirmado = () => {
  const [params] = useSearchParams();
  // Mercado Pago retorna: ?collection_id=...&payment_id=...&preference_id=...&status=approved
  const paymentId = params.get("payment_id") || params.get("collection_id");
  const preferenceId = params.get("preference_id");
  const lookupId = paymentId || preferenceId;
  const [data, setData] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const { clearCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (!lookupId) {
      setError("Pedido não encontrado");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const qs = paymentId
          ? `payment_id=${paymentId}`
          : `preference_id=${preferenceId}`;
        const { data: res, error: err } = await supabase.functions.invoke(
          `verify-checkout?${qs}`,
          { method: "GET" },
        );
        if (err) throw err;
        const result = res as VerifyResult;
        setData(result);
        if (result?.order_status === "paid" || result?.payment_status === "paid") clearCart();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao verificar pedido");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupId]);

  // Restaura estado de "recibo confirmado" caso o cliente reabra a página
  useEffect(() => {
    if (!lookupId) return;
    try {
      const ack = localStorage.getItem(`order_ack_${lookupId}`);
      if (ack === "1") setAcknowledged(true);
    } catch {
      // localStorage indisponível — segue sem persistência
    }
  }, [lookupId]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    try {
      if (lookupId) localStorage.setItem(`order_ack_${lookupId}`, "1");
    } catch {
      // ignora
    }
    toast({
      title: "Recibo confirmado!",
      description: "Você validou o recebimento das informações do pedido.",
    });
  };

  const handlePrint = () => window.print();

  // Fonte de verdade: status persistido em customer_orders.
  // Caímos no payment_status do provedor só se o banco ainda não respondeu
  // (ex.: persistência falhou no edge function).
  const resolveStatus = (): OrderStatus => {
    const dbStatus = data?.order_status?.toLowerCase();
    if (dbStatus) {
      const known: OrderStatus[] = [
        "paid", "pending", "processing", "shipped", "delivered",
        "expired", "failed", "canceled", "refunded",
      ];
      if (known.includes(dbStatus as OrderStatus)) return dbStatus as OrderStatus;
    }
    if (data?.payment_status === "paid") return "paid";
    if (data?.status === "expired") return "expired";
    if (data?.payment_status === "unpaid") return "pending";
    if (data?.payment_status === "failed") return "failed";
    return "unknown";
  };

  const orderStatus: OrderStatus = data ? resolveStatus() : "unknown";
  const paid = orderStatus === "paid" || orderStatus === "shipped" || orderStatus === "delivered";
  const currency = data?.currency || "BRL";
  const shortId = data?.order_id ? data.order_id.slice(-12).toUpperCase() : (lookupId?.slice(-12).toUpperCase() || "");
  const orderDate = data?.created ? new Date(data.created * 1000) : new Date();
  const lastUpdate = data?.order_updated_at ? new Date(data.order_updated_at) : null;

  const copyId = async () => {
    await navigator.clipboard.writeText(shortId);
    setCopied(true);
    toast({ title: "Código copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  // Mapeia o status real do banco para visual + copy amigáveis
  const STATUS_CONFIG: Record<OrderStatus, {
    icon: typeof CheckCircle2;
    iconColor: string;
    bgColor: string;
    title: string;
    subtitle: string;
    badge: string;
  }> = {
    paid: {
      icon: CheckCircle2,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      title: "Pedido confirmado!",
      subtitle: `Recebemos seu pagamento${data?.customer_name ? `, ${data.customer_name.split(" ")[0]}` : ""}. Em breve iniciaremos a produção.`,
      badge: "Pago",
    },
    pending: {
      icon: Clock,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      title: "Aguardando pagamento",
      subtitle: "Estamos aguardando a confirmação do pagamento (boleto/Pix podem levar alguns minutos).",
      badge: "Pendente",
    },
    processing: {
      icon: RefreshCcw,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      title: "Processando pagamento",
      subtitle: "Seu pagamento está sendo processado. Você receberá uma confirmação em instantes.",
      badge: "Processando",
    },
    shipped: {
      icon: Truck,
      iconColor: "text-sky-500 dark:text-sky-400",
      bgColor: "bg-sky-500/10",
      title: "Pedido a caminho!",
      subtitle: "Seu pedido já saiu para entrega. Acompanhe pelo WhatsApp.",
      badge: "Enviado",
    },
    delivered: {
      icon: PackageCheck,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      title: "Pedido entregue",
      subtitle: "Esperamos que tenha amado! Qualquer dúvida, fale conosco.",
      badge: "Entregue",
    },
    expired: {
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      title: "Sessão expirada",
      subtitle: "O tempo para concluir o pagamento esgotou. Você pode tentar novamente.",
      badge: "Expirado",
    },
    failed: {
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      title: "Pagamento não concluído",
      subtitle: "Não foi possível confirmar seu pagamento. Tente novamente ou fale conosco no WhatsApp.",
      badge: "Falhou",
    },
    canceled: {
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      title: "Pedido cancelado",
      subtitle: "Seu pagamento foi cancelado. Os itens continuam no carrinho — é só voltar ao catálogo e finalizar quando quiser.",
      badge: "Cancelado",
    },
    refunded: {
      icon: RefreshCcw,
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted",
      title: "Pedido reembolsado",
      subtitle: "O valor foi devolvido ao seu meio de pagamento.",
      badge: "Reembolsado",
    },
    unknown: {
      icon: AlertCircle,
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted",
      title: "Pedido recebido",
      subtitle: "Estamos confirmando seu pedido. Atualize a página em alguns instantes.",
      badge: "Verificando",
    },
  };

  const statusConfig = STATUS_CONFIG[orderStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <main className="pt-24 pb-20 min-h-[80vh]">
      <SEO title="Pedido confirmado — Amaryllis Produtos Naturais" description="Seu pedido foi recebido!" />
      <div className="container max-w-3xl">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Confirmando pagamento…</p>
          </div>
        ) : error || !data ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="font-serif text-2xl font-bold mb-3">Não foi possível verificar</h1>
            <p className="text-muted-foreground mb-6">{error || "Erro desconhecido"}</p>
            <Button asChild variant="outline">
              <Link to="/catalogo">Voltar ao catálogo</Link>
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Status hero */}
            <div className="text-center pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${statusConfig.bgColor} mb-5`}
              >
                <StatusIcon className={`w-10 h-10 ${statusConfig.iconColor}`} />
              </motion.div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
                {statusConfig.title}
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">{statusConfig.subtitle}</p>

              {/* Status badge real (vindo do banco) */}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.iconColor}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.iconColor.replace("text-", "bg-")}`} />
                  {statusConfig.badge}
                </span>
                {data.order_db_id && (
                  <span className="text-[10px] text-muted-foreground/70">
                    sincronizado com o pedido
                  </span>
                )}
              </div>

              {/* Order ID badge */}
              <button
                onClick={copyId}
                className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 transition-colors text-xs font-mono"
              >
                <span className="text-muted-foreground">Pedido</span>
                <span className="font-semibold text-foreground">#{shortId}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                {orderDate.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
                {lastUpdate && (
                  <span className="block text-[10px] mt-0.5 opacity-70">
                    Última atualização: {lastUpdate.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                )}
              </p>
            </div>

            {/* === Etapa final de confirmação (recibo) === */}
            {paid && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`rounded-2xl p-5 md:p-6 border-2 transition-colors print:break-inside-avoid ${
                  acknowledged
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      acknowledged ? "bg-emerald-500/15" : "bg-primary/15"
                    }`}
                  >
                    {acknowledged ? (
                      <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-lg font-semibold text-foreground">
                      {acknowledged ? "Recibo confirmado" : "Confirme o recebimento do recibo"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {acknowledged
                        ? "Você validou que recebeu e conferiu todas as informações abaixo. Guarde este recibo para referência."
                        : "Validamos a criação do seu pedido. Confira os dados abaixo e clique em confirmar para fechar o recibo."}
                    </p>

                    {/* Checklist de validação */}
                    <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
                      <li className="flex items-center gap-2 text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        Pagamento aprovado
                      </li>
                      <li className="flex items-center gap-2 text-foreground/90">
                        {data.order_db_id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            Pedido registrado no sistema
                          </>
                        ) : (
                          <>
                            <Loader2 className="w-4 h-4 text-amber-500 shrink-0 animate-spin" />
                            Sincronizando pedido…
                          </>
                        )}
                      </li>
                      <li className="flex items-center gap-2 text-foreground/90">
                        {data.items.length > 0 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            {data.items.length} {data.items.length === 1 ? "item registrado" : "itens registrados"}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            Itens em verificação
                          </>
                        )}
                      </li>
                      <li className="flex items-center gap-2 text-foreground/90">
                        {data.customer_email ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            Contato salvo para atualizações
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            Contato não informado
                          </>
                        )}
                      </li>
                    </ul>

                    {/* Ações de recibo */}
                    <div className="mt-5 flex flex-col sm:flex-row gap-2 print:hidden">
                      <Button onClick={handlePrint} variant="outline" className="gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimir / salvar PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {data.items.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-5 md:p-6"
              >
                <h2 className="font-serif text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Itens do pedido
                </h2>
                <div className="space-y-3">
                  {data.items.map((item, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-background/50">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded bg-muted flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground text-sm line-clamp-2">{item.name}</p>
                            {item.notes && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-2 py-0.5">
                                <StickyNote className="w-2.5 h-2.5" /> Personalizado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.quantity}× {formatCurrency(item.unit_amount, currency)}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground text-sm whitespace-nowrap">
                          {formatCurrency(item.amount_total, currency)}
                        </p>
                      </div>
                      {item.notes && (
                        <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
                          <StickyNote className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="text-xs">
                            <p className="font-semibold text-foreground/80 uppercase tracking-wide text-[10px] mb-0.5">
                              Personalização
                            </p>
                            <p className="text-foreground/90 italic whitespace-pre-wrap">“{item.notes}”</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(data.amount_subtotal, currency)}</span>
                  </div>
                  {data.amount_discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        Desconto {data.coupon_code && `(${data.coupon_code})`}
                      </span>
                      <span>-{formatCurrency(data.amount_discount, currency)}</span>
                    </div>
                  )}
                  {data.amount_shipping > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frete</span>
                      <span>{formatCurrency(data.amount_shipping, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                    <span>Total {paid ? "pago" : ""}</span>
                    <span className="text-primary">{formatCurrency(data.amount_total, currency)}</span>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Customer + shipping */}
            {(data.customer_email || data.customer_phone || data.shipping_address) && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid sm:grid-cols-2 gap-4"
              >
                {(data.customer_email || data.customer_phone) && (
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-medium text-foreground text-sm mb-3">Contato</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {data.customer_name && <p className="font-medium text-foreground">{data.customer_name}</p>}
                      {data.customer_email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="break-all">{data.customer_email}</span>
                        </p>
                      )}
                      {data.customer_phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {data.customer_phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {data.shipping_address && (
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Endereço de entrega
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {data.shipping_address.line1 && <p>{data.shipping_address.line1}</p>}
                      {data.shipping_address.line2 && <p>{data.shipping_address.line2}</p>}
                      <p>
                        {[data.shipping_address.city, data.shipping_address.state]
                          .filter(Boolean).join(" - ")}
                        {data.shipping_address.postal_code && ` — ${data.shipping_address.postal_code}`}
                      </p>
                      {data.shipping_address.country && <p>{data.shipping_address.country}</p>}
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* Next steps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-3"
            >
              <Package className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Próximos passos</p>
                <p className="text-muted-foreground mt-1">
                  {paid
                    ? "Iniciaremos a produção do seu pedido e enviaremos atualizações por e-mail e WhatsApp. Prazo médio: 3 a 7 dias úteis."
                    : "Assim que o pagamento for confirmado, iniciaremos a produção. Você receberá um e-mail de confirmação."}
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
            >
              <Button asChild size="lg" className="bg-primary text-primary-foreground gap-2">
                <Link to="/catalogo">Continuar comprando</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a
                  href={`https://wa.me/5519993512766?text=${encodeURIComponent(
                    `Olá! Acabei de fazer o pedido #${shortId} e gostaria de acompanhar.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar conosco
                </a>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default PedidoConfirmado;
