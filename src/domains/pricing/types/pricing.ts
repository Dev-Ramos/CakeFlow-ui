/** Linhas de `/pricing/pan_specs` e `/pricing/fillings`. `null` em valor = ainda sem preço. */
export interface PriceRowPayload {
  id: number;
  name: string;
  active: boolean;
  dimensions_label?: string;
  price_cents?: number | null;
  extra_price_cents?: number | null;
  updated_by: { id: number; name: string } | null;
  updated_at: string | null;
}

/** Preço de uma forma (valor da camada) ou de um recheio (acréscimo), no mesmo formato de linha. */
export interface PriceRow {
  id: number;
  name: string;
  /** Só formas: "20 cm de diâmetro". */
  detail: string;
  active: boolean;
  priceCents: number | null;
  updatedByName: string | null;
  updatedAt: string | null;
}

export interface PriceListParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  priced?: boolean;
}

/** `/pricing/settings`: `null` = ainda não configurado. */
export interface PricingSettings {
  tierComplexityCents: number | null;
  reinforcementCents: number | null;
  deliveryFeeCents: number | null;
}
