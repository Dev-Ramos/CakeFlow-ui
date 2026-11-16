import { api } from "@/services/http/api";
import { mapPaginated, type Paginated } from "@/services/http/pagination";
import type {
  Address,
  Order,
  OrderEvent,
  OrderEventPayload,
  OrderInput,
  OrderItemInput,
  OrderListItem,
  OrderListItemPayload,
  OrderListParams,
  OrderPayload,
  Pricing,
  PricingPayload,
  PricePreviewInput,
} from "../types/order";

const CAMINHO = "/orders";

const ENDERECO_VAZIO: Address = {
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  reference: "",
};

export function paraPricing(p: PricingPayload): Pricing {
  return {
    baseCents: p.base_cents,
    fillingsCents: p.fillings_cents,
    complexityCents: p.complexity_cents,
    reinforcementCents: p.reinforcement_cents,
    deliveryCents: p.delivery_cents,
    subtotalCents: p.subtotal_cents,
    totalCents: p.total_cents,
    baseLines: (p.lines?.base ?? []).map((l) => ({
      item: l.item,
      tier: l.tier,
      panSpec: l.pan_spec,
      layersCount: l.layers_count,
      unitCents: l.unit_cents,
      totalCents: l.total_cents,
    })),
    fillingLines: (p.lines?.fillings ?? []).map((l) => ({
      filling: l.filling,
      extraCents: l.extra_cents,
    })),
  };
}

function paraItemDaLista(p: OrderListItemPayload): OrderListItem {
  return {
    id: p.id,
    code: p.code,
    customerName: p.customer_name,
    customerPhone: p.customer_phone,
    productionDate: p.production_date,
    deliveryAt: p.delivery_at,
    fulfillmentType: p.fulfillment_type,
    itemsCount: p.items_count,
    stage: p.stage,
    status: p.status,
    late: p.late,
    totalCents: p.total_cents ?? null,
  };
}

function paraPedido(p: OrderPayload): Order {
  return {
    id: p.id,
    code: p.code,
    status: p.status,
    stage: p.stage,
    customerName: p.customer_name,
    customerPhone: p.customer_phone,
    fulfillmentType: p.fulfillment_type,
    address: {
      street: p.address?.street ?? "",
      number: p.address?.number ?? "",
      complement: p.address?.complement ?? "",
      neighborhood: p.address?.neighborhood ?? "",
      city: p.address?.city ?? "",
      reference: p.address?.reference ?? "",
    },
    productionDate: p.production_date,
    deliveryAt: p.delivery_at,
    late: p.late,
    notes: p.notes ?? "",
    itemsCount: p.items_count,
    originalOrder: p.original_order,
    createdBy: p.created_by,
    lockVersion: p.lock_version,
    items: p.items.map((i) => ({
      id: i.id,
      position: i.position,
      status: i.status,
      cakeType: i.cake_type,
      title: i.title,
      colors: i.colors ?? "",
      dedicationText: i.dedication_text ?? "",
      referenceImageUrl: i.reference_image_url,
      hasDecoration: i.has_decoration,
      decorationKinds: i.decoration_kinds ?? [],
      decorationDetails: i.decoration_details ?? "",
      decorationImageUrls: i.decoration_image_urls ?? [],
      hasReinforcement: i.has_reinforcement,
      allergiesNotes: i.allergies_notes ?? "",
      notes: i.notes ?? "",
      tiers: i.tiers.map((t) => ({
        id: t.id,
        level: t.level,
        locked: t.locked,
        layersCount: t.layers_count,
        panSpec: {
          id: t.pan_spec.id,
          name: t.pan_spec.name,
          dimensionsLabel: t.pan_spec.dimensions_label,
        },
        batterType: t.batter_type,
        fillings: t.fillings,
        notes: t.notes ?? "",
        layers: t.layers.map((l) => ({
          id: l.id,
          layerIndex: l.layer_index,
          status: l.status,
        })),
      })),
    })),
    pricing: p.pricing ? paraPricing(p.pricing) : null,
    subtotalCents: p.subtotal_cents ?? null,
    deliveryFeeCents: p.delivery_fee_cents ?? null,
    totalCents: p.total_cents ?? null,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

function paraItemDoCorpo(i: OrderItemInput) {
  return {
    id: i.id,
    cake_type_id: i.cakeTypeId,
    title: i.title,
    colors: i.colors,
    dedication_text: i.dedicationText,
    reference_image_signed_id: i.referenceImageSignedId,
    remove_reference_image: i.removeReferenceImage || undefined,
    has_decoration: i.hasDecoration,
    decoration_kinds: i.hasDecoration ? i.decorationKinds : [],
    decoration_details: i.decorationDetails,
    // Sem chave = mantém as imagens que já estão no bolo.
    decoration_image_signed_ids:
      i.decorationImageSignedIds.length > 0 ? i.decorationImageSignedIds : undefined,
    has_reinforcement: i.hasReinforcement,
    allergies_notes: i.allergiesNotes,
    notes: i.notes,
    tiers: i.tiers.map((t) => ({
      pan_spec_id: t.panSpecId,
      batter_type_id: t.batterTypeId,
      layers_count: t.layersCount,
      filling_ids: t.fillingIds,
      notes: t.notes,
    })),
  };
}

/** Corpo esperado pela API: `{ order: {...} }`. Retirada não leva endereço. */
function paraCorpo(i: OrderInput, lockVersion?: number) {
  const entrega = i.fulfillmentType === "delivery";
  return {
    order: {
      lock_version: lockVersion,
      customer_name: i.customerName,
      customer_phone: i.customerPhone,
      fulfillment_type: i.fulfillmentType,
      address: entrega ? i.address : ENDERECO_VAZIO,
      production_date: i.productionDate,
      delivery_at: i.deliveryAt,
      notes: i.notes,
      items: i.items.map(paraItemDoCorpo),
    },
  };
}

function paraParametros(p: OrderListParams) {
  return {
    page: p.page,
    limit: p.limit,
    search: p.search,
    status: p.status,
    fulfillment_type: p.fulfillmentType,
    late: p.late,
    production_date_from: p.productionDateFrom,
    production_date_to: p.productionDateTo,
    delivery_date_from: p.deliveryDateFrom,
    delivery_date_to: p.deliveryDateTo,
  };
}

export const ordersApi = {
  list: async (params: OrderListParams = {}): Promise<Paginated<OrderListItem>> => {
    const { data } = await api.get<Paginated<OrderListItemPayload>>(CAMINHO, {
      params: paraParametros(params),
      // `status[]=a&status[]=b`, como o Rails espera.
      paramsSerializer: { indexes: null },
    });
    return mapPaginated(data, paraItemDaLista);
  },

  get: async (id: number): Promise<Order> => {
    const { data } = await api.get<OrderPayload>(`${CAMINHO}/${id}`);
    return paraPedido(data);
  },

  create: async (input: OrderInput): Promise<Order> => {
    const { data } = await api.post<OrderPayload>(CAMINHO, paraCorpo(input));
    return paraPedido(data);
  },

  update: async (id: number, input: OrderInput, lockVersion: number): Promise<Order> => {
    const { data } = await api.patch<OrderPayload>(`${CAMINHO}/${id}`, paraCorpo(input, lockVersion));
    return paraPedido(data);
  },

  /** Simula os valores sem gravar nada (403 sem `orders.view_prices`). */
  previewPrice: async (input: PricePreviewInput): Promise<Pricing> => {
    const { data } = await api.post<PricingPayload>(`${CAMINHO}/price_preview`, {
      order: {
        fulfillment_type: input.fulfillmentType,
        items: input.items.map((item) => ({
          has_reinforcement: item.hasReinforcement,
          tiers: item.tiers.map((t) => ({
            pan_spec_id: t.panSpecId,
            layers_count: t.layersCount,
            filling_ids: t.fillingIds,
          })),
        })),
      },
    });
    return paraPricing(data);
  },

  events: async (id: number): Promise<OrderEvent[]> => {
    const { data } = await api.get<{ data: OrderEventPayload[] }>(`${CAMINHO}/${id}/events`);
    return data.data.map((e) => ({
      id: e.id,
      kind: e.kind,
      userName: e.user?.name ?? null,
      fromStatus: e.from_status,
      toStatus: e.to_status,
      note: e.note ?? "",
      data: e.data ?? {},
      createdAt: e.created_at,
    }));
  },

  /** Atendente: pede o cancelamento (o admin decide). */
  requestCancel: async (id: number, description: string): Promise<void> => {
    await api.post(`${CAMINHO}/${id}/cancellation_requests`, {
      cancellation_request: { description },
    });
  },

  /** Super Admin: cancela direto (descrição obrigatória). */
  cancel: async (id: number, description: string): Promise<void> => {
    await api.post(`${CAMINHO}/${id}/cancel`, {
      cancellation_request: { description },
    });
  },
};
