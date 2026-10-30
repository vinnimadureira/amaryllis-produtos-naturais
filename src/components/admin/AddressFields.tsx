import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Building2, StickyNote } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface AddressValue {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  city: string;
  state: string;
}

export const emptyAddress: AddressValue = {
  cep: "", street: "", number: "", neighborhood: "", complement: "", city: "", state: "",
};

interface Props {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  disabled?: boolean;
}

const formatCEP = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

const CEP_RANGE_BY_UF: Record<string, [string, string]> = {
  SP: ["01000000", "19999999"], RJ: ["20000000", "28999999"], ES: ["29000000", "29999999"],
  MG: ["30000000", "39999999"], BA: ["40000000", "48999999"], SE: ["49000000", "49999999"],
  PE: ["50000000", "56999999"], AL: ["57000000", "57999999"], PB: ["58000000", "58999999"],
  RN: ["59000000", "59999999"], CE: ["60000000", "63999999"], PI: ["64000000", "64999999"],
  MA: ["65000000", "65999999"], PA: ["66000000", "68899999"], AP: ["68900000", "68999999"],
  AM: ["69000000", "69299999"], RR: ["69300000", "69399999"], AC: ["69900000", "69999999"],
  DF: ["70000000", "72799999"], GO: ["72800000", "76799999"], TO: ["77000000", "77999999"],
  MT: ["78000000", "78899999"], MS: ["79000000", "79999999"], PR: ["80000000", "87999999"],
  SC: ["88000000", "89999999"], RS: ["90000000", "99999999"],
};
const CEP_RANGE_EXTRA: Array<{ uf: string; range: [string, string] }> = [
  { uf: "AM", range: ["69400000", "69899999"] },
  { uf: "RO", range: ["76800000", "76999999"] },
];
const isCepInUF = (digits: string, uf: string) => {
  if (digits.length !== 8 || !uf) return true;
  const main = CEP_RANGE_BY_UF[uf];
  const inMain = main ? digits >= main[0] && digits <= main[1] : false;
  const inExtra = CEP_RANGE_EXTRA.some((e) => e.uf === uf && digits >= e.range[0] && digits <= e.range[1]);
  if (!main && !CEP_RANGE_EXTRA.some((e) => e.uf === uf)) return true;
  return inMain || inExtra;
};

interface FieldProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  inputMode?: "text" | "numeric";
  autoComplete?: string;
  maxLength?: number;
  rightSlot?: React.ReactNode;
  id?: string;
}
const Field = ({ icon, placeholder, value, onChange, disabled, inputMode, autoComplete, maxLength, rightSlot, id }: FieldProps) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</span>
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      autoComplete={autoComplete}
      maxLength={maxLength}
      className={`pl-9 ${rightSlot ? "pr-12" : ""}`}
    />
    {rightSlot && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">{rightSlot}</span>
    )}
  </div>
);

const AddressFields = ({ value, onChange, disabled }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lookedUpRef = useRef<string>("");

  useEffect(() => {
    const digits = value.cep.replace(/\D/g, "");
    if (digits.length !== 8 || lookedUpRef.current === digits) return;
    lookedUpRef.current = digits;
    setError(null);
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json?.erro) {
          setError("CEP não encontrado.");
          return;
        }
        const uf = (json.uf || "").toUpperCase();
        if (uf && !isCepInUF(digits, uf)) {
          setError(`Este CEP não corresponde ao estado ${uf}.`);
        }
        onChange({
          ...value,
          street: json.logradouro || value.street,
          neighborhood: json.bairro || value.neighborhood,
          city: json.localidade || value.city,
          state: uf || value.state,
        });
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setError("Erro ao buscar CEP. Preencha manualmente.");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.cep]);

  return (
    <div className="space-y-2.5">
      {/* CEP — destaque, isolado e curto */}
      <div className="sm:max-w-[14rem]">
        <Field
          icon={<MapPin className="w-4 h-4" />}
          placeholder="00000-000"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={9}
          value={value.cep}
          disabled={disabled}
          onChange={(v) => onChange({ ...value, cep: formatCEP(v) })}
          rightSlot={loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : null}
        />
        {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
      </div>

      {/* Rua — linha cheia */}
      <Field
        icon={<MapPin className="w-4 h-4" />}
        placeholder="Rua, avenida, travessa..."
        autoComplete="address-line1"
        maxLength={120}
        value={value.street}
        disabled={disabled}
        onChange={(v) => onChange({ ...value, street: v })}
      />

      {/* Número + Complemento */}
      <div className="grid grid-cols-[8rem_1fr] gap-2">
        <Field
          icon={<Building2 className="w-4 h-4" />}
          placeholder="Ex.: 123"
          maxLength={15}
          value={value.number}
          disabled={disabled}
          onChange={(v) => onChange({ ...value, number: v })}
        />
        <Field
          icon={<StickyNote className="w-4 h-4" />}
          placeholder="Apto, bloco, casa, ponto de referência"
          autoComplete="address-line2"
          maxLength={80}
          value={value.complement}
          disabled={disabled}
          onChange={(v) => onChange({ ...value, complement: v })}
        />
      </div>

      {/* Bairro — linha cheia */}
      <Field
        icon={<Building2 className="w-4 h-4" />}
        placeholder="Bairro"
        autoComplete="address-level3"
        maxLength={80}
        value={value.neighborhood}
        disabled={disabled}
        onChange={(v) => onChange({ ...value, neighborhood: v })}
      />

      {/* Cidade — linha cheia, UF como badge à direita */}
      <Field
        icon={<Building2 className="w-4 h-4" />}
        placeholder="Cidade"
        autoComplete="address-level2"
        maxLength={80}
        value={value.city}
        disabled={disabled}
        onChange={(v) => onChange({ ...value, city: v })}
        rightSlot={
          value.state ? (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              {value.state}
            </span>
          ) : null
        }
      />
    </div>
  );
};

export function buildAddressString(a: AddressValue): string {
  const line1 = [a.street, a.number].filter(Boolean).join(", ");
  const cityUF = [a.city, a.state].filter(Boolean).join("/");
  const parts = [line1, a.neighborhood, a.complement, cityUF, a.cep].filter(Boolean);
  return parts.join(" - ");
}

export default AddressFields;
