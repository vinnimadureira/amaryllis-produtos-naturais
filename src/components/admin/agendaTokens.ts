/**
 * Tokens centralizados de Tipo e Status da Agenda.
 *
 * REGRA: Toda exibição de tipo/status no admin (Agenda, Dashboard, widgets)
 * DEVE consumir estes tokens. Não duplicar labels/cores.
 *
 * Para alterar a cor de um tipo/status, edite APENAS este arquivo.
 *
 * Paleta: cada matiz é separado por ≥40° no círculo cromático para evitar
 * colisão visual entre tipos e status.
 *
 *   TIPOS
 *   entrega     = fuchsia  (292°)
 *   lembrete    = amber    ( 38°)
 *   producao    = indigo   (243°)
 *
 *   STATUS
 *   pendente    = muted-foreground
 *   confirmado  = sky      (199°)
 *   em_producao = teal     (173°)   ← exibido como "Em andamento"
 *   pronto      = lime     ( 84°)   ← exibido como "Finalizado"
 *   entregue    = green    (142°)
 *   cancelado   = destructive (0°)
 *
 * NOTE: as chaves `em_producao` e `pronto` são preservadas pois estão
 * persistidas no banco. Apenas os labels foram renomeados para evitar
 * confusão verbal com o tipo "Produção".
 */
import { Truck, Bell, Hammer, type LucideIcon } from "lucide-react";

export type Tipo = "entrega" | "lembrete" | "producao";
export type Status =
  | "pendente"
  | "confirmado"
  | "em_producao"
  | "pronto"
  | "entregue"
  | "cancelado";

export interface TipoToken {
  value: Tipo;
  label: string;
  icon: LucideIcon;
  pillClass: string;
  dotClass: string;
  hsl: string;
}

export interface StatusToken {
  value: Status;
  label: string;
  pillClass: string;
  ringClass: string;
  buttonOutlineClass: string;
  hsl: string;
}

export const TIPO_TOKENS: Record<Tipo, TipoToken> = {
  entrega: {
    value: "entrega",
    label: "Entrega",
    icon: Truck,
    pillClass: "bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30",
    dotClass: "bg-fuchsia-500",
    hsl: "hsl(292 84% 55%)",
  },
  lembrete: {
    value: "lembrete",
    label: "Lembrete",
    icon: Bell,
    pillClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    dotClass: "bg-amber-500",
    hsl: "hsl(38 92% 50%)",
  },
  producao: {
    value: "producao",
    label: "Produção",
    icon: Hammer,
    pillClass: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
    dotClass: "bg-indigo-500",
    hsl: "hsl(243 75% 59%)",
  },
};

export const STATUS_TOKENS: Record<Status, StatusToken> = {
  pendente: {
    value: "pendente",
    label: "Pendente",
    pillClass: "bg-muted text-muted-foreground border-border",
    ringClass: "ring-muted-foreground/40",
    buttonOutlineClass:
      "border-muted-foreground/40 text-muted-foreground hover:bg-muted/50",
    hsl: "hsl(var(--muted-foreground))",
  },
  confirmado: {
    value: "confirmado",
    label: "Confirmado",
    pillClass: "bg-sky-500/15 text-sky-600 border-sky-500/30",
    ringClass: "ring-sky-500",
    buttonOutlineClass:
      "border-sky-500/40 text-sky-600 hover:bg-sky-500/10 hover:text-sky-700",
    hsl: "hsl(199 89% 48%)",
  },
  em_producao: {
    value: "em_producao",
    label: "Em andamento",
    pillClass: "bg-teal-500/15 text-teal-600 border-teal-500/30",
    ringClass: "ring-teal-500",
    buttonOutlineClass:
      "border-teal-500/40 text-teal-600 hover:bg-teal-500/10 hover:text-teal-700",
    hsl: "hsl(173 80% 40%)",
  },
  pronto: {
    value: "pronto",
    label: "Finalizado",
    pillClass: "bg-lime-500/15 text-lime-700 border-lime-500/30",
    ringClass: "ring-lime-500",
    buttonOutlineClass:
      "border-lime-500/40 text-lime-700 hover:bg-lime-500/10",
    hsl: "hsl(84 81% 44%)",
  },
  entregue: {
    value: "entregue",
    label: "Entregue",
    pillClass: "bg-green-600/15 text-green-700 border-green-600/30",
    ringClass: "ring-green-600",
    buttonOutlineClass:
      "border-green-600/40 text-green-700 hover:bg-green-600/10",
    hsl: "hsl(142 71% 45%)",
  },
  cancelado: {
    value: "cancelado",
    label: "Cancelado",
    pillClass: "bg-destructive/15 text-destructive border-destructive/30",
    ringClass: "ring-destructive",
    buttonOutlineClass:
      "border-destructive/40 text-destructive hover:bg-destructive/10",
    hsl: "hsl(var(--destructive))",
  },
};

export const getTipoToken = (tipo: string | null | undefined): TipoToken =>
  TIPO_TOKENS[(tipo as Tipo) ?? "entrega"] ?? TIPO_TOKENS.entrega;

export const getStatusToken = (status: string | null | undefined): StatusToken =>
  STATUS_TOKENS[(status as Status) ?? "pendente"] ?? STATUS_TOKENS.pendente;

export const TIPO_LIST: Tipo[] = ["entrega", "lembrete", "producao"];
export const STATUS_LIST: Status[] = [
  "pendente",
  "confirmado",
  "em_producao",
  "pronto",
  "entregue",
  "cancelado",
];

/**
 * Validador dev-only para garantir que cores não foram duplicadas inconsistentemente
 * em outros consumidores. Loga warning no console se algum lugar tentar usar uma
 * cor diferente para o mesmo (tipo, status).
 */
const seenColors = new Map<string, string>();

export const registerAgendaColorUsage = (
  context: string,
  key: string,
  hsl: string,
) => {
  if (import.meta.env.PROD) return;
  const existing = seenColors.get(key);
  if (existing && existing !== hsl) {
    // eslint-disable-next-line no-console
    console.warn(
      `[agendaTokens] Cor inconsistente em "${context}" para "${key}": ` +
        `recebido ${hsl}, esperado ${existing}. ` +
        `Use STATUS_TOKENS / TIPO_TOKENS de agendaTokens.ts.`,
    );
  } else if (!existing) {
    seenColors.set(key, hsl);
  }
};

export const assertAgendaTokensConsistent = () => {
  if (import.meta.env.PROD) return;
  TIPO_LIST.forEach((t) =>
    registerAgendaColorUsage("init", `tipo:${t}`, TIPO_TOKENS[t].hsl),
  );
  STATUS_LIST.forEach((s) =>
    registerAgendaColorUsage("init", `status:${s}`, STATUS_TOKENS[s].hsl),
  );
};
