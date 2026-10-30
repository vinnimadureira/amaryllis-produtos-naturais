import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";

interface Props {
  defaultPaymentId?: string | null;
  onDone?: () => void;
}

export function ReprocessMpButton({ defaultPaymentId, onDone }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [paymentId, setPaymentId] = useState(defaultPaymentId ?? "");
  const [loading, setLoading] = useState(false);

  const handleReprocess = async () => {
    const id = paymentId.trim();
    if (!id) {
      toast({ title: "Informe o Payment ID", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-reprocess", {
        body: { paymentId: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: "Pagamento reprocessado",
        description: `Status: ${(data as any)?.status ?? "?"} • Pedido salvo no banco.`,
      });
      setOpen(false);
      onDone?.();
    } catch (e) {
      toast({
        title: "Erro ao reprocessar",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 gap-2"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Reprocessar pagamento (MP)
      </Button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 p-2 rounded-md bg-muted/40">
      <Input
        value={paymentId}
        onChange={(e) => setPaymentId(e.target.value)}
        placeholder="Payment ID do Mercado Pago"
        className="h-8 text-xs font-mono"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleReprocess}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Reprocessando…" : "Confirmar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Busca o pagamento na API do MP e grava/atualiza o pedido no banco. Útil quando o webhook
        falhou.
      </p>
    </div>
  );
}
