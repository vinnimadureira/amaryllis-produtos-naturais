import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Link as LinkIcon, Copy, MessageCircle, ExternalLink, CheckCircle2, Clock, XCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  eventId: string;
  clientName: string | null;
  phone: string | null;
  valor: number | null;
  mp_init_point?: string | null;
  mp_preference_id?: string | null;
  mp_payment_id?: string | null;
  mp_payment_status?: string | null;
  mp_paid_at?: string | null;
  mp_receipt_url?: string | null;
  mp_payment_method?: string | null;
  isSiteOrder?: boolean;
  onUpdated?: () => void;
}

const STATUS_LABEL: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  paid: { label: "Pago", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  pending: { label: "Aguardando pagamento", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock },
  canceled: { label: "Cancelado", cls: "bg-rose-500/10 text-rose-600 border-rose-500/30", icon: XCircle },
  refunded: { label: "Estornado", cls: "bg-slate-500/10 text-slate-600 border-slate-500/30", icon: XCircle },
};

const MANUAL_METHODS: { value: string; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
];

export default function MercadoPagoPaymentBlock(p: Props) {
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editing, setEditing] = useState(false);
  const [manualMethod, setManualMethod] = useState<string>(p.mp_payment_method || "pix");
  const [link, setLink] = useState<string | null>(p.mp_init_point ?? null);
  const status = p.mp_payment_status ? STATUS_LABEL[p.mp_payment_status] : null;
  const StatusIcon = status?.icon;

  const isMpPayment = !!p.mp_payment_id && p.mp_payment_method !== "manual" && !["pix","dinheiro","cartao_credito","cartao_debito","transferencia","outro"].includes(p.mp_payment_method || "");

  const generate = async () => {
    if (!p.valor || p.valor <= 0) {
      toast.error("Defina um valor maior que zero antes de gerar o link.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-agenda-payment-link", {
        body: { eventId: p.eventId, frontendOrigin: window.location.origin },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Link não retornado");
      setLink(data.url);
      toast.success("Link de pagamento gerado!");
      p.onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar link");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: "paid" | "pending" | "canceled" | "none", method?: string) => {
    setSavingStatus(true);
    try {
      const patch: Record<string, any> = {};
      if (newStatus === "none") {
        patch.mp_payment_status = null;
        patch.mp_paid_at = null;
        patch.mp_payment_method = null;
        patch.mp_receipt_url = null;
      } else {
        patch.mp_payment_status = newStatus;
        if (newStatus === "paid") {
          patch.mp_paid_at = new Date().toISOString();
          patch.mp_payment_method = method || manualMethod || "outro";
          // Pago = automaticamente Confirmado na agenda
          patch.status = "confirmado";
        } else {
          patch.mp_paid_at = null;
        }
      }
      const { error } = await supabase.from("agenda_events").update(patch as any).eq("id", p.eventId);
      if (error) throw error;
      toast.success("Status do pagamento atualizado");
      setEditing(false);
      p.onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar status");
    } finally {
      setSavingStatus(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  };

  const sendWhatsApp = () => {
    if (!link) return;
    const phone = (p.phone || "").replace(/\D/g, "");
    const valor = p.valor ? `R$ ${Number(p.valor).toFixed(2).replace(".", ",")}` : "";
    const msg = `Olá${p.clientName ? `, ${p.clientName.split(" ")[0]}` : ""}! Segue o link para pagamento do seu pedido na 7S Soluções${valor ? ` (${valor})` : ""}:\n\n${link}\n\nAssim que o pagamento for confirmado, sua OS é atualizada automaticamente. 🙌`;
    const base = phone ? `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const isPaid = p.mp_payment_status === "paid";
  const paidAt = p.mp_paid_at ? format(parseISO(p.mp_paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null;

  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5" /> Pagamento
        </h4>
        {status && StatusIcon && (
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border", status.cls)}>
            <StatusIcon className="w-3 h-3" /> {status.label}
          </span>
        )}
      </div>

      {isPaid && !editing ? (
        <div className="space-y-2 text-xs">
          {paidAt && <div className="text-muted-foreground">Pago em <span className="font-medium text-foreground">{paidAt}</span></div>}
          {p.mp_payment_method && <div className="text-muted-foreground">Método: <span className="font-medium text-foreground capitalize">{p.mp_payment_method.replace(/_/g, " ")}</span></div>}
          {p.mp_payment_id && isMpPayment && <div className="text-muted-foreground">ID MP: <span className="font-mono text-foreground">{p.mp_payment_id}</span></div>}
          {p.mp_receipt_url && (
            <Button asChild size="sm" variant="outline" className="w-full">
              <a href={p.mp_receipt_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Ver comprovante
              </a>
            </Button>
          )}
          {!p.isSiteOrder && (
            <Button onClick={() => setEditing(true)} size="sm" variant="ghost" className="w-full">
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Alterar status manualmente
            </Button>
          )}
          {p.isSiteOrder && (
            <p className="text-[10px] text-muted-foreground italic">Pedido do site — pagamento gerenciado automaticamente pelo Mercado Pago.</p>
          )}
        </div>
      ) : editing ? (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">Selecione o método e marque como pago (ex.: recebido em mãos, Pix direto). Clique novamente para desfazer.</p>
          <div className="grid grid-cols-2 gap-2">
            <Select value={manualMethod} onValueChange={setManualMethod} disabled={isPaid}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Método" /></SelectTrigger>
              <SelectContent>
                {MANUAL_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {isPaid ? (
              <Button onClick={() => updateStatus("none")} disabled={savingStatus} size="sm" variant="outline">
                {savingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><XCircle className="w-3.5 h-3.5 mr-1" /> Desmarcar pago</>}
              </Button>
            ) : (
              <Button onClick={() => updateStatus("paid", manualMethod)} disabled={savingStatus} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                {savingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Marcar pago</>}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {!link ? (
            <div className="space-y-2">
              <Button onClick={generate} disabled={loading} size="sm" className="w-full">
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5 mr-1.5" />}
                Gerar link Mercado Pago
              </Button>
              <Button onClick={() => setEditing(true)} size="sm" variant="outline" className="w-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Registrar pagamento manual
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <a href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary underline break-all">
                {link}
              </a>
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={copy} size="sm" variant="outline">
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
                </Button>
                <Button onClick={sendWhatsApp} size="sm" variant="outline" disabled={!p.phone}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                </Button>
                <Button onClick={generate} disabled={loading} size="sm" variant="ghost">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Regerar"}
                </Button>
              </div>
              <Button onClick={() => setEditing(true)} size="sm" variant="outline" className="w-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Marcar como pago manualmente
              </Button>
              {!p.phone && (
                <p className="text-[10px] text-muted-foreground">Cadastre o telefone do cliente para enviar pelo WhatsApp.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
