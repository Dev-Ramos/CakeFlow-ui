import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CATALOG_KEY } from "../../shared/hooks/catalogKey";
import { technicalSheetsApi } from "../api/technicalSheetsApi";
import type { TechnicalSheetInput, TechnicalSheetListParams } from "../types/technicalSheet";

const KEY = [...CATALOG_KEY, "technical_sheets"] as const;

/** Lista paginada de fichas (`{ data, meta }`), filtrável por forma e por massa. */
export function useTechnicalSheets(params?: TechnicalSheetListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params ?? {}],
    queryFn: () => technicalSheetsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useTechnicalSheet(id: number | undefined) {
  return useQuery({
    queryKey: [...KEY, "detail", id ?? 0],
    queryFn: () => technicalSheetsApi.get(id as number),
    enabled: id !== undefined,
  });
}

export function useCreateTechnicalSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TechnicalSheetInput) => technicalSheetsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useUpdateTechnicalSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TechnicalSheetInput }) =>
      technicalSheetsApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useDeleteTechnicalSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => technicalSheetsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}
