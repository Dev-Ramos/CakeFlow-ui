import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CATALOG_KEY } from "../../shared/hooks/catalogKey";
import { cakeTypesApi } from "../api/cakeTypesApi";
import type { CakeTypeInput, CakeTypeListParams } from "../types/cakeType";

const KEY = [...CATALOG_KEY, "cake_types"] as const;

/** Lista paginada de tipos de bolo (`{ data, meta }`), com busca e filtros no servidor. */
export function useCakeTypes(params?: CakeTypeListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params ?? {}],
    queryFn: () => cakeTypesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCakeType(id: number | undefined) {
  return useQuery({
    queryKey: [...KEY, "detail", id ?? 0],
    queryFn: () => cakeTypesApi.get(id as number),
    enabled: id !== undefined,
  });
}

export function useCreateCakeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CakeTypeInput) => cakeTypesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useUpdateCakeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CakeTypeInput }) => cakeTypesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useDeleteCakeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cakeTypesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}
