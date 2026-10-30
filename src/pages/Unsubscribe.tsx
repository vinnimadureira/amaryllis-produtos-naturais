import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";


type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/functions/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json();
        if (data.valid) setState({ kind: "valid" });
        else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid" });
      } catch {
        setState({ kind: "invalid" });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch(
        `/api/functions/handle-email-unsubscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        },
      );
      const data = await res.json();
      if (data.success) setState({ kind: "success" });
      else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
      else setState({ kind: "error", message: data.error || "Falha ao processar." });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message || "Erro de rede." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SEO title="Cancelar inscrição | Amaryllis Produtos Naturais" description="Gerenciar e-mails da Amaryllis Produtos Naturais." />
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
        {state.kind === "loading" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Validando link…</p>
          </>
        )}
        {state.kind === "valid" && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Cancelar inscrição</h1>
            <p className="text-muted-foreground mb-6">
              Você não receberá mais e-mails da Amaryllis Produtos Naturais neste endereço.
              Confirma?
            </p>
            <Button onClick={confirm} className="w-full">Confirmar cancelamento</Button>
          </>
        )}
        {state.kind === "submitting" && (
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground" />
        )}
        {state.kind === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-2xl font-semibold mt-4 mb-2">Inscrição cancelada</h1>
            <p className="text-muted-foreground mb-6">
              Pronto! Não enviaremos mais e-mails para este endereço.
            </p>
            <Button asChild variant="outline"><Link to="/">Voltar ao site</Link></Button>
          </>
        )}
        {state.kind === "already" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-semibold mt-4 mb-2">Já cancelado</h1>
            <p className="text-muted-foreground mb-6">
              Este endereço já foi descadastrado anteriormente.
            </p>
            <Button asChild variant="outline"><Link to="/">Voltar ao site</Link></Button>
          </>
        )}
        {state.kind === "invalid" && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="text-2xl font-semibold mt-4 mb-2">Link inválido</h1>
            <p className="text-muted-foreground mb-6">
              Este link de cancelamento expirou ou é inválido.
            </p>
            <Button asChild variant="outline"><Link to="/">Voltar ao site</Link></Button>
          </>
        )}
        {state.kind === "error" && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="text-2xl font-semibold mt-4 mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground mb-6">{state.message}</p>
            <Button onClick={confirm}>Tentar novamente</Button>
          </>
        )}
      </div>
    </div>
  );
}
