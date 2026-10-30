import { useQuery } from "@tanstack/react-query";
import { Clock, User, Package, ShoppingBag, Mail, MessageSquareQuote, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const ENTITY_ICONS: Record<string, React.ElementType> = {
  product: Package,
  order: ShoppingBag,
  message: Mail,
  testimonial: MessageSquareQuote,
  campaign: Megaphone,
};

const ActivityLogsTab = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Carregando logs...</p>;
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Logs de Atividade</h2>
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma atividade registrada ainda. As ações no painel admin serão registradas aqui.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = ENTITY_ICONS[log.entity_type] || Clock;
            return (
              <div key={log.id} className="bg-card rounded-lg p-3 flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{log.action}</span>
                    {log.details && <span className="text-muted-foreground"> — {log.details}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(log.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityLogsTab;

// Helper to log admin actions - call this from mutations
export const logActivity = async (action: string, entityType: string, entityId?: string, details?: string) => {
  try {
    await supabase.from("activity_logs").insert({
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch {
    // Silent fail - don't block user actions
  }
};
