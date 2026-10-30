/**
 * Parser compartilhado do campo `produto` (texto) usado em agenda_events e
 * client_purchases. Aceita os dois separadores existentes:
 *  - "|"  (cadastro manual via Agenda)
 *  - " • " (gerado pelo trigger sync_order_to_agenda nos pedidos do site)
 * E captura preço unitário opcional no formato " @ <num>" no fim de cada item.
 */
export interface ParsedProductItem {
  produto: string;
  unit_price: string;
  quantidade: string;
}

export const parseProductsField = (raw: string | null | undefined): ParsedProductItem[] => {
  if (!raw || !raw.trim()) return [];
  const parts = raw
    .split(/\s*[|•]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.map((part) => {
    const priceMatch = part.match(/^(.*?)\s*@\s*([\d]+(?:[.,]\d+)?)\s*$/);
    const head = (priceMatch ? priceMatch[1] : part).trim();
    const inlinePrice = priceMatch ? priceMatch[2].replace(",", ".") : "";
    const m = head.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    return {
      produto: m ? m[2].trim() : head,
      unit_price: inlinePrice,
      quantidade: m ? m[1] : "1",
    };
  });
};
