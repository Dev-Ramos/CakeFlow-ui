import { api } from "@/services/http/api";
import { mapPaginated, type Paginated } from "@/services/http/pagination";
import type {
  CakeType,
  CakeTypeInput,
  CakeTypeListParams,
  CakeTypePayload,
} from "../types/cakeType";

const CAMINHO = "/cake_types";

function paraModelo(p: CakeTypePayload): CakeType {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    imageUrl: p.image_url,
    defaultPanSpec: p.default_pan_spec && {
      id: p.default_pan_spec.id,
      name: p.default_pan_spec.name,
      dimensionsLabel: p.default_pan_spec.dimensions_label,
      heightCm: p.default_pan_spec.height_cm,
      active: p.default_pan_spec.active,
    },
    defaultBatterType: p.default_batter_type,
    defaultFillings: p.default_fillings,
    requiresDecoration: p.requires_decoration,
    requiresReinforcement: p.requires_reinforcement,
    active: p.active,
  };
}

/** Corpo `multipart/form-data` do tipo de bolo (imagem em `cake_type[image]`). */
export function paraCorpo(i: CakeTypeInput): FormData {
  const corpo = new FormData();
  const campo = (nome: string, valor: string | number | boolean) =>
    corpo.append(`cake_type[${nome}]`, String(valor));

  campo("name", i.name);
  campo("description", i.description);
  // Vazio ("") limpa a escolha: a API trata como sem valor.
  campo("default_pan_spec_id", i.defaultPanSpecId ?? "");
  campo("default_batter_type_id", i.defaultBatterTypeId ?? "");
  // Sem recheios, manda um item em branco: sem a chave o Rails não receberia nada e não limparia os recheios.
  if (i.defaultFillingIds.length === 0) corpo.append("cake_type[default_filling_ids][]", "");
  for (const id of i.defaultFillingIds) corpo.append("cake_type[default_filling_ids][]", String(id));
  campo("requires_decoration", i.requiresDecoration);
  campo("requires_reinforcement", i.requiresReinforcement);
  campo("active", i.active);
  if (i.image) corpo.append("cake_type[image]", i.image);
  else if (i.removeImage) campo("remove_image", true);
  return corpo;
}

export const cakeTypesApi = {
  list: async (params: CakeTypeListParams = {}): Promise<Paginated<CakeType>> => {
    const { requiresDecoration, ...resto } = params;
    const { data } = await api.get<Paginated<CakeTypePayload>>(CAMINHO, {
      params: { ...resto, requires_decoration: requiresDecoration },
    });
    return mapPaginated(data, paraModelo);
  },

  get: async (id: number): Promise<CakeType> => {
    const { data } = await api.get<CakeTypePayload>(`${CAMINHO}/${id}`);
    return paraModelo(data);
  },

  create: async (input: CakeTypeInput): Promise<CakeType> => {
    const { data } = await api.post<CakeTypePayload>(CAMINHO, paraCorpo(input));
    return paraModelo(data);
  },

  update: async (id: number, input: CakeTypeInput): Promise<CakeType> => {
    const { data } = await api.patch<CakeTypePayload>(`${CAMINHO}/${id}`, paraCorpo(input));
    return paraModelo(data);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`${CAMINHO}/${id}`);
  },
};
