import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, AlertTriangle, ExternalLink, UserCheck, UserPlus, UserX, Search, FileDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

type FilterMode = "all" | "linked" | "unlinked";

const formatBRL = (cents: number) =>
  ((cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

const CrmSyncAuditCard = ({ limit = 50 }: { limit?: number }) => {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<FilterMode>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["crm-audit-paid-orders", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_orders")
        .select("id, customer_name, customer_email, customer_phone, total_cents, status, created_at, metadata")
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });

  const clientIds = useMemo(
    () =>
      Array.from(
        new Set(
          orders
            .map((o: any) => (o.metadata?.client_id as string | undefined) || null)
            .filter((x): x is string => !!x),
        ),
      ),
    [orders],
  );

  const { data: linkedClients = [] } = useQuery({
    queryKey: ["crm-audit-linked-clients", clientIds],
    enabled: clientIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone, is_vip")
        .in("id", clientIds);
      if (error) throw error;
      return data || [];
    },
  });

  const clientMap = useMemo(() => {
    const m = new Map<string, any>();
    linkedClients.forEach((c: any) => m.set(c.id, c));
    return m;
  }, [linkedClients]);

  const rows = useMemo(() => {
    return orders.map((o: any) => {
      const clientId = (o.metadata?.client_id as string | undefined) || null;
      const agendaId = (o.metadata?.agenda_event_id as string | undefined) || null;
      const client = clientId ? clientMap.get(clientId) : null;
      return {
        ...o,
        clientId,
        agendaId,
        client,
        linked: !!client,
      };
    });
  }, [orders, clientMap]);

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      if (mode === "linked" && !r.linked) return false;
      if (mode === "unlinked" && r.linked) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (r.customer_name || "").toLowerCase().includes(q) ||
        (r.customer_email || "").toLowerCase().includes(q) ||
        (r.customer_phone || "").toLowerCase().includes(q) ||
        (r.client?.name || "").toLowerCase().includes(q) ||
        r.id.toLowerCase().startsWith(q)
      );
    });
  }, [rows, mode, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const linked = rows.filter((r: any) => r.linked).length;
    const withAgenda = rows.filter((r: any) => !!r.agendaId).length;
    return { total, linked, unlinked: total - linked, withAgenda };
  }, [rows]);

  const exportCsv = () => {
    const header = [
      "pedido_id",
      "data",
      "cliente_pedido",
      "email_pedido",
      "telefone_pedido",
      "total_brl",
      "client_id_crm",
      "cliente_crm",
      "agenda_event_id",
      "status_sync",
    ];
    const lines = filtered.map((r: any) =>
      [
        r.id,
        r.created_at ? format(parseISO(r.created_at), "yyyy-MM-dd HH:mm") : "",
        r.customer_name || "",
        r.customer_email || "",
        r.customer_phone || "",
        ((r.total_cents || 0) / 100).toFixed(2).replace(".", ","),
        r.clientId || "",
        r.client?.name || "",
        r.agendaId || "",
        r.linked ? "vinculado" : "sem_vinculo",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const csv = "\ufeff" + [header.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-crm-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Auditoria de Sincronização — CRM</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pedidos pagos recentes e o cliente vinculado automaticamente.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
            <FileDown className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatPill label="Pedidos pagos" value={stats.total} icon={<ShieldCheck className="w-3.5 h-3.5" />} tone="primary" />
          <StatPill label="Vinculados" value={stats.linked} icon={<UserCheck className="w-3.5 h-3.5" />} tone="emerald" />
          <StatPill label="Sem vínculo" value={stats.unlinked} icon={<UserX className="w-3.5 h-3.5" />} tone="amber" />
          <StatPill label="Com agenda" value={stats.withAgenda} icon={<UserPlus className="w-3.5 h-3.5" />} tone="violet" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={mode} onValueChange={(v) => setMode(v as FilterMode)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="linked">Apenas vinculados</SelectItem>
              <SelectItem value="unlinked">Sem vínculo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum pedido pago encontrado com os filtros atuais.
          </p>
        ) : (
          <div className="rounded-md border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Pedido</th>
                    <th className="text-left px-3 py-2 font-medium">Data</th>
                    <th className="text-left px-3 py-2 font-medium">Cliente no pedido</th>
                    <th className="text-left px-3 py-2 font-medium">Cliente vinculado (CRM)</th>
                    <th className="text-left px-3 py-2 font-medium">Total</th>
                    <th className="text-left px-3 py-2 font-medium">Status sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((r: any) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 align-top">
                        <Link
                          to={`/pedido/${r.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          #{shortId(r.id)} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap text-xs text-muted-foreground">
                        {r.created_at ? format(parseISO(r.created_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-foreground">{r.customer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                          {r.customer_email && <div className="truncate max-w-[220px]">{r.customer_email}</div>}
                          {r.customer_phone && <div>{r.customer_phone}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {r.client ? (
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-1.5">
                              {r.client.name}
                              {r.client.is_vip && (
                                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400">
                                  VIP
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                              {r.client.email && <div className="truncate max-w-[220px]">{r.client.email}</div>}
                              {r.client.phone && <div>{r.client.phone}</div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top tabular-nums whitespace-nowrap font-medium">
                        {formatBRL(r.total_cents)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {r.linked ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 gap-1">
                            <UserCheck className="w-3 h-3" /> Vinculado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30 gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sem vínculo
                          </Badge>
                        )}
                        {r.agendaId && (
                          <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                            agenda: {shortId(r.agendaId)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatPill = ({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "primary" | "emerald" | "amber" | "violet";
}) => {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  };
  return (
    <div className={`rounded-md border px-3 py-2 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold mt-0.5 tabular-nums">{value}</div>
    </div>
  );
};

export default CrmSyncAuditCard;
