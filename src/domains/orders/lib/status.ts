import type { OrderItem } from "../types/order";

type Tom = "neutral" | "primary" | "success" | "info" | "warning" | "danger";

/** Nome e cor de cada status (pedido, bolo ou etapa). Status desconhecido aparece como veio. */
const STATUS: Record<string, { rotulo: string; tom: Tom }> = {
  booked: { rotulo: "Confirmado", tom: "info" },
  in_production: { rotulo: "Em produção", tom: "warning" },
  waiting_delivery: { rotulo: "Aguardando entrega", tom: "primary" },
  waiting_pickup: { rotulo: "Aguardando retirada", tom: "primary" },
  completed: { rotulo: "Concluído", tom: "success" },
  cancelation_in_progress: {
    rotulo: "Cancelamento em análise",
    tom: "warning",
  },
  canceled: { rotulo: "Cancelado", tom: "danger" },
  waiting_bake: { rotulo: "Aguardando forno", tom: "neutral" },
  baking: { rotulo: "Assando", tom: "warning" },
  baked: { rotulo: "Assado", tom: "info" },
  waiting_fillment: { rotulo: "Aguardando recheio", tom: "neutral" },
  filled: { rotulo: "Recheado", tom: "info" },
  waiting_decoration: { rotulo: "Aguardando decoração", tom: "neutral" },
  decorating: { rotulo: "Decorando", tom: "warning" },
  decorated: { rotulo: "Decorado", tom: "success" },
};

export function statusInfo(status: string | null): {
  rotulo: string;
  tom: Tom;
} {
  if (status === null) return { rotulo: "—", tom: "neutral" };
  return STATUS[status] ?? { rotulo: status, tom: "neutral" };
}

/** Pedidos nesses status não aceitam edição (B.7). */
export const STATUS_NAO_EDITAVEIS = ["cancelation_in_progress", "canceled", "completed"];

/** Pedido que ainda aceita cancelamento ou pedido de cancelamento. */
export const podeCancelar = (status: string) =>
  !["canceled", "completed", "cancelation_in_progress"].includes(status);

/** Travas de um bolo já salvo (B.7); sem bolo (novo) nada está travado. */
export interface Bloqueios {
  /** Formas, massas, camadas, andares: depois que alguma camada entrou no forno. */
  estrutura: boolean;
  /** Recheios: depois que o bolo foi recheado. */
  recheios: boolean;
  /** Modelo, cores, dedicatória e decoração: a partir de `decorating`. */
  decoracao: boolean;
}

export function bloqueiosDoBolo(bolo?: OrderItem): Bloqueios {
  if (!bolo) return { estrutura: false, recheios: false, decoracao: false };
  const estrutura = bolo.tiers.some((andar) =>
    andar.layers.some((camada) => camada.status !== "waiting_bake"),
  );
  return {
    estrutura,
    recheios: estrutura && bolo.status !== "waiting_fillment",
    decoracao: ["decorating", "decorated"].includes(bolo.status),
  };
}

/** Status do pedido para o filtro da lista (a ordem do ciclo de vida). */
export const STATUS_DO_PEDIDO = [
  "booked",
  "in_production",
  "waiting_delivery",
  "waiting_pickup",
  "completed",
  "cancelation_in_progress",
  "canceled",
];
