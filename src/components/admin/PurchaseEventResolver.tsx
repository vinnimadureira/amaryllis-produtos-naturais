import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EventDetailDialog from "./EventDetailDialog";

interface Purchase {
  id?: string;
  client_id?: string | null;
  product?: string | null;
  notes?: string | null;
  purchase_date?: string | null;
  agenda_event_id?: string | null;
  customer_order_id?: string | null;
}

interface Props {
  purchase: Purchase;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Optional pre-extracted event id from the purchase notes tag */
  hintedEventId?: string | null;
}

/**
 * Resolves the agenda event linked to a `client_purchases` row and renders the
 * shared `EventDetailDialog`.
 *
 * Strategy (preferred → legado):
 * 1. agenda_event_id direto na linha (FK real).
 * 2. customer_order_id → busca agenda pela coluna agenda_events.customer_order_id.
 * 3. Tag legada `[evento:<uuid>]` em notes.
 * 4. Texto legado "Pedido #XXXXXXXX" em product → metadata.agenda_event_id.
 */
const PurchaseEventResolver = ({ purchase, open, onOpenChange, hintedEventId }: Props) => {
  const { data: eventId, isLoading } = useQuery({
    queryKey: [
      "purchase-event-resolver",
      purchase.id,
      hintedEventId,
      purchase.agenda_event_id,
      purchase.customer_order_id,
    ],
    queryFn: async (): Promise<string | null> => {
      if (purchase.agenda_event_id) return purchase.agenda_event_id;
      if (hintedEventId) return hintedEventId;

      if (purchase.customer_order_id) {
        const { data } = await supabase
          .from("agenda_events")
          .select("id")
          .eq("customer_order_id", purchase.customer_order_id)
          .is("parent_event_id", null)
          .maybeSingle();
        if (data?.id) return data.id;
      }

      // Legado: "Pedido #XXXXXXXX" em product
      const m = (purchase.product || "").match(/Pedido\s+#([0-9a-fA-F]{8})/);
      if (m) {
        const short = m[1].toLowerCase();
        const { data } = await supabase
          .from("customer_orders")
          .select("metadata, id")
          .ilike("id", `${short}%`)
          .limit(1)
          .maybeSingle();
        const eid = (data?.metadata as { agenda_event_id?: string } | null)?.agenda_event_id;
        if (eid) return eid;
      }

      return null;
    },
    enabled: open,
  });

  if (!open) return null;
  if (isLoading) return null;
  return (
    <EventDetailDialog
      open={open}
      onOpenChange={onOpenChange}
      eventId={eventId ?? null}
    />
  );
};

export default PurchaseEventResolver;
