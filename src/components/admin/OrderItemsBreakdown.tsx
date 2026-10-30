import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Package, Truck } from "lucide-react";

export interface BreakdownItem {
  produto: string;
  unit_price: string | number | null;
  quantidade: string | number | null;
}

interface Props {
  items: BreakdownItem[];
  /** Frete (R$) já resolvido. Se omitido, é inferido a partir de orderTotal − itensTotal. */
  shipping?: number | null;
  /** Valor total do pedido (R$). Usado para inferir frete quando `shipping` não é informado. */
  orderTotal?: number | null;
  /** Quando true, esconde a linha de frete mesmo com valor (ex.: cadastro sem entrega). */
  hideShipping?: boolean;
  /** Nome da transportadora (ex.: "Correios — Sedex", "Jadlog — .Package"). */
  carrier?: string | null;
}

const normalizeName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Bloco compartilhado que exibe a lista de itens com subtotal, "Total dos itens"
 * e linha de "Frete". Usado em todo painel que mostra detalhes de pedido (Agenda,
 * Pedidos, histórico do Cliente, Relatórios) para garantir visual idêntico.
 */
const OrderItemsBreakdown = ({ items, shipping, orderTotal, hideShipping, carrier }: Props) => {
  const needsCatalogPrice = items.some(
    (it) => (it.produto || "").trim() && !(Number(it.unit_price) > 0),
  );
  const { data: catalog = [] } = useQuery({
    queryKey: ["order-items-breakdown-catalog-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("name, price")
        .order("name");
      if (error) throw error;
      return (data || []) as { name: string; price: number | null }[];
    },
    enabled: needsCatalogPrice,
  });
  const catalogPriceByName = useMemo(
    () => new Map(catalog.map((p) => [normalizeName(p.name), Number(p.price) || 0])),
    [catalog],
  );

  const visibleItems = items
    .filter((it) => (it.produto || "").trim())
    .map((it) => {
      const catalogPrice = catalogPriceByName.get(normalizeName(it.produto || "")) || 0;
      const unitPrice = Number(it.unit_price) > 0 ? Number(it.unit_price) : catalogPrice;
      return { ...it, unit_price: unitPrice };
    });
  const itemsTotal = visibleItems.reduce((acc, it) => {
    const qty = Math.max(1, Number(it.quantidade) || 1);
    const price = Number(it.unit_price) || 0;
    return acc + price * qty;
  }, 0);

  const inferredShipping =
    shipping == null && orderTotal != null && itemsTotal > 0 && orderTotal > itemsTotal
      ? orderTotal - itemsTotal
      : 0;
  const effectiveShipping = shipping != null ? Number(shipping) || 0 : inferredShipping;
  const showShipping = !hideShipping && effectiveShipping > 0;

  return (
    <div>
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Package className="w-3.5 h-3.5" /> Produtos / Encomendas
      </Label>
      <div className="mt-1.5 space-y-2">
        {visibleItems.length === 0 ? (
          <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground italic">
            Nenhum item adicionado.
          </div>
        ) : (
          visibleItems.map((it, i) => {
            const qty = Math.max(1, Number(it.quantidade) || 1);
            const price = Number(it.unit_price) || 0;
            const sub = price * qty;
            return (
              <div
                key={i}
                className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate">
                  <span className="font-medium tabular-nums">{qty}×</span> {it.produto}
                </span>
                <span className="tabular-nums text-muted-foreground shrink-0">
                  {price > 0 ? formatBRL(sub) : "—"}
                </span>
              </div>
            );
          })
        )}
      </div>
      {itemsTotal > 0 && (
        <div className="flex items-center justify-end mt-2 text-xs">
          <span className="text-muted-foreground mr-2">Total dos itens:</span>
          <span className="font-semibold tabular-nums">{formatBRL(itemsTotal)}</span>
        </div>
      )}
      {showShipping && (
        <div className="flex items-center justify-end mt-1 text-xs gap-2">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Truck className="w-3 h-3" /> Frete{carrier ? ` (${carrier})` : ""}:
          </span>
          <span className="font-semibold tabular-nums">{formatBRL(effectiveShipping)}</span>
        </div>
      )}
      {!showShipping && carrier && (
        <div className="flex items-center justify-end mt-1 text-xs gap-2">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Truck className="w-3 h-3" /> {carrier}
          </span>
        </div>
      )}
    </div>
  );
};

export default OrderItemsBreakdown;
