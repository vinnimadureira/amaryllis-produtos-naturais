import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, Package, CalendarDays, DollarSign, TrendingUp, AlertTriangle,
  Truck, Hammer, Bell, Gift, UserPlus, ShoppingBag, Sparkles, Check, Clock,
  ShoppingCart, CheckCircle2, XCircle, RefreshCw, AlertCircle, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import {
  format, parseISO, subDays, startOfDay, isAfter, isBefore, isSameDay,
  startOfMonth, addDays, differenceInDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  TIPO_TOKENS, STATUS_TOKENS, getStatusToken, getTipoToken,
  assertAgendaTokensConsistent,
} from "./agendaTokens";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

type Period = 7 | 30 | 90;

const periodLabels: Record<Period, string> = {
  7: "Últimos 7 dias",
  30: "Últimos 30 dias",
  90: "Últimos 90 dias",
};

// Aliases derivados dos tokens centrais — mantém uma única fonte de verdade.
// Inclui aliases para status legados/alternativos persistidos no banco
// (`em_andamento` ↔ `em_producao`, `finalizado` ↔ `pronto`).
const statusColors: Record<string, string> = {
  ...Object.fromEntries(Object.entries(STATUS_TOKENS).map(([k, v]) => [k, v.hsl])),
  em_andamento: STATUS_TOKENS.em_producao.hsl,
  finalizado: STATUS_TOKENS.pronto.hsl,
  // Sobrescreve "pendente" para não usar muted-foreground (ilegível no tema escuro)
  pendente: "hsl(38 92% 60%)",
};
const statusLabels: Record<string, string> = {
  ...Object.fromEntries(Object.entries(STATUS_TOKENS).map(([k, v]) => [k, v.label])),
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
};
const tipoColors: Record<string, string> = Object.fromEntries(
  Object.entries(TIPO_TOKENS).map(([k, v]) => [k, v.hsl]),
);
const tipoLabels: Record<string, string> = {
  entrega: "Entregas",
  lembrete: "Lembretes",
  producao: "Produção",
};

const DashboardOverview = ({ onNavigate }: DashboardOverviewProps) => {
  const [period, setPeriod] = useState<Period>(30);
  const now = new Date();
  const periodStart = startOfDay(subDays(now, period));
  const qc = useQueryClient();

  useEffect(() => { assertAgendaTokensConsistent(); }, []);

  const completeMutation = useMutation({
    mutationFn: async ({ id, tipo }: { id: string; tipo: string }) => {
      const newStatus = tipo === "lembrete" ? "pronto" : "entregue";
      const { error } = await supabase
        .from("agenda_events")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      return { tipo, newStatus };
    },
    onSuccess: ({ newStatus }) => {
      qc.invalidateQueries({ queryKey: ["dashboard-agenda-events"] });
      qc.invalidateQueries({ queryKey: ["agenda-events"] });
      toast.success(newStatus === "entregue" ? "Pedido marcado como entregue" : "Lembrete concluído");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao concluir"),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["dashboard-agenda-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_events")
        .select("*")
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["dashboard-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["dashboard-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_purchases")
        .select("*")
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Pedidos do site (vendas via Mercado Pago / checkout) — controle de vendas online
  const { data: siteOrders = [] } = useQuery({
    queryKey: ["dashboard-customer-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_orders")
        .select("id, status, customer_name, customer_email, total_cents, currency, created_at, coupon_code")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Itens reais dos pedidos do site — usados no Top produtos
  const { data: orderItems = [] } = useQuery({
    queryKey: ["dashboard-order-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_order_items")
        .select("product_name, quantity, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // ============ KPIs ============
  const kpis = useMemo(() => {
    const periodEvents = events.filter(e => isAfter(parseISO(e.scheduled_date), periodStart));
    const previousStart = startOfDay(subDays(periodStart, period));
    const previousEvents = events.filter(e => {
      const d = parseISO(e.scheduled_date);
      return isAfter(d, previousStart) && isBefore(d, periodStart);
    });

    const periodPurchases = purchases.filter(p => isAfter(parseISO(p.purchase_date), periodStart));
    const previousPurchases = purchases.filter(p => {
      const d = parseISO(p.purchase_date);
      return isAfter(d, previousStart) && isBefore(d, periodStart);
    });

    const revenue = periodEvents
      .filter(e => e.status === "entregue")
      .reduce((sum, e) => sum + (Number(e.valor) || 0), 0)
      + periodPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const previousRevenue = previousEvents
      .filter(e => e.status === "entregue")
      .reduce((sum, e) => sum + (Number(e.valor) || 0), 0)
      + previousPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const revenueChange = previousRevenue > 0
      ? ((revenue - previousRevenue) / previousRevenue) * 100
      : revenue > 0 ? 100 : 0;

    const deliveredCount = periodEvents.filter(e => e.status === "entregue").length;
    const totalTransactions = deliveredCount + periodPurchases.length;
    const ticketAverage = totalTransactions > 0
      ? revenue / totalTransactions
      : 0;

    const overdueCount = events.filter(e => {
      if (e.status === "entregue" || e.status === "cancelado" || e.status === "pronto") return false;
      const deadline = e.end_date ? parseISO(e.end_date) : parseISO(e.scheduled_date);
      return deadline < now;
    }).length;

    const todayEvents = events.filter(e =>
      isSameDay(parseISO(e.scheduled_date), now)
      && e.status !== "cancelado" && e.status !== "entregue"
    ).length;

    const inProductionCount = events.filter(e => e.status === "em_producao").length;
    const readyCount = events.filter(e => e.status === "pronto").length;

    const newClientsThisMonth = clients.filter(c =>
      isAfter(parseISO(c.created_at), startOfMonth(now)),
    ).length;

    const birthdaysSoon = clients.filter(c => {
      if (!c.birthday) return false;
      const bd = parseISO(c.birthday);
      const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      const diff = differenceInDays(thisYearBd, now);
      return diff >= 0 && diff <= 30;
    }).length;

    const activeProducts = products.filter(p => p.active).length;
    const featuredProducts = products.filter(p => p.featured).length;

    return {
      revenue, revenueChange, ticketAverage, deliveredCount,
      overdueCount, todayEvents, inProductionCount, readyCount,
      totalClients: clients.length, newClientsThisMonth, birthdaysSoon,
      activeProducts, featuredProducts, totalProducts: products.length,
      totalPeriodEvents: periodEvents.length,
    };
  }, [events, clients, products, purchases, periodStart, period, now]);

  // ============ Alerts ============
  const alerts = useMemo(() => {
    const horizon = addDays(now, 7);
    return events
      .filter(e => {
        if (e.status === "entregue" || e.status === "cancelado") return false;
        const d = parseISO(e.scheduled_date);
        return isAfter(d, subDays(now, 1)) && isBefore(d, horizon);
      })
      .sort((a, b) => parseISO(a.scheduled_date).getTime() - parseISO(b.scheduled_date).getTime())
      .slice(0, 8);
  }, [events, now]);

  // ============ Chart: Receita ao longo do tempo ============
  const revenueChart = useMemo(() => {
    const days: { date: string; label: string; receita: number }[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = subDays(now, i);
      days.push({
        date: format(d, "yyyy-MM-dd"),
        label: format(d, period <= 7 ? "EEE dd" : "dd/MM", { locale: ptBR }),
        receita: 0,
      });
    }
    const map = Object.fromEntries(days.map(d => [d.date, d]));

    events
      .filter(e => e.status === "entregue")
      .forEach(e => {
        const key = format(parseISO(e.scheduled_date), "yyyy-MM-dd");
        if (map[key]) map[key].receita += Number(e.valor) || 0;
      });

    purchases.forEach(p => {
      const key = format(parseISO(p.purchase_date), "yyyy-MM-dd");
      if (map[key]) map[key].receita += Number(p.amount) || 0;
    });

    return days;
  }, [events, purchases, period, now]);

  // ============ Chart: Eventos por status ============
  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    events
      .filter(e => isAfter(parseISO(e.scheduled_date), periodStart))
      .forEach(e => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      status,
    }));
  }, [events, periodStart]);

  // ============ Chart: Top produtos vendidos ============
  // Filtra entradas genéricas tipo "Pedido #XXXXXXXX" (criadas pelo trigger
  // sync_order_to_agenda) e usa os itens reais do pedido (customer_order_items)
  // como fonte verdadeira do nome de produto.
  const ORDER_REF_RE = /^pedido\s*#/i;
  const topProductsChart = useMemo(() => {
    const counts: Record<string, number> = {};
    const bump = (rawName: string, qty = 1) => {
      const key = rawName.trim();
      if (!key || ORDER_REF_RE.test(key)) return;
      counts[key] = (counts[key] || 0) + qty;
    };
    events
      .filter(e => isAfter(parseISO(e.scheduled_date), periodStart) && e.produto)
      .forEach(e => bump(e.produto!));
    purchases
      .filter(p => isAfter(parseISO(p.purchase_date), periodStart))
      .forEach(p => bump(p.product));
    orderItems
      .filter(it => it.created_at && isAfter(parseISO(it.created_at), periodStart))
      .forEach(it => bump(it.product_name, it.quantity ?? 1));
    return Object.entries(counts)
      .map(([name, qtd]) => ({ name: name.length > 24 ? name.slice(0, 22) + "…" : name, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 6);
  }, [events, purchases, orderItems, periodStart]);

  // ============ Chart: Distribuição por tipo ============
  const tipoChart = useMemo(() => {
    const counts: Record<string, number> = { entrega: 0, lembrete: 0, producao: 0 };
    events
      .filter(e => isAfter(parseISO(e.scheduled_date), periodStart))
      .forEach(e => { counts[e.tipo] = (counts[e.tipo] || 0) + 1; });
    return Object.entries(counts).map(([tipo, qtd]) => ({
      name: tipoLabels[tipo] || tipo,
      qtd,
      tipo,
    }));
  }, [events, periodStart]);

  // ============ Site Orders (vendas via Mercado Pago) ============
  const siteOrdersStats = useMemo(() => {
    const periodOrders = siteOrders.filter(o =>
      isAfter(parseISO(o.created_at), periodStart),
    );
    const paid = periodOrders.filter(o => o.status === "paid" || o.status === "fulfilled");
    const pending = periodOrders.filter(o => o.status === "pending");
    const cancelled = periodOrders.filter(
      o => o.status === "cancelled" || o.status === "refunded" || o.status === "failed",
    );
    const revenue = paid.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;
    const recent = siteOrders.slice(0, 5);
    return {
      total: periodOrders.length,
      paid: paid.length,
      pending: pending.length,
      cancelled: cancelled.length,
      revenue,
      recent,
    };
  }, [siteOrders, periodStart]);

  const formatBRL = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">
            Indicadores de {periodLabels[period].toLowerCase()}
          </p>
        </div>
        <div className="flex gap-1.5 p-1 bg-muted rounded-lg w-fit">
          {([7, 30, 90] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                period === p
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="Receita do período"
          value={formatBRL(kpis.revenue)}
          accent="primary"
          trend={kpis.revenueChange}
          sublabel={`${kpis.deliveredCount} pedidos concluídos`}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Ticket médio"
          value={formatBRL(kpis.ticketAverage)}
          accent="violet"
          sublabel="Receita ÷ transações (entregas + compras)"
        />
        <KpiCard
          icon={Users}
          label="Clientes"
          value={kpis.totalClients}
          accent="blue"
          sublabel={`+${kpis.newClientsThisMonth} este mês`}
          onClick={() => onNavigate("clientes")}
        />
        <KpiCard
          icon={Package}
          label="Produtos ativos"
          value={kpis.activeProducts}
          accent="emerald"
          sublabel={`${kpis.featuredProducts} em destaque`}
          onClick={() => onNavigate("produtos")}
        />
      </div>

      {/* Operação - Agenda */}
      <div>
        <h3 className="font-serif text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" /> Operação da agenda
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <OpCard
            icon={AlertTriangle}
            label="Atrasados"
            value={kpis.overdueCount}
            tone={kpis.overdueCount > 0 ? "danger" : "neutral"}
            onClick={() => onNavigate("agenda")}
          />
          <OpCard
            icon={CalendarDays}
            label="Hoje"
            value={kpis.todayEvents}
            tone="amber"
            onClick={() => onNavigate("agenda")}
          />
          <OpCard
            icon={Hammer}
            label="Em andamento"
            value={kpis.inProductionCount}
            tone="violet"
            onClick={() => onNavigate("agenda")}
          />
          <OpCard
            icon={Truck}
            label="Finalizados"
            value={kpis.readyCount}
            tone="emerald"
            onClick={() => onNavigate("agenda")}
          />
        </div>
      </div>

      {/* Pedidos do site (vendas via Mercado Pago) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" /> Pedidos do site
            <Badge variant="outline" className="text-[10px] ml-1">
              {periodLabels[period].toLowerCase()}
            </Badge>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => onNavigate("pedidos")}
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <OpCard
            icon={ShoppingCart}
            label="Total no período"
            value={siteOrdersStats.total}
            tone="violet"
            onClick={() => onNavigate("pedidos")}
          />
          <OpCard
            icon={CheckCircle2}
            label="Pagos"
            value={siteOrdersStats.paid}
            tone="emerald"
            onClick={() => onNavigate("pedidos")}
          />
          <OpCard
            icon={Clock}
            label="Pendentes"
            value={siteOrdersStats.pending}
            tone="amber"
            onClick={() => onNavigate("pedidos")}
          />
          <OpCard
            icon={XCircle}
            label="Cancelados / falhos"
            value={siteOrdersStats.cancelled}
            tone={siteOrdersStats.cancelled > 0 ? "danger" : "neutral"}
            onClick={() => onNavigate("pedidos")}
          />
        </div>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Últimos pedidos online
              <span className="text-xs font-normal text-muted-foreground ml-2">
                · Receita {periodLabels[period].toLowerCase()}: <strong className="text-foreground">{formatBRL(siteOrdersStats.revenue)}</strong>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {siteOrdersStats.recent.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <ShoppingCart className="w-6 h-6 mx-auto mb-2 opacity-30" />
                Nenhum pedido recebido pelo site ainda.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {siteOrdersStats.recent.map(o => {
                  const statusMap: Record<string, { label: string; className: string; icon: React.ElementType }> = {
                    pending: { label: "Pendente", icon: Clock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
                    paid: { label: "Pago", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
                    fulfilled: { label: "Enviado", icon: Package, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
                    cancelled: { label: "Cancelado", icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
                    refunded: { label: "Estornado", icon: RefreshCw, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30" },
                    failed: { label: "Falhou", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/30" },
                  };
                  const cfg = statusMap[o.status] ?? { label: o.status, icon: Clock, className: "bg-muted text-muted-foreground border-border" };
                  const StatusIcon = cfg.icon;
                  return (
                    <li key={o.id} className="py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">
                            {o.customer_name || <span className="italic text-muted-foreground">Sem nome</span>}
                          </p>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-flex items-center gap-1", cfg.className)}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {format(parseISO(o.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          {o.customer_email ? ` · ${o.customer_email}` : ""}
                          {o.coupon_code ? ` · cupom ${o.coupon_code}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">
                          {formatBRL((o.total_cents || 0) / 100)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Alertas — próximos 7 dias
          </CardTitle>
          {alerts.length > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {alerts.length} {alerts.length === 1 ? "item" : "itens"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30" />
              Nenhum pedido ou lembrete pendente nos próximos 7 dias.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map(ev => {
                const tipoTk = getTipoToken(ev.tipo);
                const statusTk = getStatusToken(ev.status);
                const TipoIcon = tipoTk.icon;
                const date = parseISO(ev.scheduled_date);
                const isToday = isSameDay(date, now);
                const isOverdue = date < now && !isToday;
                return (
                  <li key={ev.id} className="py-3 flex items-center gap-3 group">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                        tipoTk.pillClass,
                      )}
                    >
                      <TipoIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">
                          {ev.title}
                        </p>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                            statusTk.pillClass,
                          )}
                        >
                          {statusTk.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span
                          className={cn(
                            isOverdue && "text-destructive font-semibold",
                            isToday && "text-amber-600 dark:text-amber-400 font-semibold",
                          )}
                        >
                          {isToday
                            ? `Hoje · ${format(date, "HH:mm")}`
                            : format(date, "EEE dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {ev.client_name && (
                          <>
                            <span>·</span>
                            <span className="truncate">{ev.client_name}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs shrink-0 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                      disabled={completeMutation.isPending}
                      onClick={() => completeMutation.mutate({ id: ev.id, tipo: ev.tipo })}
                      title={ev.tipo === "lembrete" ? "Marcar lembrete como pronto" : "Marcar pedido como entregue"}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1">Concluir</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Receita ao longo do tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueChart} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatBRL(v), "Receita"]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Eventos por status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusChart.length === 0 ? (
              <EmptyChart label="Sem eventos no período" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusChart.map((entry, idx) => (
                      <Cell key={idx} fill={statusColors[entry.status] || "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number, name: string) => [`${value} evento(s)`, name]}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              Top produtos no período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsChart.length === 0 ? (
              <EmptyChart label="Sem vendas no período" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProductsChart} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    formatter={(v: number) => [`${v} venda(s)`, ""]}
                  />
                  <Bar dataKey="qtd" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Distribuição por tipo de evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tipoChart.every(t => t.qtd === 0) ? (
              <EmptyChart label="Sem eventos no período" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tipoChart} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    formatter={(v: number) => [`${v} evento(s)`, ""]}
                  />
                  <Bar dataKey="qtd" radius={[6, 6, 0, 0]}>
                    {tipoChart.map((entry, idx) => (
                      <Cell key={idx} fill={tipoColors[entry.tipo] || "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HighlightCard
          icon={UserPlus}
          title="Aniversariantes"
          value={kpis.birthdaysSoon}
          description={kpis.birthdaysSoon === 1
            ? "cliente faz aniversário em até 30 dias"
            : "clientes fazem aniversário em até 30 dias"}
          actionLabel="Ver clientes"
          onAction={() => onNavigate("clientes")}
        />
        <HighlightCard
          icon={Hammer}
          title="Em andamento agora"
          value={kpis.inProductionCount}
          description={kpis.inProductionCount === 1 ? "evento em andamento" : "eventos em andamento"}
          actionLabel="Ver agenda"
          onAction={() => onNavigate("agenda")}
        />
        <HighlightCard
          icon={Sparkles}
          title="Produtos no catálogo"
          value={kpis.totalProducts}
          description={`${kpis.activeProducts} ativos · ${kpis.featuredProducts} em destaque`}
          actionLabel="Gerenciar"
          onAction={() => onNavigate("produtos")}
        />
      </div>
    </div>
  );
};

/* ============ Subcomponents ============ */

const accentClasses: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
};

const KpiCard = ({
  icon: Icon, label, value, sublabel, trend, accent = "primary", onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: number;
  accent?: keyof typeof accentClasses;
  onClick?: () => void;
}) => {
  const cls = accentClasses[accent];
  return (
    <Card
      className={cn(
        "transition-all overflow-hidden relative",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cls.bg)}>
            <Icon className={cn("w-5 h-5", cls.text)} />
          </div>
          {typeof trend === "number" && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold gap-1 border-0",
                trend >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              <TrendingUp className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
              {Math.abs(trend).toFixed(0)}%
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
      </CardContent>
    </Card>
  );
};

const opToneClasses: Record<string, string> = {
  danger: "border-destructive/30 bg-destructive/5 text-destructive",
  amber: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  violet: "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400",
  emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  neutral: "border-border bg-muted/30 text-muted-foreground",
};

const OpCard = ({
  icon: Icon, label, value, tone, onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: keyof typeof opToneClasses;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "border rounded-xl p-4 text-left transition-all flex items-center gap-3",
      opToneClasses[tone],
      onClick && "hover:shadow-sm hover:-translate-y-0.5 cursor-pointer",
    )}
  >
    <Icon className="w-5 h-5 shrink-0" />
    <div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs font-medium opacity-80 mt-1">{label}</p>
    </div>
  </button>
);

const HighlightCard = ({
  icon: Icon, title, value, description, actionLabel, onAction,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <Card>
    <CardContent className="p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 flex-1">{description}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAction}
        className="mt-3 self-start text-xs h-7 px-2 -ml-2 text-primary hover:text-primary hover:bg-primary/10"
      >
        {actionLabel} →
      </Button>
    </CardContent>
  </Card>
);

const EmptyChart = ({ label }: { label: string }) => (
  <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground">
    <Sparkles className="w-8 h-8 opacity-30 mb-2" />
    <p className="text-sm">{label}</p>
  </div>
);

export default DashboardOverview;
