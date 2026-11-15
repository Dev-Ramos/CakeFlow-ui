import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { authKeys } from "./authKeys";

/** Valida o token do link de convite e traz os dados de quem está sendo convidado. */
export function useConvite(token: string) {
  return useQuery({
    queryKey: authKeys.convite(token),
    queryFn: () => authApi.validarConvite(token),
    // Convite inválido/expirado não melhora ao repetir.
    retry: false,
  });
}
