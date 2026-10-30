import { useState, useMemo } from "react";
import {
  MessageSquare, Send, Eye, Users, Clock, Search, Phone, Loader2,
  CheckSquare, Square, CheckCheck, Gift, Calendar, Mail,
  BarChart3, TrendingUp, Star, Cake,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TemplateInlineEditor from "@/components/admin/TemplateInlineEditor";
import { differenceInDays, format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterType = "all" | "inactive" | "birthdays";

const PAGE_SIZE = 10;

const MarketingTab = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const selectedTemplate = useMemo(() => {
    if (selectedTemplateId) return templates.find((t) => t.id === selectedTemplateId) || templates[0];
    return templates[0];
  }, [templates, selectedTemplateId]);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["marketing-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const now = new Date();
  const nextMonth = addMonths(now, 1);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !(c.phone || "").includes(q)) return false;
      }
      if (filter === "inactive") {
        if (!c.last_purchase_date) return true;
        return differenceInDays(now, new Date(c.last_purchase_date)) > 30;
      }
      if (filter === "birthdays") {
        if (!c.birthday) return false;
        const bMonth = new Date(c.birthday + "T12:00:00").getMonth();
        return bMonth === now.getMonth() || bMonth === nextMonth.getMonth();
      }
      return true;
    });
  }, [clients, filter, search, now]);

  const stats = useMemo(() => {
    const inactive = clients.filter((c) => !c.last_purchase_date || differenceInDays(now, new Date(c.last_purchase_date)) > 30).length;
    const birthdays = clients.filter((c) => {
      if (!c.birthday) return false;
      const bMonth = new Date(c.birthday + "T12:00:00").getMonth();
      return bMonth === now.getMonth() || bMonth === addMonths(now, 1).getMonth();
    }).length;
    return { total: clients.length, inactive, birthdays };
  }, [clients]);

  const marketingStats = useMemo(() => {
    const contacted = clients.filter((c) => c.last_message_date).length;
    const contactRate = clients.length > 0 ? Math.round((contacted / clients.length) * 100) : 0;

    // Most engaged: clients with most recent messages
    const engaged = [...clients]
      .filter((c) => c.last_message_date)
      .sort((a, b) => new Date(b.last_message_date!).getTime() - new Date(a.last_message_date!).getTime())
      .slice(0, 5);

    return { contacted, contactRate, engaged };
  }, [clients]);

  function getMessageForClient(client: any) {
    if (!selectedTemplate) return "";
    return selectedTemplate.template.replace("{nome}", client.name.split(" ")[0]);
  }

  function buildWhatsAppUrl(phone: string, message: string) {
    const url = new URL("https://api.whatsapp.com/send/");
    url.searchParams.set("phone", `55${phone}`);
    url.searchParams.set("text", message);
    url.searchParams.set("type", "phone_number");
    url.searchParams.set("app_absent", "0");
    return url.toString();
  }

  async function sendAndTrack(client: any) {
    const phone = (client.phone || "").replace(/\D/g, "");
    if (!phone) return false;
    const msg = getMessageForClient(client);
    window.open(buildWhatsAppUrl(phone, msg), "_blank", "noopener,noreferrer");
    try {
      // Registra no histórico de mensagens do cliente (trigger atualiza last_message_date)
      const summary = `[${selectedTemplate?.name || "Mensagem"}] ${msg}`.slice(0, 500);
      await supabase.from("client_messages").insert({
        client_id: client.id,
        channel: "whatsapp",
        summary,
      });
    } catch {}
    return true;
  }

  async function openWhatsApp(client: any) {
    const phone = (client.phone || "").replace(/\D/g, "");
    if (!phone) {
      toast({ title: "Cliente sem telefone cadastrado", variant: "destructive" });
      return;
    }
    await sendAndTrack(client);
    queryClient.invalidateQueries({ queryKey: ["marketing-clients"] });
  }

  async function handleBulkSend() {
    if (selectedIds.size === 0 || !selectedTemplate) return;
    setBulkSending(true);
    let sent = 0;
    let noPhone = 0;
    const selected = filteredClients.filter((c) => selectedIds.has(c.id));

    for (const client of selected) {
      const ok = await sendAndTrack(client);
      if (ok) sent++;
      else noPhone++;
      await new Promise((r) => setTimeout(r, 600));
    }

    queryClient.invalidateQueries({ queryKey: ["marketing-clients"] });
    setSelectedIds(new Set());
    setBulkSending(false);
    toast({
      title: `${sent} mensagen${sent !== 1 ? "s" : ""} enviada${sent !== 1 ? "s" : ""}`,
      description: noPhone > 0 ? `${noPhone} cliente(s) sem telefone` : undefined,
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const pClients = filteredClients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const allSelected = pClients.every((c) => selectedIds.has(c.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pClients.forEach((c) => {
        if (allSelected) next.delete(c.id);
        else next.add(c.id);
      });
      return next;
    });
  }

  const pageClients = filteredClients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allPageSelected = pageClients.length > 0 && pageClients.every((c) => selectedIds.has(c.id));
  const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);

  const filterButtons: { key: FilterType; label: string; icon: React.ElementType; count: number }[] = [
    { key: "all", label: "Todos", icon: Users, count: stats.total },
    { key: "inactive", label: "Inativos (+30d)", icon: Clock, count: stats.inactive },
    { key: "birthdays", label: "Aniversariantes", icon: Gift, count: stats.birthdays },
  ];

  return (
    <div>
      {/* Stats / Filters */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {filterButtons.map((fb) => (
          <motion.button
            key={fb.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setFilter(fb.key); setPage(1); setSelectedIds(new Set()); }}
            className={`bg-card border rounded-lg p-3 text-left transition-all ${
              filter === fb.key ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <fb.icon className={`w-4 h-4 ${filter === fb.key ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-medium text-muted-foreground">{fb.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{fb.count}</p>
          </motion.button>
        ))}
      </div>

      {/* Marketing Statistics */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Estatísticas de Marketing</h2>
            <p className="text-xs text-muted-foreground">Resumo de engajamento via WhatsApp</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <Send className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{marketingStats.contacted}</p>
            <p className="text-[11px] text-muted-foreground">Mensagens Enviadas</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{marketingStats.contactRate}%</p>
            <p className="text-[11px] text-muted-foreground">Taxa de Contato</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{marketingStats.engaged.length}</p>
            <p className="text-[11px] text-muted-foreground">Engajados Recentes</p>
          </div>
        </div>

        {marketingStats.engaged.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">🏆 Clientes mais engajados <span className="font-normal opacity-70">(por última mensagem enviada)</span></p>
            <div className="space-y-1.5">
              {marketingStats.engaged.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-foreground truncate flex-1">{c.name}</span>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    {c.last_message_date && (
                      <span title="Última mensagem enviada" className="flex items-center gap-1">
                        <Send className="w-3 h-3" /> Últ. msg: {format(new Date(c.last_message_date), "dd/MM", { locale: ptBR })}
                      </span>
                    )}
                    {c.last_purchase_date && (
                      <span title="Data da última compra" className="flex items-center gap-1 text-primary/80">
                        <Gift className="w-3 h-3" /> Últ. compra: {format(new Date(c.last_purchase_date), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Modelo de Mensagem</h2>
            <p className="text-xs text-muted-foreground">Selecione, edite ou crie modelos. Use <code className="bg-muted px-1 rounded">{"{nome}"}</code> para personalizar.</p>
          </div>
        </div>

        <TemplateInlineEditor
          templates={templates}
          selectedTemplateId={selectedTemplate?.id || null}
          onSelect={(id) => setSelectedTemplateId(id)}
          loading={loadingTemplates}
        />
      </div>

      {/* Message Preview */}
      {selectedTemplate && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Preview da Mensagem</span>
          </div>
          <div className="bg-[#0b141a] rounded-xl p-4 max-w-md">
            <div className="bg-[#005c4b] rounded-lg px-3 py-2 text-sm text-white whitespace-pre-wrap leading-relaxed">
              {selectedTemplate.template.replace("{nome}", "CLIENTE")}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-white/60">{format(new Date(), "HH:mm")}</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">O nome <strong>{"{nome}"}</strong> será substituído pelo primeiro nome do cliente</p>
        </div>
      )}

      {/* Client List */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-foreground">
              {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""}
            </p>
            {selectedIds.size > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {selectedIds.size > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkSend}
              disabled={bulkSending || !selectedTemplate}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Enviar para {selectedIds.size} cliente{selectedIds.size !== 1 ? "s" : ""}
            </motion.button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum cliente neste filtro</p>
          </div>
        ) : (
          <>
            {/* Select all on page */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {allPageSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                {allPageSelected ? "Desmarcar página" : "Selecionar página"}
              </button>
            </div>

            <div className="space-y-2">
              {pageClients.map((client, i) => {
                const daysSince = client.last_purchase_date
                  ? differenceInDays(now, new Date(client.last_purchase_date))
                  : null;
                const lastMsg = client.last_message_date
                  ? new Date(client.last_message_date)
                  : null;
                const isSelected = selectedIds.has(client.id);

                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isSelected ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"
                    }`}
                  >
                    <button onClick={() => toggleSelect(client.id)} className="shrink-0">
                      {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                        {client.name}
                        {(() => {
                          if (!client.birthday) return null;
                          const bd = new Date(client.birthday + "T12:00:00");
                          const today = new Date();
                          const isBdayToday = bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth();
                          return isBdayToday ? (
                            <span title="Aniversário hoje! 🎂" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-300 text-[10px] font-bold">
                              <Cake className="w-3 h-3" /> Hoje!
                            </span>
                          ) : null;
                        })()}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {client.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>
                        )}
                        {daysSince !== null ? (
                          <span className={`flex items-center gap-1 ${daysSince > 30 ? "text-destructive" : ""}`}>
                            <Gift className="w-3 h-3" />{daysSince}d atrás
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive">
                            <Gift className="w-3 h-3" />Nunca comprou
                          </span>
                        )}
                        {client.birthday && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(client.birthday + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                        )}
                        {lastMsg && (
                          <span className="flex items-center gap-1 text-primary/70">
                            <Mail className="w-3 h-3" />Msg {format(lastMsg, "dd/MM", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => openWhatsApp(client)}
                      disabled={!selectedTemplate}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:brightness-110 transition-all shrink-0 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />Enviar
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MarketingTab;
