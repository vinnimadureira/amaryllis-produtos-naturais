import { useState, useEffect } from "react";
import { Save, Loader2, Building2, Phone, Mail, MapPin, Clock, MessageSquare, FileText, Truck, CalendarClock, Factory, CreditCard, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";

const SECURE_KEYS = [
  "mercadopago_access_token",
  "melhor_envio_token_sandbox",
  "melhor_envio_token_production",
] as const;
type SecureKey = (typeof SECURE_KEYS)[number];

const FORM_KEYS = {
  site_name: "",
  site_cnpj: "",
  site_phone: "",
  site_whatsapp: "",
  site_email: "",
  site_address: "",
  site_hours_weekday: "",
  site_hours_saturday: "",
  melhor_envio_origin_cep: "",
  melhor_envio_environment: "sandbox",
  production_lead_days: "5",
  payment_mercadopago_enabled: "true",
  
};

const BusinessDataSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...FORM_KEYS });
  const [secure, setSecure] = useState<Record<SecureKey, string>>({
    mercadopago_access_token: "",
    melhor_envio_token_sandbox: "",
    melhor_envio_token_production: "",
  });
  const [showSecret, setShowSecret] = useState<Record<SecureKey, boolean>>({
    mercadopago_access_token: false,
    melhor_envio_token_sandbox: false,
    melhor_envio_token_production: false,
  });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", Object.keys(FORM_KEYS));
      if (error) throw error;
      return data || [];
    },
  });

  const { data: secureSettings = [] } = useQuery({
    queryKey: ["secure-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secure_settings" as any)
        .select("key, value")
        .in("key", SECURE_KEYS as unknown as string[]);
      if (error) throw error;
      return (data as unknown as { key: string; value: string | null }[]) || [];
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const newForm = { ...FORM_KEYS };
      settings.forEach((s: any) => {
        if (s.key in newForm) (newForm as any)[s.key] = s.value || "";
      });
      setForm(newForm);
    }
  }, [settings]);

  useEffect(() => {
    if (secureSettings.length > 0) {
      const next = { ...secure };
      secureSettings.forEach((s) => {
        if ((SECURE_KEYS as readonly string[]).includes(s.key)) {
          next[s.key as SecureKey] = s.value || "";
        }
      });
      setSecure(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secureSettings]);

  async function handleSave() {
    setSaving(true);
    try {
      const promises = Object.entries(form).map(([key, value]) => {
        const existing = settings.find((s: any) => s.key === key);
        if (existing) return supabase.from("site_settings").update({ value: value || null }).eq("id", existing.id);
        else return supabase.from("site_settings").insert({ key, value: value || null });
      });
      const results = await Promise.all(promises);
      const hasError = results.find((r) => r.error);
      if (hasError?.error) throw hasError.error;

      // Salva credenciais sensíveis (apenas as preenchidas — vazio mantém o valor anterior)
      const securePromises = (Object.entries(secure) as [SecureKey, string][])
        .map(([key, value]) => {
          const trimmed = value.trim();
          if (!trimmed) return null;
          return supabase
            .from("secure_settings" as any)
            .upsert({ key, value: trimmed }, { onConflict: "key" });
        })
        .filter(Boolean) as unknown as Promise<any>[];
      if (securePromises.length) {
        const secResults = await Promise.all(securePromises);
        const secErr = secResults.find((r) => r.error);
        if (secErr?.error) throw secErr.error;
      }

      toast({ title: "Dados salvos com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["secure-settings"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const maskToken = (t: string) =>
    !t ? "" : t.length <= 10 ? "•".repeat(t.length) : `${t.slice(0, 6)}${"•".repeat(Math.max(4, t.length - 10))}${t.slice(-4)}`;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const fields: { key: keyof typeof form; label: string; icon: LucideIcon; placeholder: string; type?: string }[] = [
    { key: "site_name", label: "Nome do Negócio", icon: Building2, placeholder: "Ex: 7S Soluções" },
    { key: "site_cnpj", label: "CNPJ", icon: FileText, placeholder: "00.000.000/0000-00" },
    { key: "site_phone", label: "Telefone", icon: Phone, placeholder: "(11) 99999-9999" },
    { key: "site_whatsapp", label: "WhatsApp (com DDD)", icon: MessageSquare, placeholder: "5511999999999" },
    { key: "site_email", label: "E-mail", icon: Mail, placeholder: "contato@7ssolucoes.com.br", type: "email" },
    { key: "site_address", label: "Endereço Completo", icon: MapPin, placeholder: "Rua, número, bairro, cidade - UF" },
    { key: "site_hours_weekday", label: "Horário (Seg-Sex)", icon: Clock, placeholder: "08:00 às 18:00" },
    { key: "site_hours_saturday", label: "Horário (Sábado)", icon: Clock, placeholder: "08:00 às 14:00" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-foreground">Dados do Negócio</h2>
            <p className="text-xs text-muted-foreground">Informações usadas no site</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className={field.key === "site_address" ? "md:col-span-2" : ""}>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              <field.icon className="w-3.5 h-3.5" />{field.label}
            </label>
            <Input
              type={field.type || "text"}
              value={form[field.key]}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      {/* Frete & Envio (Melhor Envio) */}
      <div className="mt-10 pt-6 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Frete & Envio</h3>
            <p className="text-xs text-muted-foreground">Configurações da integração com Melhor Envio</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              <MapPin className="w-3.5 h-3.5" />CEP de origem
            </label>
            <Input
              value={form.melhor_envio_origin_cep}
              onChange={(e) => setForm((f) => ({ ...f, melhor_envio_origin_cep: e.target.value }))}
              placeholder="00000-000"
              maxLength={9}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              CEP de onde os pedidos são despachados (8 dígitos).
            </p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              <Truck className="w-3.5 h-3.5" />Ambiente Melhor Envio
            </label>
            <Select
              value={form.melhor_envio_environment || "sandbox"}
              onValueChange={(v) => setForm((f) => ({ ...f, melhor_envio_environment: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
                <SelectItem value="production">Produção (real)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Use sandbox para testar; troque para produção quando tudo estiver ok.
            </p>
          </div>
        </div>
      </div>

      {/* Pedidos & Produção */}
      <div className="mt-10 pt-6 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Factory className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Pedidos & Produção</h3>
            <p className="text-xs text-muted-foreground">Como pedidos pagos viram eventos na agenda</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              <CalendarClock className="w-3.5 h-3.5" />Prazo de produção (dias úteis)
            </label>
            <Input
              type="number"
              min={1}
              max={60}
              value={form.production_lead_days}
              onChange={(e) => setForm((f) => ({ ...f, production_lead_days: e.target.value }))}
              placeholder="5"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Quando um pedido é pago, é criado automaticamente um evento na agenda
              com esse prazo (pulando sábado e domingo).
            </p>
          </div>
        </div>
      </div>

      {/* Métodos de pagamento */}
      <div className="mt-10 pt-6 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Métodos de pagamento</h3>
            <p className="text-xs text-muted-foreground">Ative ou desative gateways disponíveis no checkout</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#00B1EA]/10 flex items-center justify-center text-[#00B1EA] font-bold text-sm">MP</div>
              <div>
                <p className="text-sm font-medium text-foreground">Mercado Pago</p>
                <p className="text-[11px] text-muted-foreground">Pix, cartão e boleto via Checkout Pro</p>
              </div>
            </div>
            <Switch
              checked={form.payment_mercadopago_enabled === "true"}
              onCheckedChange={(v) => setForm((f) => ({ ...f, payment_mercadopago_enabled: v ? "true" : "false" }))}
            />
          </div>
          {form.payment_mercadopago_enabled !== "true" && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠️ Nenhum método ativo: o botão de finalizar compra ficará bloqueado no site.
            </p>
          )}
        </div>
      </div>

      {/* Credenciais (tokens) */}
      <div className="mt-10 pt-6 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-foreground">Credenciais & Tokens</h3>
            <p className="text-xs text-muted-foreground">
              Guarde aqui as chaves do Mercado Pago e do Melhor Envio da sua conta.
              Só administradores podem ver ou alterar. Deixe em branco para manter o valor atual.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {([
            {
              key: "mercadopago_access_token" as SecureKey,
              label: "Mercado Pago — Access Token",
              hint: "Cole APP_USR-... (produção) ou TEST-... (testes). O ambiente é detectado automaticamente.",
            },
            {
              key: "melhor_envio_token_sandbox" as SecureKey,
              label: "Melhor Envio — Token Sandbox",
              hint: "Token gerado em sandbox.melhorenvio.com.br (para testes).",
            },
            {
              key: "melhor_envio_token_production" as SecureKey,
              label: "Melhor Envio — Token Produção",
              hint: "Token gerado em melhorenvio.com.br (envios reais).",
            },
          ]).map(({ key, label, hint }) => {
            const current = (secureSettings.find((s) => s.key === key)?.value || "").trim();
            const isShown = showSecret[key];
            const draft = secure[key];
            return (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  <KeyRound className="w-3.5 h-3.5" />{label}
                </label>
                <div className="flex gap-2">
                  <Input
                    type={isShown ? "text" : "password"}
                    value={draft}
                    onChange={(e) => setSecure((s) => ({ ...s, [key]: e.target.value }))}
                    placeholder={current ? `Atual: ${maskToken(current)}` : "Cole o token aqui"}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecret((s) => ({ ...s, [key]: !s[key] }))}
                    title={isShown ? "Ocultar" : "Mostrar"}
                  >
                    {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-700 dark:text-amber-300">
          <strong>Como trocar para produção:</strong> cole o token de produção do Mercado Pago acima
          (começa com <code>APP_USR-</code>) e o token de produção do Melhor Envio. Depois, em
          “Frete &amp; Envio”, mude o ambiente para <strong>Produção</strong>. Clique em Salvar.
          Não esqueça de configurar a URL de webhook do MP apontando para a sua função
          <code> mercadopago-webhook</code>.
        </div>
      </div>
    </div>
  );
};

export default BusinessDataSettings;
