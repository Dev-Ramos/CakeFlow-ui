import { centavosParaTexto } from "@/ui/lib/dinheiro";
import type { PricingSettings } from "../types/pricing";

/** Os três valores globais, em texto (reais) enquanto o usuário digita. */
export interface ValoresGlobaisTexto {
  tierComplexity: string;
  reinforcement: string;
  deliveryFee: string;
}

export function textoDosValores(s: PricingSettings): ValoresGlobaisTexto {
  return {
    tierComplexity: centavosParaTexto(s.tierComplexityCents),
    reinforcement: centavosParaTexto(s.reinforcementCents),
    deliveryFee: centavosParaTexto(s.deliveryFeeCents),
  };
}
