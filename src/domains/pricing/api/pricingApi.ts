import { api } from "@/services/http/api";
import { mapPaginated, type Paginated } from "@/services/http/pagination";
import type { PriceListParams, PriceRow, PriceRowPayload, PricingSettings } from "../types/pricing";

/** Forma e recheio têm o mesmo molde; só muda o campo do valor e o corpo do PUT. */
function paraLinha(p: PriceRowPayload): PriceRow {
  return {
    id: p.id,
    name: p.name,
    detail: p.dimensions_label ?? "",
    active: p.active,
    priceCents: p.price_cents ?? p.extra_price_cents ?? null,
    updatedByName: p.updated_by?.name ?? null,
    updatedAt: p.updated_at,
  };
}

async function listar(caminho: string, params: PriceListParams): Promise<Paginated<PriceRow>> {
  const { data } = await api.get<Paginated<PriceRowPayload>>(caminho, {
    params,
  });
  return mapPaginated(data, paraLinha);
}

export const pricingApi = {
  // Valor da camada por forma — `PUT /pricing/pan_specs/:id` com `{ price: { price_cents } }`.
  listPanSpecs: (params: PriceListParams = {}) => listar("/pricing/pan_specs", params),
  setPanSpecPrice: async (id: number, cents: number): Promise<void> => {
    await api.put(`/pricing/pan_specs/${id}`, {
      price: { price_cents: cents },
    });
  },
  removePanSpecPrice: async (id: number): Promise<void> => {
    await api.delete(`/pricing/pan_specs/${id}`);
  },

  // Acréscimo por recheio — `{ price: { extra_price_cents } }`.
  listFillings: (params: PriceListParams = {}) => listar("/pricing/fillings", params),
  setFillingPrice: async (id: number, cents: number): Promise<void> => {
    await api.put(`/pricing/fillings/${id}`, {
      price: { extra_price_cents: cents },
    });
  },
  removeFillingPrice: async (id: number): Promise<void> => {
    await api.delete(`/pricing/fillings/${id}`);
  },

  getSettings: async (): Promise<PricingSettings> => {
    const { data } = await api.get<{
      tier_complexity_cents: number | null;
      reinforcement_cents: number | null;
      delivery_fee_cents: number | null;
    }>("/pricing/settings");
    return {
      tierComplexityCents: data.tier_complexity_cents,
      reinforcementCents: data.reinforcement_cents,
      deliveryFeeCents: data.delivery_fee_cents,
    };
  },

  /** `PATCH` com qualquer subconjunto das chaves, na raiz do corpo. */
  updateSettings: async (parcial: Partial<PricingSettings>): Promise<void> => {
    await api.patch("/pricing/settings", {
      tier_complexity_cents: parcial.tierComplexityCents,
      reinforcement_cents: parcial.reinforcementCents,
      delivery_fee_cents: parcial.deliveryFeeCents,
    });
  },
};
