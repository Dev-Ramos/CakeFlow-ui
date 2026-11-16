import { api } from "@/services/http/api";
import type { PermissionGroup } from "../types/role";

export const permissionsApi = {
  /**
   * Catálogo de permissões já agrupado por recurso
   * (`[{ resource, permissions: [{ id, value }] }]`). Aceita também `{ data }`.
   */
  list: async (): Promise<PermissionGroup[]> => {
    const { data } = await api.get<PermissionGroup[] | { data: PermissionGroup[] }>("/permissions");
    return Array.isArray(data) ? data : data.data;
  },
};
