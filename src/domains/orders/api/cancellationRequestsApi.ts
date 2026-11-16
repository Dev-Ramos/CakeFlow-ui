import { api } from "@/services/http/api";
import { mapPaginated, type Paginated } from "@/services/http/pagination";
import type { CancellationRequest, CancellationRequestPayload, CancellationStatus } from "../types/order";

const CAMINHO = "/cancellation_requests";

function paraModelo(p: CancellationRequestPayload): CancellationRequest {
  return {
    id: p.id,
    order: {
      id: p.order.id,
      code: p.order.code,
      customerName: p.order.customer_name,
      deliveryAt: p.order.delivery_at,
    },
    description: p.description,
    status: p.status,
    createdByName: p.created_by?.name ?? null,
    updatedByName: p.updated_by?.name ?? null,
    hasFilledItems: p.has_filled_items,
    items: p.items,
    createdAt: p.created_at,
  };
}

export const cancellationRequestsApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    status?: CancellationStatus;
  }): Promise<Paginated<CancellationRequest>> => {
    const { data } = await api.get<Paginated<CancellationRequestPayload>>(CAMINHO, { params });
    return mapPaginated(data, paraModelo);
  },

  approve: async (id: number): Promise<void> => {
    await api.post(`${CAMINHO}/${id}/approve`);
  },

  deny: async (id: number): Promise<void> => {
    await api.post(`${CAMINHO}/${id}/deny`);
  },
};
