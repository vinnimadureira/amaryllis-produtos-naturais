import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  BarChart3, Users, Package, CalendarDays, DollarSign, Star,
  TrendingUp, ShoppingBag, MessageSquare, Camera, Megaphone, Loader2, FileDown, Eye,
  User, MessageCircle, Cake, MapPin, FileText, StickyNote, Hash,
} from "lucide-react";
import { format, parseISO, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import EventDetailDialog from "./EventDetailDialog";
import PurchaseEventResolver from "./PurchaseEventResolver";
import ClientDetailDialog from "./ClientDetailDialog";
import CrmSyncAuditCard from "./CrmSyncAuditCard";

// Detect auto-generated purchase entries (linked to an agenda event)
const PURCHASE_EVENT_TAG_RE = /^\s*\[evento:([0-9a-f-]+)\]\s*/i;
const extractPurchaseEventId = (notes: string | null | undefined): string | null => {
  if (!notes) return null;
  const m = notes.match(PURCHASE_EVENT_TAG_RE);
  return m ? m[1] : null;
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type DetailKind = "purchase" | "event" | "order" | "client";

const ReportsTab = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string>(String(currentYear));
  const [month, setMonth] = useState<string>("all");
  const [detail, setDetail] = useState<{ kind: DetailKind; data: any } | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading: loadingC } = useQuery({
    queryKey: ["reports-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, phone, email, address, notes, is_vip, created_at, last_purchase_date, last_message_date, birthday, street, number, neighborhood, complement, city, state, cep");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: purchases = [], isLoading: loadingP } = useQuery({
    queryKey: ["reports-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_purchases")
        .select("id, amount, purchase_date, product, notes, created_at, client_id, clients(id, name, phone, email)")
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [], isLoading: loadingPr } = useQuery({
    queryKey: ["reports-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, active, featured, category, created_at, price");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["reports-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_events")
        .select("id, title, tipo, status, valor, scheduled_date, end_date, production_start_date, payment_method, client_name, client_id, produto, description, notes, endereco, phone, email, color, created_at, clients(id, name, phone, email)")
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const orders: any[] = [];

  const { data: testimonials = [] } = useQuery({
    queryKey: ["reports-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("id, name, rating, active, created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: gallery = [] } = useQuery({
    queryKey: ["reports-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_photos").select("id, active, created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["reports-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id, active, created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["reports-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_messages").select("id, message_date");
      if (error) throw error;
      return data || [];
    },
  });

  const yearsAvailable = useMemo(() => {
    const years = new Set<number>([currentYear]);
    purchases.forEach((p: any) => p.purchase_date && years.add(getYear(parseISO(p.purchase_date))));
    events.forEach((e: any) => e.scheduled_date && years.add(getYear(parseISO(e.scheduled_date))));
    clients.forEach((c: any) => c.created_at && years.add(getYear(parseISO(c.created_at))));
    orders.forEach((o: any) => o.created_at && years.add(getYear(parseISO(o.created_at))));
    return Array.from(years).sort((a, b) => b - a);
  }, [purchases, events, clients, orders, currentYear]);

  function inFilter(dateStr: string | null | undefined) {
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    if (year !== "all" && String(getYear(d)) !== year) return false;
    if (month !== "all" && String(getMonth(d)) !== month) return false;
    return true;
  }

  const filtered = useMemo(() => {
    return {
      purchases: purchases.filter((p: any) => inFilter(p.purchase_date)),
      events: events.filter((e: any) => inFilter(e.scheduled_date)),
      orders: orders.filter((o: any) => inFilter(o.created_at)),
      clients: clients.filter((c: any) => inFilter(c.created_at)),
      messages: messages.filter((m: any) => inFilter(m.message_date)),
      testimonials: testimonials.filter((t: any) => inFilter(t.created_at)),
      products: products.filter((p: any) => inFilter(p.created_at)),
    };
  }, [purchases, events, orders, clients, messages, testimonials, products, year, month]);

  const stats = useMemo(() => {
    const revenueP = filtered.purchases.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const revenueE = filtered.events
      .filter((e: any) => e.status !== "cancelado")
      .reduce((s: number, e: any) => s + (Number(e.valor) || 0), 0);
    const totalRevenue = revenueP + revenueE;

    const paymentBreakdown: Record<string, number> = {};
    filtered.events.forEach((e: any) => {
      if (e.status === "cancelado") return;
      const m = e.payment_method || "não informado";
      paymentBreakdown[m] = (paymentBreakdown[m] || 0) + (Number(e.valor) || 0);
    });

    return {
      totalRevenue,
      purchasesCount: filtered.purchases.length,
      eventsCount: filtered.events.length,
      eventsDelivered: filtered.events.filter((e: any) => e.status === "entregue").length,
      eventsCancelled: filtered.events.filter((e: any) => e.status === "cancelado").length,
      ordersCount: filtered.orders.length,
      newClients: filtered.clients.length,
      messagesCount: filtered.messages.length,
      testimonialsCount: filtered.testimonials.length,
      newProducts: filtered.products.length,
      paymentBreakdown,
    };
  }, [filtered]);

  const totals = useMemo(() => ({
    clients: clients.length,
    products: products.length,
    productsActive: products.filter((p: any) => p.active).length,
    productsFeatured: products.filter((p: any) => p.featured).length,
    testimonials: testimonials.length,
    testimonialsActive: testimonials.filter((t: any) => t.active).length,
    avgRating: testimonials.length ? (testimonials.reduce((s: number, t: any) => s + (t.rating || 0), 0) / testimonials.length) : 0,
    gallery: gallery.length,
    galleryActive: gallery.filter((g: any) => g.active).length,
    campaigns: campaigns.length,
    campaignsActive: campaigns.filter((c: any) => c.active).length,
    events: events.length,
    purchases: purchases.length,
    revenue: purchases.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
      + events.filter((e: any) => e.status !== "cancelado").reduce((s: number, e: any) => s + (Number(e.valor) || 0), 0),
  }), [clients, products, testimonials, gallery, campaigns, events, purchases]);

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const fmtDate = (s: string) => format(parseISO(s), "dd/MM/yyyy", { locale: ptBR });

  const isLoading = loadingC || loadingP || loadingPr;

  const filterLabel = month === "all"
    ? (year === "all" ? "Todo o período" : `Ano de ${year}`)
    : `${MONTHS[Number(month)]} de ${year}`;

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header (apenas primeira página)
      doc.setFillColor(196, 136, 139);
      doc.rect(0, 0, pageWidth, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("7S Soluções — Relatório", 14, 12);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Período: ${filterLabel}`, 14, 19);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageWidth - 14, 19, { align: "right" });

      // Helper para títulos de seção compactos
      const sectionTitle = (text: string, count?: number) => {
        const startY = ((doc as any).lastAutoTable?.finalY ?? 28) + 8;
        // Quebra de página se faltar espaço
        if (startY > pageHeight - 25) {
          doc.addPage();
          (doc as any).lastAutoTable = { finalY: 14 };
        }
        const y = ((doc as any).lastAutoTable?.finalY ?? 14) + 8;
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        const label = count !== undefined ? `${text}  (${count})` : text;
        doc.text(label, 14, y);
        return y + 2;
      };

      // Helper para ordenar por data desc (espelha a tela)
      const sortByDateDesc = <T,>(arr: T[], getter: (x: T) => string | null | undefined): T[] => {
        return [...arr].sort((a, b) => {
          const da = getter(a) ? new Date(getter(a) as string).getTime() : 0;
          const db = getter(b) ? new Date(getter(b) as string).getTime() : 0;
          return db - da;
        });
      };

      // === Resumo do período ===
      let titleY = 35;
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo do período", 14, titleY);

      autoTable(doc, {
        startY: titleY + 3,
        head: [["Métrica", "Valor"]],
        body: [
          ["Receita Total", formatBRL(stats.totalRevenue)],
          ["Eventos Agendados", String(stats.eventsCount)],
          ["Eventos Entregues", String(stats.eventsDelivered)],
          ["Eventos Cancelados", String(stats.eventsCancelled)],
          ["Compras Registradas", String(stats.purchasesCount)],
          ["Novos Clientes", String(stats.newClients)],
          ["Pedidos do Site", String(stats.ordersCount)],
          ["Mensagens Enviadas", String(stats.messagesCount)],
          ["Novos Depoimentos", String(stats.testimonialsCount)],
          ["Novos Produtos", String(stats.newProducts)],
        ],
        theme: "striped",
        headStyles: { fillColor: [196, 136, 139], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 1.5 },
        margin: { left: 14, right: 14 },
      });

      // === Receita por forma de pagamento ===
      if (Object.keys(stats.paymentBreakdown).length > 0) {
        const total = Object.values(stats.paymentBreakdown).reduce((s, v) => s + v, 0);
        const startY = sectionTitle("Receita por forma de pagamento");
        autoTable(doc, {
          startY,
          head: [["Forma de pagamento", "Total", "%"]],
          body: Object.entries(stats.paymentBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([m, v]) => [m, formatBRL(v), `${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%`]),
          theme: "striped",
          headStyles: { fillColor: [196, 136, 139], fontSize: 9 },
          styles: { fontSize: 9, cellPadding: 1.5 },
          margin: { left: 14, right: 14 },
        });
      }

      // === Compras do período ===
      if (filtered.purchases.length) {
        const startY = sectionTitle("Compras do período", filtered.purchases.length);
        autoTable(doc, {
          startY,
          head: [["Data", "Cliente", "Produto", "Valor"]],
          body: sortByDateDesc(filtered.purchases as any[], (p) => p.purchase_date).map((p: any) => [
            fmtDate(p.purchase_date),
            p.clients?.name || "—",
            p.product || "—",
            formatBRL(Number(p.amount) || 0),
          ]),
          theme: "grid",
          headStyles: { fillColor: [196, 136, 139], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 1.5 },
          margin: { left: 14, right: 14 },
        });
      }

      // === Eventos da agenda ===
      if (filtered.events.length) {
        const startY = sectionTitle("Eventos da agenda", filtered.events.length);
        autoTable(doc, {
          startY,
          head: [["Data", "Título", "Cliente", "Tipo", "Status", "Pagamento", "Valor"]],
          body: sortByDateDesc(filtered.events as any[], (e) => e.scheduled_date).map((e: any) => [
            fmtDate(e.scheduled_date),
            e.title || "—",
            e.client_name || "—",
            e.tipo || "—",
            e.status || "—",
            e.payment_method || "—",
            formatBRL(Number(e.valor) || 0),
          ]),
          theme: "grid",
          headStyles: { fillColor: [196, 136, 139], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 1.5 },
          margin: { left: 14, right: 14 },
        });
      }

      // === Pedidos do site ===
      if (filtered.orders.length) {
        const startY = sectionTitle("Pedidos do site", filtered.orders.length);
        autoTable(doc, {
          startY,
          head: [["Data", "Cliente", "Produto", "Status"]],
          body: sortByDateDesc(filtered.orders as any[], (o) => o.created_at).map((o: any) => [
            fmtDate(o.created_at),
            o.nome || "—",
            o.produto || "—",
            o.status || "—",
          ]),
          theme: "grid",
          headStyles: { fillColor: [196, 136, 139], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 1.5 },
          margin: { left: 14, right: 14 },
        });
      }

      // === Novos clientes ===
      if (filtered.clients.length) {
        const startY = sectionTitle("Novos clientes", filtered.clients.length);
        autoTable(doc, {
          startY,
          head: [["Data cadastro", "Nome"]],
          body: sortByDateDesc(filtered.clients as any[], (c) => c.created_at).map((c: any) => [
            fmtDate(c.created_at),
            c.name || "—",
          ]),
          theme: "grid",
          headStyles: { fillColor: [196, 136, 139], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 1.5 },
          margin: { left: 14, right: 14 },
        });
      }

      // === Total Geral (todo o período) ===
      const startY = sectionTitle("Total Geral (todo o período)");
      autoTable(doc, {
        startY,
        head: [["Métrica", "Valor"]],
        body: [
          ["Receita Acumulada", formatBRL(totals.revenue)],
          ["Clientes", String(totals.clients)],
          ["Produtos (ativos / total)", `${totals.productsActive} / ${totals.products}`],
          ["Em Destaque", String(totals.productsFeatured)],
          ["Eventos Agenda", String(totals.events)],
          ["Compras Históricas", String(totals.purchases)],
          ["Depoimentos (ativos / total)", `${totals.testimonialsActive} / ${totals.testimonials}${totals.avgRating ? ` — Média ${totals.avgRating.toFixed(1)}★` : ""}`],
          ["Galeria (ativas / total)", `${totals.galleryActive} / ${totals.gallery}`],
          ["Campanhas (ativas / total)", `${totals.campaignsActive} / ${totals.campaigns}`],
        ],
        theme: "striped",
        headStyles: { fillColor: [196, 136, 139], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 1.5 },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: "right" }
        );
        doc.text(
          `7S Soluções — ${filterLabel}`,
          14,
          pageHeight - 8,
        );
      }

      const fileName = `relatorio-${year}${month !== "all" ? `-${String(Number(month) + 1).padStart(2, "0")}` : ""}.pdf`;
      doc.save(fileName);
      toast({ title: "PDF gerado", description: fileName });
    } catch (err: any) {
      toast({ title: "Erro ao gerar PDF", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold">Relatórios</h2>
              <p className="text-xs text-muted-foreground">Análise de desempenho e métricas do negócio</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos anos</SelectItem>
                {yearsAvailable.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ano inteiro</SelectItem>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportPDF} className="gap-2">
              <FileDown className="w-4 h-4" /> Salvar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CRM Sync Audit */}
      <CrmSyncAuditCard limit={50} />

      {/* Period Stats */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Período: {filterLabel}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Receita Total" value={formatBRL(stats.totalRevenue)} icon={<DollarSign className="w-5 h-5" />} accent="emerald" />
          <MetricCard label="Eventos Agendados" value={stats.eventsCount} icon={<CalendarDays className="w-5 h-5" />} accent="violet" />
          <MetricCard label="Eventos Entregues" value={stats.eventsDelivered} icon={<TrendingUp className="w-5 h-5" />} accent="teal" />
          <MetricCard label="Compras Registradas" value={stats.purchasesCount} icon={<ShoppingBag className="w-5 h-5" />} accent="rose" />
          <MetricCard label="Novos Clientes" value={stats.newClients} icon={<Users className="w-5 h-5" />} accent="sky" />
          <MetricCard label="Pedidos do Site" value={stats.ordersCount} icon={<Package className="w-5 h-5" />} accent="amber" />
          <MetricCard label="Mensagens Enviadas" value={stats.messagesCount} icon={<MessageSquare className="w-5 h-5" />} accent="primary" />
          <MetricCard label="Novos Depoimentos" value={stats.testimonialsCount} icon={<Star className="w-5 h-5" />} accent="amber" />
        </div>
      </div>

      {/* Payment breakdown */}
      {Object.keys(stats.paymentBreakdown).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Receita por forma de pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.paymentBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([method, value]) => {
                  const total = Object.values(stats.paymentBreakdown).reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? (value / total) * 100 : 0;
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize text-foreground font-medium">{method}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatBRL(value)} <span className="text-xs">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytical lists */}
      <AnalyticalSection title="Compras do período" icon={<ShoppingBag className="w-4 h-4" />} count={filtered.purchases.length}>
        <ListTable
          headers={["Data", "Cliente", "Produto", "Valor"]}
          rows={filtered.purchases.map((p: any) => ({
            cells: [
              fmtDate(p.purchase_date),
              p.clients?.name || "—",
              p.product || "—",
              formatBRL(Number(p.amount) || 0),
            ],
            data: p,
            sortKey: p.purchase_date || p.created_at || null,
          }))}
          empty="Nenhuma compra no período."
          onRowClick={(p) => setDetail({ kind: "purchase", data: p })}
        />
      </AnalyticalSection>

      <AnalyticalSection title="Eventos da agenda" icon={<CalendarDays className="w-4 h-4" />} count={filtered.events.length}>
        <ListTable
          headers={["Data", "Título", "Cliente", "Tipo", "Status", "Pagamento", "Valor"]}
          rows={filtered.events.map((e: any) => ({
            cells: [
              fmtDate(e.scheduled_date),
              e.title || "—",
              e.client_name || "—",
              e.tipo || "—",
              e.status || "—",
              e.payment_method || "—",
              formatBRL(Number(e.valor) || 0),
            ],
            data: e,
            sortKey: e.scheduled_date || e.created_at || null,
          }))}
          empty="Nenhum evento no período."
          onRowClick={(e) => setDetail({ kind: "event", data: e })}
        />
      </AnalyticalSection>

      {/* Seção "Pedidos do site" removida — duplicava "Compras do período". */}

      <AnalyticalSection title="Novos clientes" icon={<Users className="w-4 h-4" />} count={filtered.clients.length}>
        <ListTable
          headers={["Data cadastro", "Nome"]}
          rows={filtered.clients.map((c: any) => ({
            cells: [
              fmtDate(c.created_at),
              c.name || "—",
            ],
            data: c,
            sortKey: c.created_at || null,
          }))}
          empty="Nenhum cliente novo no período."
          onRowClick={(c) => setDetail({ kind: "client", data: c })}
        />
      </AnalyticalSection>

      {/* Geral / total */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Total Geral (todo o período)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Receita Acumulada" value={formatBRL(totals.revenue)} icon={<DollarSign className="w-5 h-5" />} accent="emerald" />
          <MetricCard label="Clientes" value={totals.clients} icon={<Users className="w-5 h-5" />} accent="sky" />
          <MetricCard label="Produtos" value={`${totals.productsActive}/${totals.products}`} sub="ativos / total" icon={<Package className="w-5 h-5" />} accent="rose" />
          <MetricCard label="Em Destaque" value={totals.productsFeatured} icon={<Star className="w-5 h-5" />} accent="amber" />
          <MetricCard label="Eventos Agenda" value={totals.events} icon={<CalendarDays className="w-5 h-5" />} accent="violet" />
          <MetricCard label="Compras Históricas" value={totals.purchases} icon={<ShoppingBag className="w-5 h-5" />} accent="primary" />
          <MetricCard
            label="Depoimentos"
            value={`${totals.testimonialsActive}/${totals.testimonials}`}
            sub={totals.avgRating ? `Média ${totals.avgRating.toFixed(1)}★` : "—"}
            icon={<MessageSquare className="w-5 h-5" />}
            accent="amber"
          />
          <MetricCard label="Galeria" value={`${totals.galleryActive}/${totals.gallery}`} sub="ativas / total" icon={<Camera className="w-5 h-5" />} accent="teal" />
          <MetricCard label="Campanhas" value={`${totals.campaignsActive}/${totals.campaigns}`} sub="ativas / total" icon={<Megaphone className="w-5 h-5" />} accent="rose" />
        </div>
      </div>

      {/* Detail dialog — for events (and purchases linked to events), use the shared
          EventDetailDialog so the layout matches the agenda view (closed inputs, 3 tabs).
          For other kinds (orders, clients, manual purchases), keep the inline dialog. */}
      {(() => {
        if (!detail) return null;
        if (detail.kind === "event") {
          return (
            <EventDetailDialog
              open
              onOpenChange={(o) => !o && setDetail(null)}
              event={detail.data}
            />
          );
        }
        if (detail.kind === "purchase") {
          const eid = extractPurchaseEventId(detail.data?.notes);
          return (
            <PurchaseEventResolver
              open
              onOpenChange={(o) => !o && setDetail(null)}
              purchase={detail.data}
              hintedEventId={eid}
            />
          );
        }
        if (detail.kind === "client") {
          return (
            <ClientDetailDialog
              open
              onOpenChange={(o) => !o && setDetail(null)}
              client={detail.data}
              isVip={!!detail.data?.is_vip}
            />
          );
        }
        return null;
      })()}

      <Dialog
        open={!!detail && detail.kind !== "event" && detail.kind !== "purchase" && detail.kind !== "client"}
        onOpenChange={(o) => !o && setDetail(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detail && (() => {
            const d = detail.data;
            const kind = detail.kind;

            // Header (title + subtitle + accent badge)
            const meta: Record<DetailKind, { title: string; subtitle: string; icon: React.ReactNode; accent: string; badge?: string }> = {
              purchase: {
                title: d.product || "Compra",
                subtitle: d.purchase_date
                  ? format(parseISO(d.purchase_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : "",
                icon: <ShoppingBag className="w-5 h-5" />,
                accent: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                badge: "Compra",
              },
              event: {
                title: d.title || "Evento",
                subtitle: d.scheduled_date
                  ? format(parseISO(d.scheduled_date), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })
                  : "",
                icon: <CalendarDays className="w-5 h-5" />,
                accent: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
                badge: d.tipo,
              },
              order: {
                title: d.produto || d.nome || "Pedido",
                subtitle: d.created_at ? `Pedido em ${format(parseISO(d.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : "",
                icon: <Package className="w-5 h-5" />,
                accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                badge: d.status,
              },
              client: {
                title: d.name || "Cliente",
                subtitle: d.created_at ? `Cliente desde ${fmtDate(d.created_at)}` : "",
                icon: <Users className="w-5 h-5" />,
                accent: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                badge: d.is_vip ? "VIP" : undefined,
              },
            };
            const m = meta[kind];

            // Campo "fechado" estilo input desabilitado, somente leitura — padrão usado em todo o painel admin.
            const ReadField = ({
              label,
              icon,
              value,
              mono,
              className,
            }: {
              label: React.ReactNode;
              icon?: React.ReactNode;
              value: React.ReactNode;
              mono?: boolean;
              className?: string;
            }) => {
              const isEmpty =
                value === null ||
                value === undefined ||
                value === "" ||
                value === "—";
              return (
                <div className={cn("space-y-1.5", className)}>
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {icon}
                    {label}
                  </Label>
                  <div
                    className={cn(
                      "min-h-10 w-full rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground break-words",
                      mono && "tabular-nums",
                    )}
                  >
                    {isEmpty ? <span className="text-muted-foreground italic">—</span> : value}
                  </div>
                </div>
              );
            };

            // Build per-tab content
            const dashIfEmpty = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);

            // Cliente data resolution
            const cliente = kind === "client"
              ? d
              : (d.clients || null);
            const clienteNome =
              kind === "client" ? d.name :
              kind === "order" ? d.nome :
              (d.client_name || cliente?.name || "—");
            const clienteTelefone =
              kind === "order" ? d.whatsapp :
              cliente?.phone || "—";
            const clienteEmail = cliente?.email || (kind === "client" ? d.email : null) || "—";

            const waLink = (() => {
              const phone = (kind === "order" ? d.whatsapp : cliente?.phone) || "";
              const digits = String(phone).replace(/\D/g, "");
              if (!digits) return null;
              const fullDigits = digits.length <= 11 ? `55${digits}` : digits;
              return `https://wa.me/${fullDigits}`;
            })();

            const hasFinanceiro = kind === "purchase" || kind === "event";

            return (
              <>
                <DialogHeader className="pr-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${m.accent}`}>
                      {m.icon}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DialogTitle className="font-serif text-lg truncate">{m.title}</DialogTitle>
                        {m.badge && (
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">{m.badge}</Badge>
                        )}
                      </div>
                      {m.subtitle && (
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{m.subtitle}</p>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <Tabs defaultValue="detalhes" className="mt-2">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="detalhes" className="gap-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5" /> Detalhes
                    </TabsTrigger>
                    <TabsTrigger value="cliente" className="gap-1.5 text-xs">
                      <User className="w-3.5 h-3.5" /> Cliente
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" className="gap-1.5 text-xs" disabled={!hasFinanceiro}>
                      <DollarSign className="w-3.5 h-3.5" /> Financeiro
                    </TabsTrigger>
                  </TabsList>

                  {/* DETALHES */}
                  <TabsContent value="detalhes" className="mt-3 space-y-3">
                    {kind === "purchase" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReadField label="Data" value={fmtDate(d.purchase_date)} />
                          <ReadField label="Produto" value={dashIfEmpty(d.product)} />
                        </div>
                        <ReadField label="Observações" value={dashIfEmpty(d.notes)} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReadField label="Registrado em" value={d.created_at ? format(parseISO(d.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"} />
                          <ReadField label="ID" value={<code className="text-[10px] text-muted-foreground">{d.id}</code>} mono />
                        </div>
                      </>
                    )}
                    {kind === "event" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReadField label="Tipo" value={<span className="capitalize">{dashIfEmpty(d.tipo)}</span>} />
                          <ReadField label="Status" value={<Badge variant="outline" className="text-[10px] capitalize">{dashIfEmpty(d.status)}</Badge>} />
                        </div>
                        <ReadField label="Data / hora" value={
                          d.end_date && d.tipo === "producao"
                            ? `${format(parseISO(d.scheduled_date), "dd/MM/yyyy HH:mm", { locale: ptBR })} → ${format(parseISO(d.end_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}`
                            : format(parseISO(d.scheduled_date), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                        } />
                        <ReadField label="Produto" value={dashIfEmpty(d.produto)} />
                        <ReadField label="Descrição" value={dashIfEmpty(d.description)} />
                        <ReadField label="Observações" value={dashIfEmpty(d.notes)} />
                        <ReadField label="ID" value={<code className="text-[10px] text-muted-foreground">{d.id}</code>} mono />
                      </>
                    )}
                    {kind === "order" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReadField label="Data" value={format(parseISO(d.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
                          <ReadField label="Status" value={<Badge variant="outline" className="text-[10px] capitalize">{dashIfEmpty(d.status)}</Badge>} />
                        </div>
                        <ReadField label="Produto" value={dashIfEmpty(d.produto)} />
                        <ReadField label="Mensagem" value={dashIfEmpty(d.mensagem)} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReadField label="Rastreio" value={dashIfEmpty(d.tracking_code)} />
                          <ReadField label="Atualizado em" value={d.updated_at ? format(parseISO(d.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"} />
                        </div>
                        <ReadField label="ID" value={<code className="text-[10px] text-muted-foreground">{d.id}</code>} mono />
                      </>
                    )}
                    {kind === "client" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReadField label="Cadastro" value={fmtDate(d.created_at)} />
                          <ReadField label="Aniversário" value={d.birthday ? new Date(d.birthday + "T12:00:00").toLocaleDateString("pt-BR") : "—"} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReadField label="Última compra" value={d.last_purchase_date ? fmtDate(d.last_purchase_date) : "—"} />
                          <ReadField label="Última mensagem" value={d.last_message_date ? fmtDate(d.last_message_date) : "—"} />
                        </div>
                        
                        <ReadField label="Observações" value={dashIfEmpty(d.notes)} />
                        <ReadField label="ID" value={<code className="text-[10px] text-muted-foreground">{d.id}</code>} mono />
                      </>
                    )}
                  </TabsContent>

                  {/* CLIENTE */}
                  <TabsContent value="cliente" className="mt-3 space-y-3">
                    <ReadField label="Nome" value={clienteNome} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ReadField label="Telefone" value={dashIfEmpty(clienteTelefone)} />
                      <ReadField label="E-mail" value={dashIfEmpty(clienteEmail)} />
                    </div>
                    {kind === "event" && <ReadField label="Endereço" value={dashIfEmpty(d.endereco)} />}
                    {kind === "client" && <ReadField label="Endereço" value={dashIfEmpty(d.address)} />}
                    {waLink && (
                      <Button asChild variant="outline" className="w-full mt-1 gap-2 text-primary border-primary/40 hover:bg-primary/10 hover:text-primary">
                        <a href={waLink} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-4 h-4" /> Mensagem no WhatsApp
                        </a>
                      </Button>
                    )}
                  </TabsContent>

                  {/* FINANCEIRO */}
                  <TabsContent value="financeiro" className="mt-3 space-y-3">
                    {kind === "purchase" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ReadField label="Valor" value={<span className="font-semibold tabular-nums">{formatBRL(Number(d.amount) || 0)}</span>} mono />
                        <ReadField label="Data" value={fmtDate(d.purchase_date)} />
                      </div>
                    )}
                    {kind === "event" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReadField label="Valor" value={<span className="font-semibold tabular-nums">{formatBRL(Number(d.valor) || 0)}</span>} mono />
                          <ReadField label="Pagamento" value={dashIfEmpty(d.payment_method)} />
                        </div>
                        <ReadField label="Status" value={<span className="capitalize">{dashIfEmpty(d.status)}</span>} />
                      </>
                    )}
                    {!hasFinanceiro && (
                      <div className="rounded-md border border-border/60 bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                        Sem informações financeiras para este item.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const accentMap: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  primary: "bg-primary/10 text-primary",
};

const MetricCard = ({
  label, value, sub, icon, accent = "primary",
}: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent?: string }) => (
  <Card>
    <CardContent className="p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground tabular-nums truncate">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
        {icon}
      </div>
    </CardContent>
  </Card>
);

const AnalyticalSection = ({
  title, icon, count, children,
}: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        {title}
        <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

type Row = { cells: (string | number)[]; data?: any; sortKey?: string | number | null };

const ListTable = ({
  headers, rows, empty, onRowClick, dateColumnIndex = 0, pageSize = 10,
}: {
  headers: string[];
  rows: Row[];
  empty: string;
  onRowClick?: (data: any) => void;
  /** Índice da coluna usada para ordenação por data (padrão: 0). */
  dateColumnIndex?: number;
  pageSize?: number;
}) => {
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  // Ordena pelas datas reais (sortKey) — fallback para o texto da célula.
  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const ka = a.sortKey ?? a.cells[dateColumnIndex];
      const kb = b.sortKey ?? b.cells[dateColumnIndex];
      const va = ka == null ? 0 : (typeof ka === "number" ? ka : new Date(String(ka)).getTime() || 0);
      const vb = kb == null ? 0 : (typeof kb === "number" ? kb : new Date(String(kb)).getTime() || 0);
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return arr;
  }, [rows, sortDir, dateColumnIndex]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = sortedRows.slice(start, start + pageSize);

  // Reset para página 1 quando a quantidade de linhas muda (ex.: mudou filtro).
  const lastLenRef = useState({ v: rows.length })[0];
  if (lastLenRef.v !== rows.length) {
    lastLenRef.v = rows.length;
    if (page !== 1) setPage(1);
  }

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground text-center py-4">{empty}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h, idx) => {
                const isDateCol = idx === dateColumnIndex;
                return (
                  <th
                    key={h}
                    onClick={isDateCol ? () => setSortDir(d => d === "desc" ? "asc" : "desc") : undefined}
                    className={cn(
                      "text-left py-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider",
                      isDateCol && "cursor-pointer hover:text-foreground select-none",
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {h}
                      {isDateCol && (
                        <span className="text-[10px] opacity-70">
                          {sortDir === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
              {onRowClick && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={i}
                onClick={onRowClick && row.data ? () => onRowClick(row.data) : undefined}
                className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {row.cells.map((cell, j) => (
                  <td key={j} className="py-2 px-2 text-foreground tabular-nums">{cell}</td>
                ))}
                {onRowClick && (
                  <td className="py-2 px-2 text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
          <span className="tabular-nums">
            Mostrando {start + 1}–{Math.min(start + pageSize, sortedRows.length)} de {sortedRows.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={safePage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="px-2 tabular-nums">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={safePage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
