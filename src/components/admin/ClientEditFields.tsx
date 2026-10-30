import { useEffect, useRef, useState } from "react";
import { Cake, Mail, MapPin, Phone, StickyNote, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface ClientEditAddress {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  city: string;
  state: string;
}

export interface ClientEditValue {
  name: string;
  phone: string;
  email: string;
  birthday: string; // ISO YYYY-MM-DD ou parcial em BR
  notes: string;
  address: ClientEditAddress;
}

interface Props {
  value: ClientEditValue;
  onChange: (next: ClientEditValue) => void;
  showName?: boolean;
  showNotes?: boolean;
}

const formatCEP = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  // Mantém prefixo +55 se começar com 55
  if (digits.startsWith("55") && digits.length > 11) {
    const rest = digits.slice(2);
    return `+55 ${rest.slice(0, 2) ? `(${rest.slice(0, 2)})` : ""}${rest.length > 2 ? ` ${rest.slice(2, 7)}` : ""}${rest.length > 7 ? `-${rest.slice(7)}` : ""}`.trim();
  }
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

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
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    const dn = Number(d), mn = Number(m), yn = Number(y);
    if (mn >= 1 && mn <= 12 && dn >= 1 && dn <= 31 && yn >= 1900 && yn <= 2100) {
      return `${y}-${m}-${d}`;
    }
  }
  return br;
}

const FieldLabel = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
    {icon}
    {children}
  </Label>
);

/**
 * Espelha o layout de ClientReadFields (mesmas seções, mesma grid, mesmos
 * ícones), mas com inputs editáveis. Inclui auto-preenchimento via ViaCEP.
 */
const ClientEditFields = ({ value, onChange, showName = true, showNotes = true }: Props) => {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const lookedUpRef = useRef<string>("");

  const addr = value.address;
  const setAddr = (patch: Partial<ClientEditAddress>) =>
    onChange({ ...value, address: { ...addr, ...patch } });

  useEffect(() => {
    const digits = addr.cep.replace(/\D/g, "");
    if (digits.length !== 8 || lookedUpRef.current === digits) return;
    lookedUpRef.current = digits;
    setCepError(null);
    setCepLoading(true);
    const ctrl = new AbortController();
    fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json?.erro) {
          setCepError("CEP não encontrado.");
          return;
        }
        onChange({
          ...value,
          address: {
            ...addr,
            street: json.logradouro || addr.street,
            neighborhood: json.bairro || addr.neighborhood,
            city: json.localidade || addr.city,
            state: (json.uf || "").toUpperCase() || addr.state,
          },
        });
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setCepError("Erro ao buscar CEP. Preencha manualmente.");
      })
      .finally(() => setCepLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr.cep]);

  return (
    <div className="space-y-3">
      {showName && (
        <div className="space-y-1.5">
          <FieldLabel>Nome <span className="text-destructive">*</span></FieldLabel>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Nome completo"
            autoComplete="name"
            maxLength={120}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel icon={<Phone className="w-3.5 h-3.5" />}>WhatsApp / Telefone</FieldLabel>
          <Input
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: maskPhone(e.target.value) })}
            placeholder="(11) 98765-4321"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel icon={<Cake className="w-3.5 h-3.5 text-pink-500" />}>Aniversário</FieldLabel>
          <Input
            value={birthdayToBR(value.birthday)}
            onChange={(e) => onChange({ ...value, birthday: maskBirthdayInput(e.target.value) })}
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
            maxLength={10}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel icon={<Mail className="w-3.5 h-3.5" />}>E-mail</FieldLabel>
        <Input
          type="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          placeholder="email@exemplo.com"
          autoComplete="email"
          maxLength={255}
        />
      </div>

      <div className="pt-1">
        <FieldLabel icon={<MapPin className="w-3.5 h-3.5" />}>Endereço de entrega</FieldLabel>
        <div className="mt-1.5 rounded-md border border-border/60 bg-muted/40 p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Logradouro</Label>
              <Input
                value={addr.street}
                onChange={(e) => setAddr({ street: e.target.value })}
                placeholder="Rua, avenida..."
                autoComplete="address-line1"
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Número</Label>
              <Input
                value={addr.number}
                onChange={(e) => setAddr({ number: e.target.value })}
                placeholder="123"
                maxLength={15}
                className="tabular-nums"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Bairro</Label>
              <Input
                value={addr.neighborhood}
                onChange={(e) => setAddr({ neighborhood: e.target.value })}
                placeholder="Bairro"
                autoComplete="address-level3"
                maxLength={80}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Complemento</Label>
              <Input
                value={addr.complement}
                onChange={(e) => setAddr({ complement: e.target.value })}
                placeholder="Apto, bloco, casa..."
                autoComplete="address-line2"
                maxLength={80}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_80px_140px] gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Cidade</Label>
              <Input
                value={addr.city}
                onChange={(e) => setAddr({ city: e.target.value })}
                placeholder="Cidade"
                autoComplete="address-level2"
                maxLength={80}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">UF</Label>
              <Input
                value={addr.state}
                onChange={(e) => setAddr({ state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="SP"
                maxLength={2}
                className="uppercase tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">CEP</Label>
              <div className="relative">
                <Input
                  value={addr.cep}
                  onChange={(e) => setAddr({ cep: formatCEP(e.target.value) })}
                  placeholder="00000-000"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={9}
                  className="tabular-nums pr-8"
                />
                {cepLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {cepError && <p className="text-[11px] text-destructive">{cepError}</p>}
            </div>
          </div>
        </div>
      </div>

      {showNotes && (
        <div className="space-y-1.5">
          <FieldLabel icon={<StickyNote className="w-3.5 h-3.5" />}>Observações</FieldLabel>
          <Textarea
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            rows={3}
            placeholder="Preferências, anotações..."
            maxLength={1000}
          />
        </div>
      )}
    </div>
  );
};

export default ClientEditFields;
