import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PageParams } from "@/services/http/pagination";
import { rolesApi } from "../api/rolesApi";
import type { RoleInput } from "../types/role";
import { roleKeys, userKeys } from "./keys";

/**
 * Lista paginada de cargos (`{ data, meta }`). `page` e `limit` são opcionais:
 * sem eles, vale a paginação padrão da API.
 */
export function useRoles(params?: PageParams) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => rolesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Options de cargo para seletores, com busca server-side. Passe o termo JÁ com
 * debounce (`useDebounce`); enquanto a nova busca carrega, mantém a lista anterior.
 */
export function useRoleOptions(busca = "") {
  return useQuery({
    queryKey: roleKeys.options(busca),
    queryFn: () => rolesApi.options(busca),
    placeholderData: keepPreviousData,
    select: (roles) =>
      roles.map(({ value, label, hint }) => ({ value, label, hint: hint ?? undefined })),
  });
}

export function useRole(id: number | undefined) {
  return useQuery({
    queryKey: roleKeys.detail(id ?? 0),
    queryFn: () => rolesApi.get(id as number),
    enabled: id !== undefined,
  });
}

/** Cargos aparecem embutidos nos usuários: qualquer mudança em cargo invalida os dois. */
function useInvalidarCargosEUsuarios() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: roleKeys.all }),
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
    ]);
}

export function useCreateRole() {
  const invalidar = useInvalidarCargosEUsuarios();
  return useMutation({
    mutationFn: (input: RoleInput) => rolesApi.create(input),
    onSuccess: invalidar,
  });
}

export function useUpdateRole() {
  const invalidar = useInvalidarCargosEUsuarios();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: RoleInput }) => rolesApi.update(id, input),
    onSuccess: invalidar,
  });
}

export function useDeleteRole() {
  const invalidar = useInvalidarCargosEUsuarios();
  return useMutation({
    mutationFn: (id: number) => rolesApi.remove(id),
    onSuccess: invalidar,
  });
}
