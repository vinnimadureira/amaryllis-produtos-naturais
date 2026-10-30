import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Users2 } from "lucide-react";

type Suggestion = {
  id: string;
  customer_order_id: string | null;
  created_client_id: string;
  candidate_client_id: string;
  score: number;
  reason: string;
  created_at: string;
  created: { id: string; name: string; email: string | null; phone: string | null; city: string | null } | null;
  candidate: { id: string; name: string; email: string | null; phone: string | null; city: string | null } | null;
};

export default function DuplicateClientsCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["client-match-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_match_suggestions")
        .select("id, customer_order_id, created_client_id, candidate_client_id, score, reason, created_at")
        .eq("status", "pending")
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).flatMap((s) => [s.created_client_id, s.candidate_client_id])));
      if (!ids.length) return [] as Suggestion[];
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, email, phone, city")
        .in("id", ids);
      const map = new Map((clients ?? []).map((c) => [c.id, c]));
      return (data ?? []).map((s) => ({
        ...s,
        created: map.get(s.created_client_id) ?? null,
        candidate: map.get(s.candidate_client_id) ?? null,
      })) as Suggestion[];
    },
    refetchOnWindowFocus: false,
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_match_suggestions")
        .update({ status: "dismissed", resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-match-suggestions"] }),
  });

  async function merge(s: Suggestion) {
    setBusyId(s.id);
    try {
      // Mantém o cliente antigo (candidate); migra vínculos do recém-criado.
      const keepId = s.candidate_client_id;
      const dropId = s.created_client_id;

      const updates = await Promise.all([
        supabase.from("customer_orders").update({ client_id: keepId }).eq("client_id", dropId),
        supabase.from("agenda_events").update({ client_id: keepId }).eq("client_id", dropId),
        supabase.from("client_purchases").update({ client_id: keepId }).eq("client_id", dropId),
        supabase.from("client_messages").update({ client_id: keepId }).eq("client_id", dropId),
      ]);
      const errs = updates.map((u) => u.error).filter(Boolean);
      if (errs.length) throw errs[0];

      // Apaga o duplicado (agora sem vínculos, o trigger de proteção permite)
      const del = await supabase.from("clients").delete().eq("id", dropId);
      if (del.error) throw del.error;

      await supabase
        .from("client_match_suggestions")
        .update({ status: "merged", resolved_at: new Date().toISOString() })
        .eq("id", s.id);

      toast({ title: "Clientes unidos", description: "Pedidos e histórico foram migrados." });
      qc.invalidateQueries({ queryKey: ["client-match-suggestions"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    } catch (e) {
      toast({
        title: "Não foi possível unir",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading || !suggestions.length) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-foreground">
            Possíveis duplicatas
          </span>
          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-700">
            {suggestions.length}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {suggestions.map((s) => (
            <div key={s.id} className="rounded-md border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Users2 className="w-3.5 h-3.5" />
                <span>Score {s.score} · {s.reason}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <ClientBlock title="Cliente recém-criado (será removido)" c={s.created} />
                <ClientBlock title="Cliente existente (será mantido)" c={s.candidate} />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={dismiss.isPending}
                  onClick={() => dismiss.mutate(s.id)}
                >
                  Manter separados
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={busyId === s.id}
                  onClick={() => merge(s)}
                >
                  {busyId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unir clientes"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientBlock({ title, c }: { title: string; c: Suggestion["created"] }) {
  return (
    <div className="rounded border border-border/60 bg-background/50 p-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      <div className="font-medium text-foreground truncate">{c?.name ?? "—"}</div>
      <div className="text-xs text-muted-foreground truncate">{c?.email ?? "—"}</div>
      <div className="text-xs text-muted-foreground truncate">{c?.phone ?? "—"}{c?.city ? ` · ${c.city}` : ""}</div>
    </div>
  );
}
