import { api } from "@/services/http/api";
import { mapPaginated, type Paginated } from "@/services/http/pagination";
import { buscarOpcoes } from "../../shared/api/opcoes";
import type { ListParams, Opcao } from "../../shared/types/catalog";
import type { PanSpec, PanSpecInput, PanSpecPayload } from "../types/panSpec";

const CAMINHO = "/pan_specs";

function paraModelo(p: PanSpecPayload): PanSpec {
  return {
    id: p.id,
    name: p.name,
    shape: p.shape,
    diameterCm: p.diameter_cm,
    lengthCm: p.length_cm,
    widthCm: p.width_cm,
    sideCm: p.side_cm,
    heightCm: p.height_cm,
    servings: p.servings,
    active: p.active,
    priced: p.priced,
    dimensionsLabel: p.dimensions_label,
  };
}

/** Corpo esperado pela API: `{ pan_spec: {...} }`. */
function paraCorpo(i: PanSpecInput) {
  return {
    pan_spec: {
      name: i.name,
      shape: i.shape,
      diameter_cm: i.diameterCm,
      length_cm: i.lengthCm,
      width_cm: i.widthCm,
      side_cm: i.sideCm,
      height_cm: i.heightCm,
      servings: i.servings,
      active: i.active,
    },
  };
}

export const panSpecsApi = {
  list: async (params?: ListParams): Promise<Paginated<PanSpec>> => {
    const { data } = await api.get<Paginated<PanSpecPayload>>(CAMINHO, { params });
    return mapPaginated(data, paraModelo);
  },

  create: async (input: PanSpecInput): Promise<PanSpec> => {
    const { data } = await api.post<PanSpecPayload>(CAMINHO, paraCorpo(input));
    return paraModelo(data);
  },

  update: async (id: number, input: PanSpecInput): Promise<PanSpec> => {
    const { data } = await api.patch<PanSpecPayload>(`${CAMINHO}/${id}`, paraCorpo(input));
    return paraModelo(data);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`${CAMINHO}/${id}`);
  },

  /** Formas ativas para selects, com busca no servidor. */
  options: (search?: string): Promise<Opcao[]> => buscarOpcoes(CAMINHO, search),
};
