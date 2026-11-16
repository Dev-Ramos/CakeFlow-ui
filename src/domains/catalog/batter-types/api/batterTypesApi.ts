import { api } from "@/services/http/api";
import { mapPaginated, type Paginated } from "@/services/http/pagination";
import { buscarOpcoes } from "../../shared/api/opcoes";
import type { ListParams, Opcao } from "../../shared/types/catalog";
import type { BatterType, BatterTypeInput, BatterTypePayload } from "../types/batterType";

const CAMINHO = "/batter_types";

function paraModelo(payload: BatterTypePayload): BatterType {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? "",
    active: payload.active,
  };
}

/** Corpo esperado pela API: `{ batter_type: { name, description, active } }`. */
function paraCorpo({ name, description, active }: BatterTypeInput) {
  return { batter_type: { name, description, active } };
}

export const batterTypesApi = {
  list: async (params?: ListParams): Promise<Paginated<BatterType>> => {
    const { data } = await api.get<Paginated<BatterTypePayload>>(CAMINHO, { params });
    return mapPaginated(data, paraModelo);
  },

  create: async (input: BatterTypeInput): Promise<BatterType> => {
    const { data } = await api.post<BatterTypePayload>(CAMINHO, paraCorpo(input));
    return paraModelo(data);
  },

  update: async (id: number, input: BatterTypeInput): Promise<BatterType> => {
    const { data } = await api.patch<BatterTypePayload>(`${CAMINHO}/${id}`, paraCorpo(input));
    return paraModelo(data);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`${CAMINHO}/${id}`);
  },

  /** Massas ativas para selects, com busca no servidor. */
  options: (search?: string): Promise<Opcao[]> => buscarOpcoes(CAMINHO, search),
};
