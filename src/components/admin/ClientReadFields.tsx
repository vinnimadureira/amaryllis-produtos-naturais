import { Cake, Mail, MapPin, Phone, StickyNote } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ClientReadData {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  birthday?: string | null; // ISO YYYY-MM-DD
  notes?: string | null;
  address?: {
    street?: string | null;
    number?: string | null;
    neighborhood?: string | null;
    complement?: string | null;
    city?: string | null;
    state?: string | null;
    cep?: string | null;
  } | null;
}

interface Props {
  data: ClientReadData;
  showName?: boolean;
  showNotes?: boolean;
  /** Sempre renderiza a grade estruturada do endereço, mesmo vazia. */
  alwaysShowAddressFields?: boolean;
}

const formatBirthday = (iso?: string | null): string | null => {
  if (!iso) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
  }
  return iso;
};

const formatCep = (cep?: string | null): string | null => {
  if (!cep) return null;
  const digits = cep.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return cep;
};

export const ReadField = ({
  label,
  icon,
  value,
  className,
  mono,
}: {
  label: React.ReactNode;
  icon?: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  mono?: boolean;
}) => {
  const isEmpty = value === null || value === undefined || value === "" || value === "—";
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </Label>
      <div
        className={cn(
          "min-h-10 w-full rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground break-words",
          mono && "font-mono tabular-nums",
        )}
      >
        {isEmpty ? <span className="text-muted-foreground italic">—</span> : value}
      </div>
    </div>
  );
};

const ClientReadFields = ({ data, showName = false, showNotes = false, alwaysShowAddressFields = false }: Props) => {
  const birthdayFmt = formatBirthday(data.birthday);
  const addr = data.address || {};
  const hasAddress = !!(addr.street || addr.number || addr.neighborhood || addr.city || addr.state || addr.cep);

  return (
    <div className="space-y-3">
      {showName && <ReadField label="Nome" value={data.name} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ReadField
          label="WhatsApp / Telefone"
          icon={<Phone className="w-3.5 h-3.5" />}
          value={data.phone}
        />
        <ReadField
          label="Aniversário"
          icon={<Cake className="w-3.5 h-3.5 text-pink-500" />}
          value={birthdayFmt}
        />
      </div>

      <ReadField
        label="E-mail"
        icon={<Mail className="w-3.5 h-3.5" />}
        value={data.email ? <span className="break-all">{data.email}</span> : null}
      />

      <div className="pt-1">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
          <MapPin className="w-3.5 h-3.5" /> Endereço de entrega
        </Label>
        {!hasAddress && !alwaysShowAddressFields ? (
          <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground italic">
            Endereço não informado.
          </div>
        ) : (
          <div className="rounded-md border border-border/60 bg-muted/40 p-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
              <ReadField label="Logradouro" value={addr.street} className="space-y-1" />
              <ReadField label="Número" value={addr.number} mono className="space-y-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ReadField label="Bairro" value={addr.neighborhood} className="space-y-1" />
              <ReadField label="Complemento" value={addr.complement} className="space-y-1" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-[1fr_80px_140px] gap-3">
              <ReadField label="Cidade" value={addr.city} className="space-y-1" />
              <ReadField label="UF" value={addr.state} mono className="space-y-1" />
              <ReadField label="CEP" value={formatCep(addr.cep)} mono className="space-y-1" />
            </div>
          </div>
        )}
      </div>

      {showNotes && (
        <ReadField
          label="Observações"
          icon={<StickyNote className="w-3.5 h-3.5" />}
          value={data.notes ? <span className="whitespace-pre-wrap">{data.notes}</span> : null}
        />
      )}
    </div>
  );
};

export default ClientReadFields;
