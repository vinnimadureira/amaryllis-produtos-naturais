import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Printer,
  Download,
  Heart,
  Gift,
  User,
  CalendarIcon,
  Sparkles,
  MapPin,
  CreditCard,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import logoLight from "@/assets/logo-light.png";

interface LineItem {
  qty: number;
  name: string;
  unit?: number;
  total?: number;
}

// Reusa a mesma lógica do AgendaTab: "2× Caixa Rosa @ 19.90 | 1× Kit Vela @ 50.00"
function parseItems(raw: string | null | undefined): LineItem[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((part) => {
      // captura sufixo opcional " @ <preço>"
      const priceMatch = part.match(/^(.*?)\s*@\s*([\d.,]+)\s*$/);
      const head = priceMatch ? priceMatch[1].trim() : part;
      const unit = priceMatch ? Number(priceMatch[2].replace(",", ".")) || 0 : 0;
      const m = head.match(/^(\d+)\s*[x×]\s*(.+)$/i);
      const qty = m ? Number(m[1]) || 1 : 1;
      const name = m ? m[2].trim() : head;
      return { qty, name, unit, total: unit * qty };
    });
}


const fmtBRL = (v: number) =>
  v > 0
    ? `R$ ${v.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_producao: "Em Produção",
  pronto: "Pronto",
  entregue: "Entregue",
  concluido: "Concluído",
  cancelado: "Cancelado",
  agendado: "Agendado",
};

const statusColors: Record<string, string> = {
  pendente: "bg-amber-50 text-amber-800 border-amber-200",
  confirmado: "bg-blue-50 text-blue-800 border-blue-200",
  em_producao: "bg-purple-50 text-purple-800 border-purple-200",
  pronto: "bg-emerald-50 text-emerald-800 border-emerald-200",
  entregue: "bg-emerald-50 text-emerald-800 border-emerald-200",
  concluido: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelado: "bg-red-50 text-red-800 border-red-200",
  agendado: "bg-blue-50 text-blue-800 border-blue-200",
};

const tipoLabels: Record<string, string> = {
  entrega: "Entrega",
  producao: "Produção",
  lembrete: "Lembrete",
  retirada: "Retirada",
};

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
  outro: "Outro",
};

const OrdemServico = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const company = useCompanyInfo();

  const { data: schedule, isLoading, error } = useQuery({
    queryKey: ["os-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os_public" as any)
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const { data: client } = useQuery({
    queryKey: ["os-client-public"],
    queryFn: async () => null,
    enabled: false,
  });

  // Auto-print quando aberto via ?print=1
  const shouldAutoPrint = searchParams.get("print") === "1";
  useEffect(() => {
    if (!shouldAutoPrint || !schedule) return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [shouldAutoPrint, schedule]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="bg-background border rounded-lg p-8 text-center space-y-3 max-w-md">
          <Heart className="w-10 h-10 mx-auto text-primary/40" />
          <p className="text-lg font-serif font-semibold text-foreground">
            Ordem de Serviço não encontrada
          </p>
          <p className="text-sm text-muted-foreground">
            Verifique o link e tente novamente.
          </p>
          <Button asChild variant="outline" size="sm">
            <a href="/">Voltar ao site</a>
          </Button>
        </div>
      </div>
    );
  }

  const s = schedule;
  const d = parseISO(s.scheduled_date);
  const purchaseDate = s.created_at ? parseISO(s.created_at) : null;
  const productionDate = s.production_start_date ? parseISO(s.production_start_date) : null;
  const clientName = s.client_name || client?.name || "—";
  const items = parseItems(s.produto);
  const itemsSubtotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
  const totalFromValor = Number(s.valor) || 0;
  const total = totalFromValor;
  const shippingCarrier = (s.shipping_carrier as string | null) || null;
  // Frete: diferença entre total e subtotal dos itens (quando há itens precificados)
  const shippingValue =
    itemsSubtotal > 0 && total > itemsSubtotal
      ? Math.round((total - itemsSubtotal) * 100) / 100
      : shippingCarrier === "Frete grátis"
        ? 0
        : null;
  const osNum = String(s.id).substring(0, 8).toUpperCase();
  const statusKey = s.status as string;
  const statusLabel = statusLabels[statusKey] || statusKey;
  const statusColor = statusColors[statusKey] || statusColors.pendente;
  const tipoLabel = tipoLabels[s.tipo as string] || s.tipo;
  const paymentLabel = s.payment_method
    ? paymentLabels[s.payment_method] || s.payment_method
    : null;
  const sigName = (company.companyName || "Amaryllis Produtos Naturais").split(" ")[0];
  const isConcluido = statusKey === "entregue" || statusKey === "concluido";

  return (
    <div className="min-h-screen bg-muted/30 py-6 px-4 print:bg-white print:py-0">
      <Helmet>
        <title>Ordem de Serviço #{osNum} | {company.companyName}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .os-logo { display: block !important; visibility: visible !important; }
        }
      `}</style>

      {/* Botões de ação - ocultos na impressão */}
      <div className="max-w-2xl mx-auto mb-4 flex gap-2 justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Imprimir
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-1" /> Salvar PDF
        </Button>
      </div>

      {/* Card da OS */}
      <div className="max-w-2xl mx-auto bg-background rounded-lg shadow-sm border print:shadow-none print:border-none print:rounded-none">
        {/* Cabeçalho */}
        <div className="border-b p-6 flex items-center justify-between gap-4">
          <img
            src={logoLight}
            alt={company.companyName}
            className="os-logo h-16 sm:h-20 w-auto object-contain print:h-20 shrink-0"
            style={{
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          />
          <div className="min-w-0 text-right">
            <h1 className="text-xl font-serif font-bold text-foreground flex items-center justify-end gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Ordem de Serviço
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              OS #{osNum}
            </p>
          </div>
        </div>

        {/* Status + Data de emissão */}
        <div className="px-6 py-3 bg-muted/40 border-b flex items-center justify-between print:bg-white">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}
          >
            {statusLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            Emitido em{" "}
            {format(parseISO(s.created_at), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
        </div>

        {/* Detalhes */}
        <div className="p-6 space-y-5">
          {/* Cliente */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
              <User className="h-3 w-3" /> Cliente
            </p>
            <p className="text-sm font-semibold text-foreground">
              {clientName}
            </p>
          </div>

          {/* Datas: Compra · Produção · Entrega */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Datas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border rounded-md overflow-hidden">
              <div className="p-3 bg-muted/30 sm:border-r border-b sm:border-b-0">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Compra
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {purchaseDate
                    ? format(purchaseDate, "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </p>
              </div>
              <div className="p-3 bg-muted/30 sm:border-r border-b sm:border-b-0">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Produção
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {productionDate
                    ? format(productionDate, "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </p>
              </div>
              <div className="p-3 bg-primary/5">
                <p className="text-[10px] uppercase tracking-wide text-primary/80 font-medium">
                  Entrega
                </p>
                <p className="text-sm font-semibold text-primary mt-1">
                  {format(d, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Tipo + Endereço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
                <Gift className="h-3 w-3" /> Tipo
              </p>
              <p className="text-sm font-semibold text-foreground">
                {tipoLabel}
              </p>
              {s.title && s.title !== "Encomenda" && (
                <p className="text-xs text-muted-foreground">{s.title}</p>
              )}
            </div>
            {s.endereco && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Endereço
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {s.endereco}
                </p>
              </div>
            )}
          </div>

          {/* Produtos / Encomendas */}
          {items.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 flex items-center gap-1">
                <Heart className="h-3 w-3 text-primary" /> Produtos / Encomendas
              </p>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground w-16">
                        Qtd
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                        Item
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground w-28">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-4 py-2 text-foreground font-medium">
                          {item.qty}×
                        </td>
                        <td className="px-4 py-2 text-foreground">
                          {item.name}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {(item.total || 0) > 0 ? fmtBRL(item.total || 0) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {itemsSubtotal > 0 && (
                      <tr className="border-t bg-muted/20">
                        <td className="px-4 py-2 text-muted-foreground" colSpan={2}>
                          Subtotal
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {fmtBRL(itemsSubtotal)}
                        </td>
                      </tr>
                    )}
                    {(shippingValue !== null || shippingCarrier) && (
                      <tr className="bg-muted/20">
                        <td className="px-4 py-2 text-muted-foreground" colSpan={2}>
                          <span className="inline-flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-fuchsia-500" />
                            Frete{shippingCarrier ? ` (${shippingCarrier})` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {shippingValue && shippingValue > 0
                            ? fmtBRL(shippingValue)
                            : "Grátis"}
                        </td>
                      </tr>
                    )}
                    {total > 0 && (
                      <tr className="bg-primary/5 font-bold border-t">
                        <td className="px-4 py-3 text-foreground" colSpan={2}>
                          TOTAL
                        </td>
                        <td className="px-4 py-3 text-right text-primary">
                          {fmtBRL(total)}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Total quando não há itens listados mas há valor */}
          {items.length === 0 && total > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-md px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">TOTAL</span>
              <span className="text-sm font-bold text-primary">
                {fmtBRL(total)}
              </span>
            </div>
          )}

          {/* Pagamento */}
          {paymentLabel && (
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">Pagamento:</span>{" "}
              {paymentLabel}
            </div>
          )}

          {/* Status do pagamento Mercado Pago */}
          {(s as any).mp_payment_status === "paid" && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm flex items-center justify-between gap-2 print:hidden">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
                <span className="font-semibold">Pagamento confirmado</span>
                {(s as any).mp_paid_at && (
                  <span className="text-xs text-muted-foreground">
                    em {format(parseISO((s as any).mp_paid_at), "dd/MM/yyyy")}
                  </span>
                )}
              </div>
              {(s as any).mp_receipt_url && (
                <a
                  href={(s as any).mp_receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary underline"
                >
                  Ver comprovante
                </a>
              )}
            </div>
          )}
          {(s as any).mp_payment_status === "pending" && (s as any).mp_init_point && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm flex items-center justify-between gap-2 print:hidden">
              <span className="text-amber-700 dark:text-amber-400 font-medium">Aguardando pagamento</span>
              <a
                href={(s as any).mp_init_point}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary underline"
              >
                Pagar agora
              </a>
            </div>
          )}

          {/* Observações */}
          {s.notes && (
            <div className="bg-muted/40 rounded-md p-3 text-sm text-muted-foreground border">
              <span className="font-medium text-foreground">Observações:</span>{" "}
              {s.notes}
            </div>
          )}

          {/* Assinaturas */}
          <div className="flex justify-between pt-10 mt-6 print:pt-16">
            <div className="w-[45%] text-center text-xs text-muted-foreground">
              <p
                className="text-2xl text-foreground mb-2"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                {sigName}
              </p>
              <div className="border-t border-foreground/30 pt-2">
                {company.companyName}
              </div>
            </div>
            <div className="w-[45%] text-center text-xs text-muted-foreground">
              <div className="h-[36px]" />
              <div className="border-t border-foreground/30 pt-2">Cliente</div>
            </div>
          </div>

          {/* Mensagem final personalizada */}
          {isConcluido ? (
            <p className="text-center text-xs text-muted-foreground italic pt-2">
              Sua encomenda foi finalizada com muito carinho 💕 Agradecemos a
              preferência!
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground italic pt-2">
              Impresso camada por camada com precisão para dar vida à sua ideia 🛠️
            </p>
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t px-6 py-3 text-center text-xs text-muted-foreground space-y-0.5">
          <p className="font-semibold text-foreground font-serif">
            {company.companyName}
          </p>
          {company.address && <p>{company.address}</p>}
          {(company.cnpj || company.phone) && (
            <p>
              {company.cnpj && <span>CNPJ: {company.cnpj}</span>}
              {company.cnpj && company.phone && <span> • </span>}
              {company.phone && <span>Tel: {company.phone}</span>}
            </p>
          )}
          <p className="text-muted-foreground/60 pt-1">
            Documento gerado automaticamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrdemServico;
