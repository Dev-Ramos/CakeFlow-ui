import { api } from "@/services/http/api";
import { mapPaginated, type Paginated } from "@/services/http/pagination";
import { buscarOpcoes } from "../../shared/api/opcoes";
import type { ListParams, Opcao } from "../../shared/types/catalog";
import type { Filling, FillingInput, FillingPayload } from "../types/filling";

const CAMINHO = "/fillings";

function paraModelo(payload: FillingPayload): Filling {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? "",
    active: payload.active,
    priced: payload.priced,
  };
}

/** Corpo esperado pela API: `{ filling: { name, description, active } }`. */
function paraCorpo({ name, description, active }: FillingInput) {
  return { filling: { name, description, active } };
}

export const fillingsApi = {
  list: async (params?: ListParams): Promise<Paginated<Filling>> => {
    const { data } = await api.get<Paginated<FillingPayload>>(CAMINHO, { params });
    return mapPaginated(data, paraModelo);
  },

  create: async (input: FillingInput): Promise<Filling> => {
    const { data } = await api.post<FillingPayload>(CAMINHO, paraCorpo(input));
    return paraModelo(data);
  },

  update: async (id: number, input: FillingInput): Promise<Filling> => {
    const { data } = await api.patch<FillingPayload>(`${CAMINHO}/${id}`, paraCorpo(input));
    return paraModelo(data);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`${CAMINHO}/${id}`);
  },

  /** Recheios ativos para selects, com busca no servidor. */
  options: (search?: string): Promise<Opcao[]> => buscarOpcoes(CAMINHO, search),
};
