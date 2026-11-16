import { api } from "@/services/http/api";
import { mapPaginated, type Paginated, type PageParams } from "@/services/http/pagination";
import type { Role, RoleInput, RoleOption, RolePayload } from "../types/role";

function paraRole(payload: RolePayload): Role {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? "",
    permissions: payload.permissions,
  };
}

/** Corpo esperado pela API: `params.expect(role: [:name, :description, { permission_ids: [] }])`. */
function paraCorpo({ name, description, permissionIds }: RoleInput) {
  return { role: { name, description, permission_ids: permissionIds } };
}

export const rolesApi = {
  /** `page` e `limit` são opcionais: sem eles a API usa a paginação padrão dela. */
  list: async (params?: PageParams): Promise<Paginated<Role>> => {
    const { data } = await api.get<Paginated<RolePayload>>("/roles", { params });
    return mapPaginated(data, paraRole);
  },

  /**
   * Opções para seletores, com busca server-side (`q`). Aceita a lista pura ou
   * embrulhada em `{ data }`.
   */
  options: async (busca?: string): Promise<RoleOption[]> => {
    const termo = busca?.trim();
    const { data } = await api.get<RoleOption[] | { data: RoleOption[] }>("/roles/options", {
      params: termo ? { q: termo } : undefined,
    });
    return Array.isArray(data) ? data : data.data;
  },

  get: async (id: number): Promise<Role> => {
    const { data } = await api.get<RolePayload>(`/roles/${id}`);
    return paraRole(data);
  },

  create: async (input: RoleInput): Promise<Role> => {
    const { data } = await api.post<RolePayload>("/roles", paraCorpo(input));
    return paraRole(data);
  },

  update: async (id: number, input: RoleInput): Promise<Role> => {
    const { data } = await api.patch<RolePayload>(`/roles/${id}`, paraCorpo(input));
    return paraRole(data);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};
