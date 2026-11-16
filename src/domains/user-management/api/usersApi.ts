import { api } from "@/services/http/api";
import { mapPaginated, type Paginated, type PageParams } from "@/services/http/pagination";
import type { User, UserInput, UserPayload } from "../types/user";

function paraUser(payload: UserPayload): User {
  return {
    id: payload.id,
    name: payload.name,
    lastName: payload.last_name,
    email: payload.email,
    roles: payload.roles,
    createdAt: payload.created_at,
  };
}

/** Corpo esperado pela API: `params.expect(user: [...])`, com `role_ids`. */
function paraCorpo({ name, lastName, email, roleIds }: UserInput) {
  return { user: { name, last_name: lastName, email, role_ids: roleIds } };
}

export const usersApi = {
  /** `page` e `limit` são opcionais: sem eles a API usa a paginação padrão dela. */
  list: async (params?: PageParams): Promise<Paginated<User>> => {
    const { data } = await api.get<Paginated<UserPayload>>("/users", { params });
    return mapPaginated(data, paraUser);
  },

  get: async (id: number): Promise<User> => {
    const { data } = await api.get<UserPayload>(`/users/${id}`);
    return paraUser(data);
  },

  create: async (input: UserInput): Promise<User> => {
    const { data } = await api.post<UserPayload>("/users", paraCorpo(input));
    return paraUser(data);
  },

  update: async (id: number, input: UserInput): Promise<User> => {
    const { data } = await api.patch<UserPayload>(`/users/${id}`, paraCorpo(input));
    return paraUser(data);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
