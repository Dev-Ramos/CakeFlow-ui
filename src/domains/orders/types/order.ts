/** Tipos de pedido: `*Payload` é o JSON da API (inglês, snake_case); o resto é como o front usa. */

export type FulfillmentType = "delivery" | "pickup";
export type DecorationKind = "plaque" | "topper_3d" | "titura" | "other";

export interface Address {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  reference: string;
}

// ── Valores (B.6) ────────────────────────────────────────────────────────────────────────

export interface PricingPayload {
  base_cents: number;
  fillings_cents: number;
  complexity_cents: number;
  reinforcement_cents: number;
  delivery_cents: number;
  subtotal_cents: number;
  total_cents: number;
  lines?: {
    base?: Array<{
      item: number;
      tier: number;
      pan_spec: string;
      layers_count: number;
      unit_cents: number;
      total_cents: number;
    }>;
    fillings?: Array<{ filling: string; extra_cents: number }>;
  };
}

export interface Pricing {
  baseCents: number;
  fillingsCents: number;
  complexityCents: number;
  reinforcementCents: number;
  deliveryCents: number;
  subtotalCents: number;
  totalCents: number;
  baseLines: Array<{
    item: number;
    tier: number;
    panSpec: string;
    layersCount: number;
    unitCents: number;
    totalCents: number;
  }>;
  fillingLines: Array<{ filling: string; extraCents: number }>;
}

// ── Leitura ──────────────────────────────────────────────────────────────────────────────

export interface OrderListItemPayload {
  id: number;
  code: string;
  customer_name: string;
  customer_phone: string;
  production_date: string;
  delivery_at: string;
  fulfillment_type: FulfillmentType;
  items_count: number;
  stage: string | null;
  status: string;
  late: boolean;
  /** Ausente sem `orders.view_prices`. */
  total_cents?: number;
}

export interface OrderListItem {
  id: number;
  code: string;
  customerName: string;
  customerPhone: string;
  productionDate: string;
  deliveryAt: string;
  fulfillmentType: FulfillmentType;
  itemsCount: number;
  stage: string | null;
  status: string;
  late: boolean;
  totalCents: number | null;
}

interface RefPayload {
  id: number;
  name: string;
}

export interface TierPayload {
  id: number;
  level: number;
  locked: boolean;
  layers_count: number;
  pan_spec: { id: number; name: string; dimensions_label: string };
  batter_type: RefPayload;
  fillings: RefPayload[];
  notes: string | null;
  layers: Array<{ id: number; layer_index: number; status: string }>;
}

export interface OrderItemPayload {
  id: number;
  position: number;
  status: string;
  cake_type: RefPayload | null;
  title: string;
  colors: string | null;
  dedication_text: string | null;
  reference_image_url: string | null;
  has_decoration: boolean;
  decoration_kinds: DecorationKind[];
  decoration_details: string | null;
  decoration_image_urls: string[];
  has_reinforcement: boolean;
  allergies_notes: string | null;
  notes: string | null;
  tiers: TierPayload[];
}

export interface OrderPayload extends Omit<OrderListItemPayload, "total_cents"> {
  address: Partial<Record<keyof Address, string | null>> | null;
  notes: string | null;
  original_order: { id: number; code: string } | null;
  created_by: RefPayload | null;
  lock_version: number;
  items: OrderItemPayload[];
  subtotal_cents?: number;
  delivery_fee_cents?: number;
  total_cents?: number;
  pricing?: PricingPayload;
  created_at: string;
  updated_at: string;
}

export interface Tier {
  id: number;
  level: number;
  locked: boolean;
  layersCount: number;
  panSpec: { id: number; name: string; dimensionsLabel: string };
  batterType: { id: number; name: string };
  fillings: Array<{ id: number; name: string }>;
  notes: string;
  layers: Array<{ id: number; layerIndex: number; status: string }>;
}

export interface OrderItem {
  id: number;
  position: number;
  status: string;
  cakeType: { id: number; name: string } | null;
  title: string;
  colors: string;
  dedicationText: string;
  referenceImageUrl: string | null;
  hasDecoration: boolean;
  decorationKinds: DecorationKind[];
  decorationDetails: string;
  decorationImageUrls: string[];
  hasReinforcement: boolean;
  allergiesNotes: string;
  notes: string;
  tiers: Tier[];
}

export interface Order {
  id: number;
  code: string;
  status: string;
  stage: string | null;
  customerName: string;
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  address: Address;
  productionDate: string;
  deliveryAt: string;
  late: boolean;
  notes: string;
  itemsCount: number;
  originalOrder: { id: number; code: string } | null;
  createdBy: { id: number; name: string } | null;
  lockVersion: number;
  items: OrderItem[];
  /** `null` quando o usuário não tem `orders.view_prices`. */
  pricing: Pricing | null;
  subtotalCents: number | null;
  deliveryFeeCents: number | null;
  totalCents: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Escrita ──────────────────────────────────────────────────────────────────────────────

export interface TierInput {
  panSpecId: number;
  batterTypeId: number;
  layersCount: number;
  fillingIds: number[];
  notes: string;
}

export interface OrderItemInput {
  /** Presente ao editar um bolo existente; ausente = bolo novo. */
  id?: number;
  cakeTypeId: number | null;
  title: string;
  colors: string;
  dedicationText: string;
  /** `signed_id` de `POST /uploads`; `undefined` mantém a imagem atual. */
  referenceImageSignedId?: string;
  removeReferenceImage?: boolean;
  hasDecoration: boolean;
  decorationKinds: DecorationKind[];
  decorationDetails: string;
  decorationImageSignedIds: string[];
  hasReinforcement: boolean;
  allergiesNotes: string;
  notes: string;
  tiers: TierInput[];
}

export interface OrderInput {
  customerName: string;
  /** Só dígitos. */
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  address: Address;
  /** `AAAA-MM-DD`. */
  productionDate: string;
  /** ISO 8601 com fuso. */
  deliveryAt: string;
  notes: string;
  items: OrderItemInput[];
}

/** Só o que o cálculo lê (`price_preview`). */
export interface PricePreviewInput {
  fulfillmentType: FulfillmentType;
  items: Array<{
    hasReinforcement: boolean;
    tiers: Array<{
      panSpecId: number;
      layersCount: number;
      fillingIds: number[];
    }>;
  }>;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  fulfillmentType?: FulfillmentType;
  late?: boolean;
  productionDateFrom?: string;
  productionDateTo?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
}

// ── Linha do tempo e cancelamento ────────────────────────────────────────────────────────

export interface OrderEventPayload {
  id: number;
  kind: string;
  user: RefPayload | null;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

export interface OrderEvent {
  id: number;
  kind: string;
  userName: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  note: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export type CancellationStatus = "pending" | "approved" | "denied";

export interface CancellationRequestPayload {
  id: number;
  order: {
    id: number;
    code: string;
    customer_name: string;
    delivery_at: string;
  };
  description: string;
  status: CancellationStatus;
  created_by: RefPayload | null;
  updated_by: RefPayload | null;
  has_filled_items: boolean;
  items: Array<{ id: number; title: string; status: string; outcome: string }>;
  created_at: string;
  updated_at: string;
}

export interface CancellationRequest {
  id: number;
  order: { id: number; code: string; customerName: string; deliveryAt: string };
  description: string;
  status: CancellationStatus;
  createdByName: string | null;
  updatedByName: string | null;
  hasFilledItems: boolean;
  items: Array<{ id: number; title: string; status: string; outcome: string }>;
  createdAt: string;
}
