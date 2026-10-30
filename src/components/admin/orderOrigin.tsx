import { Globe, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderOrigin = "site" | "manual";

/**
 * Detecta se um agenda_event foi criado automaticamente a partir de um pedido do site
 * (trigger sync_order_to_agenda) ou manualmente pelo admin.
 */
export const getOrderOrigin = (event: {
  notes?: string | null;
  payment_method?: string | null;
  title?: string | null;
}): OrderOrigin => {
  const note = (event.notes || "").toLowerCase();
  if (
    note.includes("criado automaticamente do pedido") ||
    note.includes("sincronizado automaticamente do site")
  ) return "site";
  // Eventos criados pelo trigger sync_order_to_agenda têm título "Pedido #XXXXXXXX"
  if (/^pedido\s+#[0-9a-f]{8}/i.test((event.title || "").trim())) return "site";
  // Heurística de fallback: pagamento Mercado Pago sempre vem do site
  const pm = (event.payment_method || "").toLowerCase();
  if (pm === "mercadopago" || pm === "mercado pago") return "site";
  return "manual";
};

export const ORIGIN_CONFIG: Record<OrderOrigin, {
  label: string;
  shortLabel: string;
  icon: typeof Globe;
  className: string;
  description: string;
}> = {
  site: {
    label: "Pedido do site",
    shortLabel: "Site",
    icon: Globe,
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    description: "Criado automaticamente a partir de uma compra online.",
  },
  manual: {
    label: "Agenda",
    shortLabel: "Agenda",
    icon: PencilLine,
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    description: "Cadastrado manualmente pela equipe na agenda.",
  },
};

interface OriginBadgeProps {
  origin: OrderOrigin;
  size?: "sm" | "md";
  short?: boolean;
  className?: string;
}

export const OriginBadge = ({ origin, size = "sm", short = false, className }: OriginBadgeProps) => {
  const cfg = ORIGIN_CONFIG[origin];
  const Icon = cfg.icon;
  const sizing =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 gap-1"
      : "text-xs px-2 py-0.5 gap-1.5";
  const iconSize = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";
  return (
    <span
      title={cfg.description}
      className={cn(
        "inline-flex items-center font-semibold rounded border whitespace-nowrap",
        cfg.className,
        sizing,
        className,
      )}
    >
      <Icon className={iconSize} />
      {short ? cfg.shortLabel : cfg.label}
    </span>
  );
};
