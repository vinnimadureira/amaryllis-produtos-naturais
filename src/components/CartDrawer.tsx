import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Tag,
  Check,
  Loader2,
  CreditCard,
  AlertCircle,
  StickyNote,
  ChevronDown,
  ChevronUp,
  PackageX,
  RefreshCcw,
  CircleAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CheckoutDialog from "@/components/CheckoutDialog";

const WHATSAPP_URL = "https://wa.me/5519993512766?text=";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, updateNotes, clearCart, totalItems, isOpen, setIsOpen } = useCart();
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const formatBRL = (value: number) =>
    `R$ ${value.toFixed(2).replace(".", ",")}`;

  const toggleNotes = (id: string) =>
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percent: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuggestion, setCouponSuggestion] = useState<{ code: string; discount_percent: number } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Verificação de disponibilidade dos itens (produto ativo + preço atualizado)
  type AvailabilityIssue = {
    id: string;
    name: string;
    type: "unavailable" | "price_changed";
    oldPrice?: number;
    newPrice?: number;
  };
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityIssues, setAvailabilityIssues] = useState<AvailabilityIssue[]>([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const couponDebounceRef = useRef<number | null>(null);

  // Carrega status do método de pagamento ao abrir o drawer
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "payment_mercadopago_enabled")
        .maybeSingle();
      if (!cancelled) setPaymentEnabled((data?.value ?? "true") === "true");
    })();
    return () => { cancelled = true; };
  }, [isOpen]);


  const subtotal = items.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);
  const discount = appliedCoupon ? subtotal * (appliedCoupon.discount_percent / 100) : 0;
  const total = subtotal - discount;

  // Validação isolada (reutilizada por aplicação manual e por debounce em tempo real)
  const validateCoupon = async (
    rawCode: string,
  ): Promise<
    | { ok: true; data: { code: string; discount_percent: number } }
    | { ok: false; error: string }
  > => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return { ok: false, error: "" };

    const { data, error } = await supabase
      .rpc("validate_coupon", { _code: code })
      .maybeSingle();

    if (error) return { ok: false, error: "Erro ao validar cupom. Tente novamente." };
    if (!data) return { ok: false, error: "Cupom inválido ou expirado" };

    return { ok: true, data: { code: data.code, discount_percent: data.discount_percent } };
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const result = await validateCoupon(couponCode);
    if (result.ok === false) {
      setCouponError(result.error);
      setCouponSuggestion(null);
      setCouponLoading(false);
      return;
    }
    setAppliedCoupon(result.data);
    setCouponSuggestion(null);
    setCouponCode("");
    setCouponLoading(false);
  };

  // Validação em tempo real (debounce 500ms) — sugere/avisa enquanto o usuário digita
  useEffect(() => {
    if (couponDebounceRef.current) window.clearTimeout(couponDebounceRef.current);
    const code = couponCode.trim();
    if (!code || appliedCoupon) {
      setCouponSuggestion(null);
      setCouponError("");
      return;
    }
    if (code.length < 3) {
      setCouponSuggestion(null);
      setCouponError("");
      return;
    }
    couponDebounceRef.current = window.setTimeout(async () => {
      const result = await validateCoupon(code);
      if (result.ok === true) {
        setCouponSuggestion(result.data);
        setCouponError("");
      } else {
        setCouponSuggestion(null);
        setCouponError(result.error);
      }
    }, 500);
    return () => {
      if (couponDebounceRef.current) window.clearTimeout(couponDebounceRef.current);
    };
  }, [couponCode, appliedCoupon]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    setCouponSuggestion(null);
  };

  // Verificação de disponibilidade dos itens (produto ativo + preço atualizado)
  const checkAvailability = async (): Promise<AvailabilityIssue[]> => {
    if (items.length === 0) return [];
    setAvailabilityLoading(true);
    try {
      const ids = items.map((i) => i.id);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, active, price")
        .in("id", ids);
      if (error) throw error;

      const issues: AvailabilityIssue[] = [];
      const found = new Map(data?.map((p) => [p.id, p]) ?? []);
      for (const item of items) {
        const prod = found.get(item.id);
        if (!prod || !prod.active) {
          issues.push({ id: item.id, name: item.name, type: "unavailable" });
          continue;
        }
        const dbPrice = Number(prod.price);
        if (Math.abs(dbPrice - item.priceNum) > 0.005) {
          issues.push({
            id: item.id,
            name: item.name,
            type: "price_changed",
            oldPrice: item.priceNum,
            newPrice: dbPrice,
          });
        }
      }
      setAvailabilityIssues(issues);
      setAvailabilityChecked(true);
      return issues;
    } catch {
      setAvailabilityIssues([]);
      setAvailabilityChecked(true);
      return [];
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Revalida automaticamente quando o drawer é aberto e quando os itens mudam
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    checkAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items.length, items.map((i) => i.id).join(",")]);

  const sendWhatsApp = () => {
    const lines = items.map((item) => {
      const head = `• ${item.name} (x${item.quantity}) — ${item.price}`;
      return item.notes?.trim() ? `${head}\n   ↳ Personalização: ${item.notes.trim()}` : head;
    });
    let message = `Olá! Gostaria de fazer um orçamento:\n\n${lines.join("\n")}\n\nSubtotal: R$ ${subtotal.toFixed(2).replace(".", ",")}`;
    if (appliedCoupon) {
      message += `\nCupom: ${appliedCoupon.code} (-${appliedCoupon.discount_percent}%)`;
      message += `\nDesconto: -R$ ${discount.toFixed(2).replace(".", ",")}`;
    }
    message += `\n\nTotal estimado: R$ ${total.toFixed(2).replace(".", ",")}`;
    window.open(`${WHATSAPP_URL}${encodeURIComponent(message)}`, "_blank");
  };

  const checkout = async () => {
    if (items.length === 0) return;

    // Verifica se algum método de pagamento está ativo
    const { data: mpSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_mercadopago_enabled")
      .maybeSingle();
    const mpEnabled = (mpSetting?.value ?? "true") === "true";
    if (!mpEnabled) {
      toast({
        title: "Pagamento online indisponível",
        description: "No momento não estamos aceitando pagamentos pelo site. Fale conosco pelo WhatsApp para finalizar seu pedido.",
        variant: "destructive",
      });
      return;
    }

    // Verifica disponibilidade/preço dos itens antes de abrir o wizard
    const issues = await checkAvailability();
    if (issues.length > 0) {
      const unavailable = issues.filter((i) => i.type === "unavailable").length;
      const priceChanged = issues.filter((i) => i.type === "price_changed").length;
      const parts: string[] = [];
      if (unavailable) parts.push(`${unavailable} ${unavailable === 1 ? "item indisponível" : "itens indisponíveis"}`);
      if (priceChanged) parts.push(`${priceChanged} ${priceChanged === 1 ? "item com preço atualizado" : "itens com preço atualizado"}`);
      toast({
        title: "Confira seu carrinho",
        description: `Encontramos ${parts.join(" e ")}. Revise antes de continuar.`,
        variant: "destructive",
      });
      return;
    }

    setCheckoutOpen(true);
  };

  return (
    <>
      {/* Cart trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-slate-900 hover:bg-black text-white dark:bg-card dark:text-foreground dark:border dark:border-border shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
        aria-label={`Carrinho (${totalItems} itens)`}
      >
        <ShoppingBag className="w-6 h-6" />
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center"
          >
            {totalItems}
          </motion.span>
        )}
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  Carrinho ({totalItems})
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                aria-label="Fechar carrinho"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 cart-scroll">
              {/* Banner global de disponibilidade */}
              {items.length > 0 && availabilityIssues.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1"
                  role="alert"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-destructive">
                      <CircleAlert className="w-4 h-4" />
                      {availabilityIssues.length === 1
                        ? "1 item precisa de atenção"
                        : `${availabilityIssues.length} itens precisam de atenção`}
                    </span>
                    <button
                      type="button"
                      onClick={() => checkAvailability()}
                      disabled={availabilityLoading}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {availabilityLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-3 h-3" />
                      )}
                      Reverificar
                    </button>
                  </div>
                  <p className="text-muted-foreground">
                    Reveja os itens marcados antes de finalizar a compra.
                  </p>
                </motion.div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Seu carrinho está vazio</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">
                    Adicione produtos do catálogo para iniciar sua compra
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const lineSubtotal = item.priceNum * item.quantity;
                  const isExpanded = !!expandedNotes[item.id];
                  const issue = availabilityIssues.find((i) => i.id === item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className={`bg-secondary rounded-lg p-3 space-y-2 ${
                        issue?.type === "unavailable" ? "ring-1 ring-destructive/60" : ""
                      } ${issue?.type === "price_changed" ? "ring-1 ring-amber-500/60" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground line-clamp-2">{item.name}</p>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="shrink-0 p-1 -mt-1 -mr-1 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Remover ${item.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.price} <span className="opacity-60">cada</span>
                          </p>
                          <div className="flex items-center justify-between mt-1.5 gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Diminuir quantidade"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium text-foreground w-5 text-center" aria-live="polite">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Aumentar quantidade"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              {formatBRL(lineSubtotal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Personalização (observação por item) — editável a qualquer momento */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleNotes(item.id)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            aria-expanded={isExpanded}
                            aria-controls={`notes-${item.id}`}
                          >
                            <StickyNote className={`w-3.5 h-3.5 ${item.notes?.trim() ? "text-primary" : ""}`} />
                            {item.notes?.trim()
                              ? "Editar personalização"
                              : isExpanded
                                ? "Adicionar personalização"
                                : "+ Adicionar personalização (cor, tamanho, texto…)"}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {item.notes?.trim() && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-2 py-0.5">
                              <Check className="w-2.5 h-2.5" /> Personalizado
                            </span>
                          )}
                        </div>

                        {/* Preview da nota quando colapsada */}
                        {!isExpanded && item.notes?.trim() && (
                          <p className="mt-1 text-[11px] text-muted-foreground italic line-clamp-2 pl-5">
                            “{item.notes.trim()}”
                          </p>
                        )}

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              id={`notes-${item.id}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <textarea
                                value={item.notes ?? ""}
                                onChange={(e) => updateNotes(item.id, e.target.value)}
                                placeholder="Ex.: cor verde, com nome 'João', 10cm de altura"
                                maxLength={280}
                                rows={2}
                                className="mt-1.5 w-full bg-card border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
                              />
                              <div className="flex items-center justify-between mt-0.5 gap-2">
                                <div className="flex items-center gap-2">
                                  {item.notes?.trim() ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                                        <Check className="w-3 h-3" /> Salvo automaticamente
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => updateNotes(item.id, "")}
                                        className="text-[10px] text-muted-foreground hover:text-destructive transition-colors underline"
                                      >
                                        Limpar
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/70">
                                      Você pode editar a qualquer momento.
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`text-[10px] ${
                                    (item.notes?.length ?? 0) >= 260
                                      ? "text-amber-600 dark:text-amber-400 font-medium"
                                      : "text-muted-foreground/70"
                                  }`}
                                >
                                  {(item.notes?.length ?? 0)}/280
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Aviso de disponibilidade do item */}
                      {issue?.type === "unavailable" && (
                        <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-2 py-1.5 text-[11px] text-destructive">
                          <PackageX className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">Indisponível no momento</p>
                            <p className="text-destructive/80">Remova este item para continuar a compra.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive font-semibold hover:underline shrink-0"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                      {issue?.type === "price_changed" && (
                        <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">Preço atualizado</p>
                            <p className="opacity-80">
                              {formatBRL(issue.oldPrice ?? 0)} → <strong>{formatBRL(issue.newPrice ?? 0)}</strong>. Remova e adicione novamente para usar o novo valor.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer with coupon */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                {/* Coupon section */}
                {appliedCoupon ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-rose-light rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {appliedCoupon.code} (-{appliedCoupon.discount_percent}%)
                      </span>
                    </div>
                    <button onClick={removeCoupon} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                      Remover
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <div
                        className={`flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 border ${
                          couponError ? "border-destructive/60" : couponSuggestion ? "border-emerald-500/60" : "border-transparent"
                        }`}
                      >
                        <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); }}
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          placeholder="Código do cupom"
                          aria-invalid={!!couponError}
                          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground py-2 outline-none w-full"
                          maxLength={20}
                        />
                        {couponLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />}
                        {!couponLoading && couponSuggestion && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <Button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim() || !!couponError}
                        size="sm"
                        variant="outline"
                        className="border-primary text-primary hover:bg-rose-light shrink-0"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                    {couponError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-xs text-destructive pl-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {couponError}
                      </motion.p>
                    )}
                    {!couponError && couponSuggestion && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 pl-1"
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        Cupom válido — {couponSuggestion.discount_percent}% de desconto. Clique em <strong className="mx-1">Aplicar</strong> para usar.
                      </motion.p>
                    )}
                  </div>
                )}

                {/* Resumo compacto do pedido */}
                <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "itens"})</span>
                    <span>{formatBRL(subtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between text-xs text-primary"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Cupom {appliedCoupon.code} (-{appliedCoupon.discount_percent}%)
                      </span>
                      <span>-{formatBRL(discount)}</span>
                    </motion.div>
                  )}
                   <div className="flex items-end justify-between pt-1 border-t border-border/60">
                    <span className="text-sm font-medium text-foreground pt-2">Total</span>
                    <span className="font-serif text-2xl font-bold text-primary leading-none pt-2">
                      {formatBRL(total)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    Parcele em até <span className="font-semibold text-foreground">12x no cartão</span> · Pix e Boleto disponíveis
                  </p>
                </div>

                {!paymentEnabled ? (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex gap-2.5 items-start">
                    <CircleAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                        Pagamento online indisponível
                      </p>
                      <p className="text-xs text-amber-800/90 dark:text-amber-200/80">
                        No momento não estamos processando pagamentos pelo site. Conclua seu pedido pelo WhatsApp logo abaixo.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    data-checkout-button
                    onClick={checkout}
                    disabled={availabilityLoading || availabilityIssues.length > 0}
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {availabilityLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                    {availabilityLoading
                      ? "Verificando disponibilidade…"
                      : availabilityIssues.length > 0
                        ? "Revise os itens destacados"
                        : "Finalizar compra"}
                  </Button>
                )}
                <Button
                  onClick={sendWhatsApp}
                  size="lg"
                  variant="outline"
                  className="w-full gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Prefiro falar pelo WhatsApp
                </Button>
                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
                >
                  Limpar carrinho
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wizard de checkout (cadastro → resumo → pagamento Mercado Pago) */}
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        appliedCoupon={appliedCoupon}
      />
    </>
  );
};

export default CartDrawer;
