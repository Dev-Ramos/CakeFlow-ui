import type { LinhaDeValor } from "@/ui/components/ResumoDeValores";
import type { Pricing } from "../types/order";

/** Passo a passo do cálculo (B.6) na ordem em que a atendente o lê. */
export function linhasDoPricing(pricing: Pricing): LinhaDeValor[] {
  return [
    { rotulo: "Base (formas × camadas)", centavos: pricing.baseCents },
    { rotulo: "Recheios", centavos: pricing.fillingsCents },
    {
      rotulo: "Complexidade (mais de um andar)",
      centavos: pricing.complexityCents,
    },
    { rotulo: "Blindagem", centavos: pricing.reinforcementCents },
    { rotulo: "Subtotal", centavos: pricing.subtotalCents, destaque: true },
    { rotulo: "Entrega", centavos: pricing.deliveryCents },
    { rotulo: "Total", centavos: pricing.totalCents, destaque: true },
  ];
}
