import { useQuery } from "@tanstack/react-query";
import { permissionsApi } from "../api/permissionsApi";
import { permissionKeys } from "./keys";

/** Catálogo de permissões agrupado por recurso, para montar a matriz do cargo. */
export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: permissionsApi.list,
  });
}
