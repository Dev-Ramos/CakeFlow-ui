import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buscarOpcoes } from "@/domains/catalog/shared/api/opcoes";
import { cancellationRequestsApi } from "../api/cancellationRequestsApi";
import { ordersApi } from "../api/ordersApi";
import type { CancellationStatus, OrderInput, OrderListParams, PricePreviewInput } from "../types/order";

export const ORDERS_KEY = ["orders"] as const;

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "list", params],
    queryFn: () => ordersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "detail", id ?? 0],
    queryFn: () => ordersApi.get(id as number),
    enabled: id !== undefined,
  });
}

export function useOrderEvents(id: number, enabled = true) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "events", id],
    queryFn: () => ordersApi.events(id),
    enabled,
  });
}

/** Tipos de bolo ativos para o select do pedido (busca no servidor). */
export function useCakeTypeOptions(search = "") {
  return useQuery({
    queryKey: ["catalog", "cake_types", "options", search],
    queryFn: () => buscarOpcoes("/cake_types", search),
    placeholderData: keepPreviousData,
  });
}

/**
 * Valores ao vivo: só roda quando `ativo` (há dados suficientes) e guarda o último resultado
 * enquanto o próximo carrega. `input` entra na chave, então mudar um campo refaz a conta.
 */
export function usePricePreview(input: PricePreviewInput, ativo: boolean) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "price_preview", input],
    queryFn: () => ordersApi.previewPrice(input),
    enabled: ativo,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderInput) => ordersApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, lockVersion }: { id: number; input: OrderInput; lockVersion: number }) =>
      ordersApi.update(id, input, lockVersion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useRequestCancel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: number; description: string }) =>
      ordersApi.requestCancel(id, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: number; description: string }) =>
      ordersApi.cancel(id, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useCancellationRequests(params: {
  page?: number;
  limit?: number;
  status?: CancellationStatus;
}) {
  return useQuery({
    queryKey: [...ORDERS_KEY, "cancellation_requests", params],
    queryFn: () => cancellationRequestsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useApproveCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancellationRequestsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useDenyCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancellationRequestsApi.deny(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}
