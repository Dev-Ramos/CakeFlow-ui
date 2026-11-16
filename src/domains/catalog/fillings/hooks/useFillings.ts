import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CATALOG_KEY } from "../../shared/hooks/catalogKey";
import type { ListParams } from "../../shared/types/catalog";
import { fillingsApi } from "../api/fillingsApi";
import type { FillingInput } from "../types/filling";

const KEY = [...CATALOG_KEY, "fillings"] as const;

/** Lista paginada de recheios (`{ data, meta }`), com busca e situação feitas no servidor. */
export function useFillings(params?: ListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params ?? {}],
    queryFn: () => fillingsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Options de recheio para selects. Passe o termo JÁ com debounce (`useDebounce`). */
export function useFillingOptions(search = "") {
  return useQuery({
    queryKey: [...KEY, "options", search],
    queryFn: () => fillingsApi.options(search),
    placeholderData: keepPreviousData,
  });
}

export function useCreateFilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FillingInput) => fillingsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useUpdateFilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: FillingInput }) => fillingsApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useDeleteFilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fillingsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}
