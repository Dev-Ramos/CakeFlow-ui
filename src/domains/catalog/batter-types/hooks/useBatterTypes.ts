import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CATALOG_KEY } from "../../shared/hooks/catalogKey";
import type { ListParams } from "../../shared/types/catalog";
import { batterTypesApi } from "../api/batterTypesApi";
import type { BatterTypeInput } from "../types/batterType";

const KEY = [...CATALOG_KEY, "batter_types"] as const;

/** Lista paginada de massas (`{ data, meta }`), com busca e situação feitas no servidor. */
export function useBatterTypes(params?: ListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params ?? {}],
    queryFn: () => batterTypesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Options de massa para selects. Passe o termo JÁ com debounce (`useDebounce`). */
export function useBatterTypeOptions(search = "") {
  return useQuery({
    queryKey: [...KEY, "options", search],
    queryFn: () => batterTypesApi.options(search),
    placeholderData: keepPreviousData,
  });
}

export function useCreateBatterType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BatterTypeInput) => batterTypesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useUpdateBatterType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: BatterTypeInput }) =>
      batterTypesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useDeleteBatterType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => batterTypesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}
