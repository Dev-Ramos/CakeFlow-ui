import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CATALOG_KEY } from "../../shared/hooks/catalogKey";
import type { ListParams } from "../../shared/types/catalog";
import { panSpecsApi } from "../api/panSpecsApi";
import type { PanSpecInput } from "../types/panSpec";

const KEY = [...CATALOG_KEY, "pan_specs"] as const;

/** Lista paginada de formas (`{ data, meta }`), com busca e situação feitas no servidor. */
export function usePanSpecs(params?: ListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params ?? {}],
    queryFn: () => panSpecsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Options de forma para selects. Passe o termo JÁ com debounce (`useDebounce`). */
export function usePanSpecOptions(search = "") {
  return useQuery({
    queryKey: [...KEY, "options", search],
    queryFn: () => panSpecsApi.options(search),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePanSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PanSpecInput) => panSpecsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useUpdatePanSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PanSpecInput }) => panSpecsApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useDeletePanSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => panSpecsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}
