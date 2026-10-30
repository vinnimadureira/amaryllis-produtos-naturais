import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  AlertCircle,
  Loader2,
  CreditCard,
  ShieldCheck,
  Check,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Tag,
  ShoppingBag,
  StickyNote,
  Truck,
  Package,
  RefreshCw,
  MessageCircle,
  ExternalLink,
  Cake,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Wizard de checkout em 3 etapas:
 *  1. Cadastro (nome, e-mail, WhatsApp, CEP, cidade)
 *  2. Resumo do pedido
 *  3. Redirecionamento para pagamento seguro no Mercado Pago
 *
 * Este modal é aberto a partir do CartDrawer para deixar o carrinho enxuto.
 */

// Aceita letras (incl. acentos), espaços, hífen, apóstrofo e ponto. Sem números/símbolos.
const NAME_CITY_REGEX = /^[\p{L}][\p{L}\s'.\-]*$/u;

const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Seu nome precisa ter pelo menos 3 letras" })
    .max(80, { message: "Nome muito longo (máx. 80 caracteres)" })
    .refine((v) => NAME_CITY_REGEX.test(v), {
      message: "Use apenas letras, espaços e hífen no nome",
    })
    .refine((v) => v.trim().split(/\s+/).length >= 2, {
      message: "Digite nome e sobrenome",
    }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Informe seu e-mail" })
    .email({ message: "E-mail inválido — confira o formato (ex.: nome@dominio.com)" })
    .max(255, { message: "E-mail muito longo" }),
  phone: z
    .string()
    .trim()
    .min(1, { message: "Informe seu WhatsApp" })
    .refine((v) => v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 11, {
      message: "WhatsApp inválido — inclua DDD + número",
    }),
  cep: z
    .string()
    .trim()
    .min(1, { message: "Informe o CEP" })
    .refine((v) => v.replace(/\D/g, "").length === 8, { message: "CEP inválido — use 8 dígitos" }),
  street: z
    .string()
    .trim()
    .min(3, { message: "Informe o logradouro (rua/avenida)" })
    .max(120, { message: "Logradouro muito longo (máx. 120 caracteres)" }),
  number: z
    .string()
    .trim()
    .min(1, { message: "Informe o número (use S/N se não houver)" })
    .max(15, { message: "Número muito longo" }),
  neighborhood: z
    .string()
    .trim()
    .min(2, { message: "Informe o bairro" })
    .max(80, { message: "Bairro muito longo (máx. 80 caracteres)" }),
  complement: z
    .string()
    .trim()
    .max(80, { message: "Complemento muito longo (máx. 80 caracteres)" })
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(2, { message: "Informe a cidade" })
    .max(60, { message: "Nome da cidade muito longo (máx. 60 caracteres)" })
    .refine((v) => NAME_CITY_REGEX.test(v), {
      message: "Use apenas letras, espaços e hífen na cidade",
    }),
});

type CustomerData = z.infer<typeof customerSchema>;
type CustomerErrors = Partial<Record<keyof CustomerData, string>>;
type CustomerTouched = Partial<Record<keyof CustomerData, boolean>>;

const FIELD_ORDER: (keyof CustomerData)[] = [
  "name",
  "email",
  "phone",
  "cep",
  "street",
  "number",
  "neighborhood",
  "city",
];

const FIELD_LABELS: Record<keyof CustomerData, string> = {
  name: "Nome completo",
  email: "E-mail",
  phone: "WhatsApp",
  cep: "CEP",
  street: "Logradouro",
  number: "Número",
  neighborhood: "Bairro",
  complement: "Complemento",
  city: "Cidade",
};

const focusField = (field: keyof CustomerData) => {
  const el = document.getElementById(`co-${field}`) as HTMLInputElement | null;
  el?.focus();
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
};

// Aniversário (opcional): mantém ISO YYYY-MM-DD quando válido, senão a string parcial em BR
function birthdayToBR(iso: string): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  return iso;
}
function maskBirthdayInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  let br = digits;
  if (digits.length > 4) br = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  else if (digits.length > 2) br = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length === 8) {
    const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8);
    const dn = Number(d), mn = Number(m), yn = Number(y);
    if (mn >= 1 && mn <= 12 && dn >= 1 && dn <= 31 && yn >= 1900 && yn <= new Date().getFullYear()) {
      return `${y}-${m}-${d}`;
    }
  }
  return br;
}

// Validação isolada de um único campo (sem cruzar erros de outros)
const validateField = (field: keyof CustomerData, value: string): string | undefined => {
  const shape = customerSchema.shape[field];
  const result = shape.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues[0]?.message ?? "Campo inválido";
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// (estimativa de frete legada removida — agora usamos cálculo real via Melhor Envio)

// Faixas oficiais de CEP por UF (1º dígito do CEP) — fonte: Correios.
// Usado para detectar divergência entre o CEP digitado e o UF retornado pelo ViaCEP.
const CEP_RANGE_BY_UF: Record<string, [string, string]> = {
  SP: ["01000000", "19999999"],
  RJ: ["20000000", "28999999"],
  ES: ["29000000", "29999999"],
  MG: ["30000000", "39999999"],
  BA: ["40000000", "48999999"],
  SE: ["49000000", "49999999"],
  PE: ["50000000", "56999999"],
  AL: ["57000000", "57999999"],
  PB: ["58000000", "58999999"],
  RN: ["59000000", "59999999"],
  CE: ["60000000", "63999999"],
  PI: ["64000000", "64999999"],
  MA: ["65000000", "65999999"],
  PA: ["66000000", "68899999"],
  AP: ["68900000", "68999999"],
  AM: ["69000000", "69299999"],
  RR: ["69300000", "69399999"],
  // Amazonas continua na faixa 69400000-69899999
  AC: ["69900000", "69999999"],
  DF: ["70000000", "72799999"],
  GO: ["72800000", "76799999"],
  // Rondônia 76800000-76999999
  TO: ["77000000", "77999999"],
  MT: ["78000000", "78899999"],
  MS: ["79000000", "79999999"],
  PR: ["80000000", "87999999"],
  SC: ["88000000", "89999999"],
  RS: ["90000000", "99999999"],
};

// Faixas extras (UFs com mais de uma janela)
const CEP_RANGE_EXTRA: Array<{ uf: string; range: [string, string] }> = [
  { uf: "AM", range: ["69400000", "69899999"] },
  { uf: "RO", range: ["76800000", "76999999"] },
];

const isCepInUF = (cepDigits: string, uf: string): boolean => {
  if (cepDigits.length !== 8 || !uf) return true; // sem dados suficientes, não bloqueia
  const target = uf.toUpperCase();
  const main = CEP_RANGE_BY_UF[target];
  const inMain = main ? cepDigits >= main[0] && cepDigits <= main[1] : false;
  const inExtra = CEP_RANGE_EXTRA.some(
    (e) => e.uf === target && cepDigits >= e.range[0] && cepDigits <= e.range[1],
  );
  // Se o UF não está mapeado, não bloqueia (evita falsos positivos)
  if (!main && !CEP_RANGE_EXTRA.some((e) => e.uf === target)) return true;
  return inMain || inExtra;
};

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  appliedCoupon: { code: string; discount_percent: number } | null;
}

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string; short: string }[] = [
  { id: 1, label: "Seus dados", short: "Cadastro" },
  { id: 2, label: "Revisão", short: "Resumo" },
  { id: 3, label: "Pagamento", short: "Pagar" },
];

const CheckoutDialog = ({ open, onClose, appliedCoupon }: CheckoutDialogProps) => {
  const { items, totalItems } = useCart();
  const { toast } = useToast();

  const STORAGE_KEY = "7s_checkout_draft";

  // Hidrata rascunho do localStorage para não perder dados se o redirect falhar
  const loadDraft = (): { customer: CustomerData; cepUF: string } | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.customer) return parsed;
    } catch { /* ignore */ }
    return null;
  };
  const draft = loadDraft();

  const [step, setStep] = useState<Step>(1);
  const [customer, setCustomer] = useState<CustomerData>(() => {
    const base = draft?.customer ?? {
      name: "",
      email: "",
      phone: "",
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      city: "",
    };
    // Garante que valores vindos do rascunho estejam sempre mascarados
    return {
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      ...base,
      phone: formatPhone(base.phone || ""),
      cep: formatCEP(base.cep || ""),
    };
  });
  const [birthday, setBirthday] = useState<string>((draft as { birthday?: string } | null)?.birthday ?? "");
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [touched, setTouched] = useState<CustomerTouched>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepUF, setCepUF] = useState(draft?.cepUF ?? "");
  // Quando o ViaCEP retorna um UF que não bate com a faixa do CEP digitado,
  // guardamos o UF retornado para exibir um alerta amigável e específico.
  const [cepMismatchUF, setCepMismatchUF] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ---- Frete real (Melhor Envio) ----
  type ShippingOption = {
    id: number;
    name: string;
    company: string;
    companyLogo: string | null;
    priceCents: number;
    deliveryDays: number | null;
  };
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null);
  const selectedShipping = shippingOptions.find((o) => o.id === selectedShippingId) || null;
  const shippingValue = selectedShipping ? selectedShipping.priceCents / 100 : 0;

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const subtotal = items.reduce((s, i) => s + i.priceNum * i.quantity, 0);
  const discount = appliedCoupon ? subtotal * (appliedCoupon.discount_percent / 100) : 0;
  const total = subtotal - discount;
  const totalWithShipping = total + shippingValue;

  // Validação em tempo real para liberar o botão "Continuar"
  // Exige CEP validado, opções de frete carregadas e uma escolhida.
  const step1Valid =
    customerSchema.safeParse(customer).success &&
    !cepLoading &&
    !!cepUF &&
    !errors.cep &&
    !shippingLoading &&
    selectedShippingId !== null;
  const filledCount = FIELD_ORDER.filter((f) => !validateField(f, customer[f])).length;
  const customizedCount = items.filter((i) => i.notes?.trim()).length;

  // Persiste rascunho do cadastro a cada mudança (sem PII sensível além do necessário)
  useEffect(() => {
    try {
      const hasAny = Object.values(customer).some((v) => v && v.trim().length > 0);
      if (hasAny) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ customer, cepUF, birthday }));
      }
    } catch { /* ignore quota */ }
  }, [customer, cepUF, birthday]);

  // Resetar estado ao abrir (mantém rascunho preenchido)
  useEffect(() => {
    if (open) {
      setStep(1);
      setErrors({});
      setTouched({});
      setSubmitting(false);
      setCheckoutError(null);
    }
  }, [open]);
  // Recalcula frete se o carrinho mudar (quantidade/itens) com CEP já válido
  useEffect(() => {
    if (!open) return;
    const digits = customer.cep.replace(/\D/g, "");
    if (digits.length === 8 && cepUF) {
      void loadShipping(digits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => `${i.id}:${i.quantity}`).join("|"), open]);


  // ESC para fechar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  const lookupCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    setErrors((p) => ({ ...p, cep: undefined }));
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      if (!res.ok) throw new Error("http_" + res.status);
      const json = await res.json();
      if (json?.erro) {
        setErrors((p) => ({ ...p, cep: "CEP não encontrado. Verifique os 8 dígitos." }));
        setCepUF("");
        setTouched((p) => ({ ...p, cep: true }));
        return;
      }
      const uf = (json.uf || "").toUpperCase();
      // Coerência CEP ↔ UF (faixas oficiais dos Correios)
      if (uf && !isCepInUF(digits, uf)) {
        setCepUF("");
        setCepMismatchUF(uf);
        setTouched((p) => ({ ...p, cep: true }));
        setErrors((p) => ({
          ...p,
          cep: `Este CEP não corresponde ao estado ${uf}. Confira os números digitados.`,
        }));
        return;
      }
      setCepMismatchUF(null);
      setCustomer((p) => ({
        ...p,
        city: json.localidade || p.city,
        street: json.logradouro || p.street,
        neighborhood: json.bairro || p.neighborhood,
      }));
      setCepUF(uf);
      setTouched((p) => ({ ...p, cep: true, city: true }));
      setErrors((p) => ({ ...p, cep: undefined, city: undefined }));
      // Dispara cálculo de frete real
      void loadShipping(digits);
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      setCepUF("");
      setTouched((p) => ({ ...p, cep: true }));
      setErrors((p) => ({
        ...p,
        cep: aborted
          ? "Tempo esgotado ao consultar o CEP. Toque em ↻ para tentar novamente."
          : "Não foi possível consultar o CEP agora. Verifique a conexão e toque em ↻.",
      }));
    } finally {
      setCepLoading(false);
    }
  };

  const loadShipping = async (cepDigits: string) => {
    if (!items.length) return;
    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedShippingId(null);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-shipping", {
        body: {
          cep: cepDigits,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        },
      });
      // Quando a edge function retorna 4xx/5xx, supabase-js entrega o body em error.context
      if (error) {
        let serverMsg: string | null = null;
        try {
          const ctx = (error as any)?.context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            serverMsg = body?.error ?? null;
          } else if (ctx && typeof ctx.text === "function") {
            const txt = await ctx.text();
            try {
              serverMsg = JSON.parse(txt)?.error ?? txt;
            } catch {
              serverMsg = txt;
            }
          }
        } catch {
          /* ignore */
        }
        throw new Error(serverMsg || error.message || "Falha ao calcular o frete");
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      const opts = ((data as any)?.options ?? []) as ShippingOption[];
      setShippingOptions(opts);
      // Pré-seleciona a opção mais barata
      if (opts.length > 0) setSelectedShippingId(opts[0].id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao calcular o frete";
      setShippingError(msg);
    } finally {
      setShippingLoading(false);
    }
  };

  const updateField = (field: keyof CustomerData, value: string) => {
    let next = value;
    if (field === "phone") next = formatPhone(value);
    if (field === "cep") next = formatCEP(value);
    setCustomer((p) => ({ ...p, [field]: next }));

    // Revalida em tempo real apenas se o campo já foi tocado
    // (evita mostrar erro enquanto o usuário ainda está digitando o primeiro caractere)
    if (touched[field]) {
      const msg = validateField(field, next);
      setErrors((p) => ({ ...p, [field]: msg }));
    } else if (errors[field]) {
      // se já havia erro de uma tentativa anterior, atualiza imediatamente
      const msg = validateField(field, next);
      setErrors((p) => ({ ...p, [field]: msg }));
    }

    if (field === "cep") {
      const d = next.replace(/\D/g, "");
      if (d.length === 8) lookupCep(next);
      else if (d.length < 8) {
        setCepUF("");
        setCepMismatchUF(null);
      }
    }
  };

  const blurField = (field: keyof CustomerData) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const msg = validateField(field, customer[field]);
    setErrors((p) => ({ ...p, [field]: msg }));

    // Auto-consulta CEP ao perder o foco quando há 8 dígitos válidos e ainda
    // não tem UF confirmado (cobre autofill/colagem que não disparou onChange).
    if (field === "cep" && !msg) {
      const digits = customer.cep.replace(/\D/g, "");
      if (digits.length === 8 && !cepUF && !cepLoading) {
        lookupCep(customer.cep);
      }
    }
  };

  const validateStep1 = () => {
    // marca todos como tocados para revelar erros pendentes
    setTouched({
      name: true,
      email: true,
      phone: true,
      cep: true,
      street: true,
      number: true,
      neighborhood: true,
      complement: true,
      city: true,
    });
    const parsed = customerSchema.safeParse(customer);
    if (!parsed.success) {
      const errs: CustomerErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof CustomerData;
        if (k && !errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      const firstKey = FIELD_ORDER.find((k) => errs[k]);
      if (firstKey) document.getElementById(`co-${firstKey}`)?.focus();
      return false;
    }
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2) return startCheckout();
    setStep((s) => (s + 1) as Step);
  };

  const goBack = () => {
    if (step === 1) return onClose();
    setStep((s) => (s - 1) as Step);
  };

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const startCheckout = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setCheckoutError(null);
    setCheckoutUrl(null);
    setStep(3);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            image: i.image,
            priceNum: i.priceNum,
            quantity: i.quantity,
            notes: i.notes?.trim() || null,
          })),
          couponCode: appliedCoupon?.code ?? null,
          customerEmail: customer.email,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerCep: customer.cep,
          customerCity: customer.city,
          customerState: cepUF || null,
          customerStreet: customer.street,
          customerNumber: customer.number,
          customerNeighborhood: customer.neighborhood,
          customerComplement: customer.complement || null,
          customerBirthday: /^\d{4}-\d{2}-\d{2}$/.test(birthday) ? birthday : null,
          shippingCents: selectedShipping?.priceCents ?? 0,
          shippingLabel: selectedShipping
            ? `${selectedShipping.company} ${selectedShipping.name}`
            : null,
          shippingDeliveryDays: selectedShipping?.deliveryDays ?? null,
          successUrl: `${origin}/pedido-confirmado`,
          cancelUrl: `${origin}/pedido-cancelado`,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("URL de checkout não retornada pelo servidor");

      // Sucesso: limpa rascunho e tenta redirecionar
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      setCheckoutUrl(data.url);

      // Detecta falha de redirecionamento (popup blocker, navegação cancelada).
      // Damos 6s para o Mercado Pago carregar; se a aba ainda estiver visível e na
      // mesma URL, aí sim mostramos o fallback manual.
      const before = window.location.href;
      window.location.href = data.url;
      window.setTimeout(() => {
        if (
          window.location.href === before &&
          document.visibilityState === "visible"
        ) {
          setCheckoutError(
            "O navegador bloqueou o redirecionamento automático. Use o botão abaixo para abrir o pagamento manualmente.",
          );
          setSubmitting(false);
        }
      }, 6000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao iniciar checkout";
      console.error("[checkout] erro:", e);
      setCheckoutError(msg);
      setSubmitting(false);
      toast({
        title: "Não foi possível iniciar o pagamento",
        description: "Seus dados foram salvos. Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const retryCheckout = () => {
    setRetryCount((n) => n + 1);
    void startCheckout();
  };

  const backToSummary = () => {
    setCheckoutError(null);
    setSubmitting(false);
    setCheckoutUrl(null);
    setStep(2);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && onClose()}
            className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-title"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="pointer-events-auto w-full max-w-lg max-h-[92vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 id="checkout-title" className="font-serif text-lg font-semibold text-foreground">
                    Finalizar pedido
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Etapa {step} de {STEPS.length} — {STEPS[step - 1].label}
                  </p>
                </div>
                <button
                  onClick={() => !submitting && onClose()}
                  disabled={submitting}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors disabled:opacity-40"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stepper */}
              <div className="px-5 pt-4">
                <ol className="flex items-center gap-2">
                  {STEPS.map((s, idx) => {
                    const done = step > s.id;
                    const active = step === s.id;
                    return (
                      <li key={s.id} className="flex-1 flex items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                              done
                                ? "bg-primary text-primary-foreground"
                                : active
                                  ? "bg-primary/15 text-primary ring-2 ring-primary"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {done ? <Check className="w-3.5 h-3.5" /> : s.id}
                          </div>
                          <span
                            className={`text-xs font-medium truncate ${
                              active ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {s.short}
                          </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={`h-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <AnimatePresence mode="wait">
                  {/* === STEP 1: Cadastro === */}
                  {step === 1 && (
                    <motion.div
                      key="s1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <p className="text-sm text-muted-foreground">
                        Esses dados nos ajudam a entrar em contato e preparar o envio.
                      </p>

                      <Field
                        id="co-name"
                        icon={<User className="w-4 h-4" />}
                        placeholder="Nome completo"
                        autoComplete="name"
                        value={customer.name}
                        error={errors.name}
                        valid={touched.name && !errors.name && !validateField("name", customer.name)}
                        onChange={(v) => updateField("name", v)}
                        onBlur={() => blurField("name")}
                      />
                      <Field
                        id="co-email"
                        icon={<Mail className="w-4 h-4" />}
                        type="email"
                        inputMode="email"
                        placeholder="E-mail para receber o pedido"
                        autoComplete="email"
                        value={customer.email}
                        error={errors.email}
                        valid={touched.email && !errors.email && !validateField("email", customer.email)}
                        onChange={(v) => updateField("email", v)}
                        onBlur={() => blurField("email")}
                      />
                      <Field
                        id="co-phone"
                        icon={<Phone className="w-4 h-4" />}
                        type="tel"
                        inputMode="tel"
                        placeholder="(11) 91234-5678"
                        autoComplete="tel"
                        maxLength={16}
                        pattern="\(\d{2}\) \d{4,5}-\d{4}"
                        value={customer.phone}
                        error={errors.phone}
                        valid={touched.phone && !errors.phone && !validateField("phone", customer.phone)}
                        onChange={(v) => updateField("phone", v)}
                        onBlur={() => blurField("phone")}
                      />

                      {/* CEP — campo de destaque, isolado como nos grandes e-commerces */}
                      <div className="sm:max-w-[14rem]">
                        <Field
                           id="co-cep"
                          icon={<MapPin className="w-4 h-4" />}
                          placeholder="Digite teu CEP"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          maxLength={9}
                          pattern="\d{5}-\d{3}"
                          value={customer.cep}
                          error={errors.cep}
                          valid={touched.cep && !errors.cep && !cepLoading && !validateField("cep", customer.cep)}
                          onChange={(v) => updateField("cep", v)}
                          onBlur={() => blurField("cep")}
                          rightSlot={
                            cepLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            ) : errors.cep && customer.cep.replace(/\D/g, "").length === 8 ? (
                              <button
                                type="button"
                                onClick={() => lookupCep(customer.cep)}
                                className="text-[11px] font-semibold text-primary hover:underline shrink-0"
                                aria-label="Tentar consultar o CEP novamente"
                              >
                                ↻ Tentar
                              </button>
                            ) : null
                          }
                        />
                      </div>

                      {/* Rua — linha cheia */}
                      <Field
                         id="co-street"
                        icon={<MapPin className="w-4 h-4" />}
                        placeholder="Rua, avenida, travessa..."
                        autoComplete="address-line1"
                        maxLength={120}
                        value={customer.street}
                        error={errors.street}
                        valid={touched.street && !errors.street && !validateField("street", customer.street)}
                        onChange={(v) => updateField("street", v)}
                        onBlur={() => blurField("street")}
                      />

                      {/* Número + Complemento (número curto, complemento amplo) */}
                      <div className="grid grid-cols-[8rem_1fr] gap-2">
                         <Field
                          id="co-number"
                          icon={<Building2 className="w-4 h-4" />}
                          placeholder="Ex.: 123"
                          inputMode="text"
                          maxLength={15}
                          value={customer.number}
                          error={errors.number}
                          valid={touched.number && !errors.number && !validateField("number", customer.number)}
                          onChange={(v) => updateField("number", v)}
                          onBlur={() => blurField("number")}
                        />
                         <Field
                          id="co-complement"
                          icon={<StickyNote className="w-4 h-4" />}
                          placeholder="Apto, bloco, casa, ponto de referência"
                          autoComplete="address-line2"
                          maxLength={80}
                          value={customer.complement ?? ""}
                          error={errors.complement}
                          valid={touched.complement && !errors.complement}
                          onChange={(v) => updateField("complement", v)}
                          onBlur={() => blurField("complement")}
                        />
                      </div>

                      {/* Bairro — linha cheia */}
                      <Field
                         id="co-neighborhood"
                        icon={<Building2 className="w-4 h-4" />}
                        placeholder="Bairro"
                        autoComplete="address-level3"
                        maxLength={80}
                        value={customer.neighborhood}
                        error={errors.neighborhood}
                        valid={touched.neighborhood && !errors.neighborhood && !validateField("neighborhood", customer.neighborhood)}
                        onChange={(v) => updateField("neighborhood", v)}
                        onBlur={() => blurField("neighborhood")}
                      />

                      {/* Cidade + UF (UF apenas como badge, vem do CEP) */}
                      <Field
                         id="co-city"
                        icon={<Building2 className="w-4 h-4" />}
                        placeholder="Cidade"
                        autoComplete="address-level2"
                        maxLength={80}
                        value={customer.city}
                        error={errors.city}
                        valid={touched.city && !errors.city && !validateField("city", customer.city)}
                        onChange={(v) => updateField("city", v)}
                        onBlur={() => blurField("city")}
                        rightSlot={
                          cepUF && !errors.city ? (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                              {cepUF}
                            </span>
                          ) : null
                        }
                      />

                      {/* Aniversário (opcional) — para o marketing oferecer descontos */}
                      <Field
                        id="co-birthday"
                        icon={<Cake className="w-4 h-4" />}
                        placeholder="DD/MM/AAAA - Aniversário (opcional)"
                        inputMode="numeric"
                        maxLength={10}
                        value={birthdayToBR(birthday)}
                        onChange={(v) => setBirthday(maskBirthdayInput(v))}
                      />

                      {cepUF && !errors.cep && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2"
                          aria-live="polite"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80 inline-flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5" />
                              Opções de frete
                            </p>
                            {shippingLoading && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Calculando…
                              </span>
                            )}
                          </div>

                          {shippingError && !shippingLoading && (
                            <div className="flex items-start gap-2 text-[11px] text-destructive bg-destructive/10 border border-destructive/30 rounded p-2">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p>{shippingError}</p>
                                <button
                                  type="button"
                                  onClick={() => loadShipping(customer.cep.replace(/\D/g, ""))}
                                  className="underline font-medium mt-1"
                                >
                                  Tentar novamente
                                </button>
                              </div>
                            </div>
                          )}

                          {!shippingLoading && !shippingError && shippingOptions.length > 0 && (
                            <ul className="space-y-1.5" role="radiogroup" aria-label="Opções de frete">
                              {shippingOptions.map((opt) => {
                                const checked = opt.id === selectedShippingId;
                                return (
                                  <li key={opt.id}>
                                    <button
                                      type="button"
                                      role="radio"
                                      aria-checked={checked}
                                      onClick={() => setSelectedShippingId(opt.id)}
                                      className={`w-full flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                                        checked
                                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                                          : "border-border bg-background/60 hover:bg-secondary"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                          className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                                            checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                                          }`}
                                        />
                                        {opt.companyLogo && (
                                          <img
                                            src={opt.companyLogo}
                                            alt={opt.company}
                                            className="w-6 h-6 object-contain shrink-0"
                                          />
                                        )}
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-foreground truncate">
                                            {opt.company} {opt.name}
                                          </p>
                                          <p className="text-[10.5px] text-muted-foreground">
                                            {opt.deliveryDays
                                              ? `Entrega em até ${opt.deliveryDays} dia${opt.deliveryDays > 1 ? "s" : ""} útei${opt.deliveryDays > 1 ? "s" : "l"}`
                                              : "Prazo a confirmar"}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                                        {formatBRL(opt.priceCents / 100)}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {selectedShipping && (
                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/60">
                              <span className="text-muted-foreground">Total com frete</span>
                              <span className="font-semibold text-foreground tabular-nums">
                                {formatBRL(totalWithShipping)}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Alerta amigável de divergência CEP ↔ UF */}
                      {cepMismatchUF && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          role="alert"
                          className="flex gap-2.5 items-start text-xs rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-2.5"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                          <div className="space-y-1">
                            <p className="font-semibold">
                              CEP não bate com o estado {cepMismatchUF}
                            </p>
                            <p className="text-destructive/90">
                              Os 8 dígitos informados pertencem a outra região. Como corrigir:
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5 text-destructive/90">
                              <li>Confira se não inverteu números (ex.: 01310-100 ≠ 13010-100).</li>
                              <li>Verifique o CEP do seu endereço em <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="underline font-medium">buscacepinter.correios.com.br</a>.</li>
                              <li>Após corrigir, toque em <span className="font-semibold">↻ Tentar</span> ao lado do campo.</li>
                            </ul>
                          </div>
                        </motion.div>
                      )}

                      <div className="flex items-center gap-2 pt-1" aria-live="polite">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              step1Valid ? "bg-emerald-500" : "bg-primary"
                            }`}
                            initial={false}
                            animate={{ width: `${(filledCount / FIELD_ORDER.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-medium tabular-nums ${
                            step1Valid ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          }`}
                        >
                          {filledCount}/{FIELD_ORDER.length}
                        </span>
                      </div>

                      {/* Resumo de campos prontos x pendentes (clique para focar) */}
                      {(() => {
                        const pending = FIELD_ORDER.filter(
                          (f) => !!validateField(f, customer[f]) || (f === "cep" && !cepUF && !cepLoading),
                        );
                        const ready = FIELD_ORDER.filter((f) => !pending.includes(f));
                        if (ready.length + pending.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1.5 pt-0.5" aria-live="polite">
                            {ready.map((f) => (
                              <span
                                key={f}
                                className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {FIELD_LABELS[f]}
                              </span>
                            ))}
                            {pending.map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => focusField(f)}
                                className="inline-flex items-center gap-1 text-[10.5px] font-medium text-destructive bg-destructive/10 border border-destructive/30 rounded-full px-2 py-0.5 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-destructive/40 transition-colors"
                                aria-label={`Ir para o campo ${FIELD_LABELS[f]}`}
                              >
                                <AlertCircle className="w-3 h-3" />
                                {FIELD_LABELS[f]}
                              </button>
                            ))}
                          </div>
                        );
                      })()}

                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <strong className="text-foreground">Este é o endereço de entrega.</strong> Mesmo que algo seja alterado na tela de pagamento, usamos o endereço digitado aqui.
                      </p>
                    </motion.div>
                  )}


                  {/* === STEP 2: Resumo === */}
                  {step === 2 && (
                    <motion.div
                      key="s2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Dados do cliente */}
                      <section className="rounded-lg border border-border bg-secondary/40 p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                            Seus dados
                          </p>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs text-primary hover:underline"
                          >
                            Editar
                          </button>
                        </div>
                        <p className="text-sm text-foreground">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.city}{cepUF ? `/${cepUF}` : ""} — CEP {customer.cep}
                        </p>
                      </section>

                      {/* Itens (com pré-visualização: imagem + personalização) */}
                      <section className="rounded-lg border border-border p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80 inline-flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Pré-visualização do pedido
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {totalItems} {totalItems === 1 ? "item" : "itens"}
                            {customizedCount > 0 && ` · ${customizedCount} personalizado${customizedCount > 1 ? "s" : ""}`}
                          </span>
                        </div>
                        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {items.map((it) => {
                            const hasNote = !!it.notes?.trim();
                            return (
                              <li
                                key={`co-sum-${it.id}`}
                                className="flex items-start gap-2.5 p-2 rounded-md bg-background/40 border border-border/60"
                              >
                                {it.image ? (
                                  <img
                                    src={it.image}
                                    alt={it.name}
                                    className="w-12 h-12 rounded object-cover shrink-0 border border-border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-medium text-foreground line-clamp-2">
                                      <span className="text-muted-foreground">{it.quantity}×</span> {it.name}
                                    </p>
                                    <span className="text-xs text-foreground/90 font-semibold shrink-0 tabular-nums">
                                      {formatBRL(it.priceNum * it.quantity)}
                                    </span>
                                  </div>
                                  {hasNote ? (
                                    <div className="mt-1 flex items-start gap-1 rounded bg-primary/5 border border-primary/20 px-1.5 py-1">
                                      <StickyNote className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                                      <p className="text-[11px] text-foreground/80 italic line-clamp-2 whitespace-pre-wrap">
                                        “{it.notes!.trim()}”
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                                      Sem personalização
                                    </p>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </section>

                      {/* Endereço + estimativa de frete */}
                      <section className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80 inline-flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            Entrega estimada
                          </p>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs text-primary hover:underline"
                          >
                            Alterar CEP
                          </button>
                        </div>
                         <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="text-xs text-foreground space-y-0.5 min-w-0">
                            <p className="font-medium">
                              {customer.street}
                              {customer.number ? `, ${customer.number}` : ""}
                              {customer.complement ? ` — ${customer.complement}` : ""}
                            </p>
                            {customer.neighborhood && (
                              <p className="text-muted-foreground">{customer.neighborhood}</p>
                            )}
                            <p className="text-muted-foreground">
                              {customer.city}{cepUF ? ` / ${cepUF}` : ""} · CEP {customer.cep}
                            </p>
                          </div>
                        </div>
                        {selectedShipping ? (
                          <div className="flex items-center justify-between rounded bg-background/60 px-2.5 py-2 border border-border/60">
                            <div className="text-[11px] min-w-0 flex items-center gap-2">
                              {selectedShipping.companyLogo && (
                                <img src={selectedShipping.companyLogo} alt="" className="w-5 h-5 object-contain shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-foreground/90 font-medium truncate">
                                  {selectedShipping.company} {selectedShipping.name}
                                </p>
                                <p className="text-muted-foreground">
                                  {selectedShipping.deliveryDays
                                    ? `Entrega em até ${selectedShipping.deliveryDays} dia${selectedShipping.deliveryDays > 1 ? "s" : ""} útei${selectedShipping.deliveryDays > 1 ? "s" : "l"}`
                                    : "Prazo a confirmar"}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-foreground tabular-nums shrink-0">
                              {formatBRL(shippingValue)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            Volte à etapa anterior para selecionar uma opção de frete.
                          </p>
                        )}
                        <div className="flex items-start gap-1.5 rounded-md bg-primary/10 border border-primary/30 px-2 py-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                          <p className="text-[11px] text-foreground/90 leading-snug">
                            <strong>Endereço de entrega:</strong> usamos exatamente o que você digitou aqui. Alterações feitas na tela do Mercado Pago são ignoradas.
                          </p>
                        </div>
                        <p className="flex items-start gap-1 text-[10px] text-muted-foreground/80">
                          <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
                          Frete cobrado junto ao pedido.
                        </p>
                      </section>

                      {/* Totais */}
                      <section className="rounded-lg border border-border bg-secondary/40 p-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{formatBRL(subtotal)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex items-center justify-between text-xs text-primary">
                            <span className="inline-flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              Cupom {appliedCoupon.code} (-{appliedCoupon.discount_percent}%)
                            </span>
                            <span>-{formatBRL(discount)}</span>
                          </div>
                        )}
                        {selectedShipping && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Frete ({selectedShipping.company} {selectedShipping.name})
                            </span>
                            <span>+{formatBRL(shippingValue)}</span>
                          </div>
                        )}
                        <div className="flex items-end justify-between pt-1.5 border-t border-dashed border-primary/30">
                          <div className="pt-1.5">
                            <span className="text-sm font-semibold text-primary inline-flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5" />
                              Total a pagar
                            </span>
                            <p className="text-[10px] text-muted-foreground">produtos + frete</p>
                          </div>
                          <span className="font-serif text-2xl font-bold text-primary leading-none pt-1.5 tabular-nums">
                            {formatBRL(totalWithShipping)}
                          </span>
                        </div>
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground/80 pt-1">
                          <ShieldCheck className="w-3 h-3" />
                          Pagamento seguro via Mercado Pago.
                        </p>
                      </section>
                    </motion.div>
                  )}


                  {/* === STEP 3: Redirecionando / Fallback de erro === */}
                  {step === 3 && (
                    <motion.div
                      key="s3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="py-8 flex flex-col items-center justify-center text-center space-y-4"
                    >
                      {checkoutError ? (
                        <>
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-serif text-lg font-semibold text-foreground">
                              Não foi possível abrir o pagamento
                            </p>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              {checkoutError}
                            </p>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 mt-2">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Seus dados foram salvos — nada do que você preencheu foi perdido.
                            </p>
                          </div>

                          <div className="w-full max-w-sm space-y-2 pt-2">
                            {checkoutUrl && (
                              <Button
                                onClick={() => window.open(checkoutUrl, "_blank", "noopener,noreferrer")}
                                size="lg"
                                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Abrir pagamento manualmente
                              </Button>
                            )}
                            <Button
                              onClick={retryCheckout}
                              variant={checkoutUrl ? "outline" : "default"}
                              size="lg"
                              className="w-full gap-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Tentar novamente{retryCount > 0 ? ` (${retryCount + 1}ª)` : ""}
                            </Button>
                            <Button
                              onClick={backToSummary}
                              variant="ghost"
                              size="lg"
                              className="w-full gap-2"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              Voltar e revisar dados
                            </Button>
                            <a
                              href={`https://wa.me/5519993512766?text=${encodeURIComponent(
                                `Olá! Tive um problema ao finalizar meu pedido no site (${customer.name || "sem nome"}). Pode me ajudar?`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground pt-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Falar conosco no WhatsApp
                            </a>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                              <CreditCard className="w-7 h-7" />
                            </div>
                          </div>
                          <div>
                            <p className="font-serif text-lg font-semibold text-foreground">
                              Redirecionando para o pagamento seguro
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Você será levado(a) ao ambiente do Mercado Pago em instantes…
                            </p>
                          </div>
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Conexão criptografada — seus dados nunca passam pelo nosso servidor.
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Footer */}
              {step !== 3 && (
                <div className="px-5 py-4 border-t border-border bg-secondary/30">
                  <div className="flex items-center justify-between gap-3">
                    <Button variant="ghost" onClick={goBack} disabled={submitting} className="gap-1">
                      <ArrowLeft className="w-4 h-4" />
                      {step === 1 ? "Cancelar" : "Voltar"}
                    </Button>
                    <Button
                      onClick={goNext}
                      disabled={
                        submitting ||
                        items.length === 0 ||
                        (step === 1 && !step1Valid)
                      }
                      size="lg"
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[10rem] disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        step === 1 && !step1Valid
                          ? errors.cep
                            ? `Corrija o CEP para continuar: ${errors.cep}`
                            : "Preencha todos os campos corretamente"
                          : undefined
                      }
                    >
                      {step === 2 ? (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Ir para pagamento
                        </>
                      ) : (
                        <>
                          Continuar
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

interface FieldProps {
  id: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  error?: string;
  valid?: boolean;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "url" | "search" | "none" | "decimal";
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  rightSlot?: React.ReactNode;
  label?: string;
}

const Field = ({
  id,
  icon,
  placeholder,
  value,
  error,
  valid,
  onChange,
  onBlur,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  pattern,
  rightSlot,
  label,
}: FieldProps) => (
  <div className="space-y-1">
    {label && (
      <label
        htmlFor={id}
        className="text-[11px] font-medium text-muted-foreground pl-1 uppercase tracking-wide"
      >
        {label}
      </label>
    )}
    <div
      className={`flex items-center gap-2 bg-secondary rounded-lg px-3 border transition-colors ${
        error
          ? "border-destructive ring-1 ring-destructive/30"
          : valid
            ? "border-emerald-500/60"
            : "border-transparent focus-within:border-primary/60"
      }`}
    >
      <span className={`shrink-0 ${error ? "text-destructive" : valid ? "text-emerald-500" : "text-muted-foreground"}`}>
        {icon}
      </span>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        pattern={pattern}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground py-2.5 outline-none w-full min-w-0"
      />
      {rightSlot}
      {valid && !rightSlot && (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden />
      )}
    </div>
    {error && (
      <motion.p
        id={`${id}-err`}
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1 text-xs text-destructive pl-1"
      >
        <AlertCircle className="w-3 h-3 shrink-0" />
        {error}
      </motion.p>
    )}
  </div>
);

export default CheckoutDialog;
