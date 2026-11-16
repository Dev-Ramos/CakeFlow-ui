import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingApi } from "../api/pricingApi";
import type { PriceListParams, PricingSettings } from "../types/pricing";

const KEY = ["pricing"] as const;

export function usePanSpecPrices(params: PriceListParams) {
  return useQuery({
    queryKey: [...KEY, "pan_specs", params],
    queryFn: () => pricingApi.listPanSpecs(params),
    placeholderData: keepPreviousData,
  });
}

export function useFillingPrices(params: PriceListParams) {
  return useQuery({
    queryKey: [...KEY, "fillings", params],
    queryFn: () => pricingApi.listFillings(params),
    placeholderData: keepPreviousData,
  });
}

export function usePricingSettings() {
  return useQuery({
    queryKey: [...KEY, "settings"],
    queryFn: pricingApi.getSettings,
  });
}

/**
 * Salvar é uma requisição por linha alterada (sem transação). A tela chama estas mutações
 * e decide o que mostrar por linha, por isso não invalidam nada sozinhas: quem salva
 * chama `useInvalidarPrecos` no fim.
 */
export function useSetPanSpecPrice() {
  return useMutation({
    mutationFn: ({ id, cents }: { id: number; cents: number }) => pricingApi.setPanSpecPrice(id, cents),
  });
}

export function useSetFillingPrice() {
  return useMutation({
    mutationFn: ({ id, cents }: { id: number; cents: number }) => pricingApi.setFillingPrice(id, cents),
  });
}

export function useUpdatePricingSettings() {
  return useMutation({
    mutationFn: (parcial: Partial<PricingSettings>) => pricingApi.updateSettings(parcial),
  });
}

/** Recarrega preços e catálogo (a situação "sem preço" de formas e recheios mudou). */
export function useInvalidarPrecos() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: KEY }),
      queryClient.invalidateQueries({ queryKey: ["catalog"] }),
    ]);
}
