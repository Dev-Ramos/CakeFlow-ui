import { api } from "@/services/http/api";
import { mapPaginated, type Paginated } from "@/services/http/pagination";
import type {
  TechnicalSheet,
  TechnicalSheetInput,
  TechnicalSheetListParams,
  TechnicalSheetPayload,
} from "../types/technicalSheet";

const CAMINHO = "/technical_sheets";

function paraModelo(p: TechnicalSheetPayload): TechnicalSheet {
  return {
    id: p.id,
    panSpec: p.pan_spec,
    batterType: p.batter_type,
    batterQuantityG: p.batter_quantity_g,
    bakeTempC: p.bake_temp_c,
    bakeTimeMin: p.bake_time_min,
    notes: p.notes ?? "",
    ingredientsCount: p.ingredients_count,
    ingredients: p.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
  };
}

/** Corpo esperado pela API: `{ technical_sheet: {...} }`, com a lista completa de ingredientes. */
function paraCorpo(i: TechnicalSheetInput) {
  return {
    technical_sheet: {
      pan_spec_id: i.panSpecId,
      batter_type_id: i.batterTypeId,
      batter_quantity_g: i.batterQuantityG,
      bake_temp_c: i.bakeTempC,
      bake_time_min: i.bakeTimeMin,
      notes: i.notes,
      ingredients: i.ingredients,
    },
  };
}

export const technicalSheetsApi = {
  list: async (params: TechnicalSheetListParams = {}): Promise<Paginated<TechnicalSheet>> => {
    const { panSpecId, batterTypeId, ...resto } = params;
    const { data } = await api.get<Paginated<TechnicalSheetPayload>>(CAMINHO, {
      params: { ...resto, pan_spec_id: panSpecId, batter_type_id: batterTypeId },
    });
    return mapPaginated(data, paraModelo);
  },

  get: async (id: number): Promise<TechnicalSheet> => {
    const { data } = await api.get<TechnicalSheetPayload>(`${CAMINHO}/${id}`);
    return paraModelo(data);
  },

  create: async (input: TechnicalSheetInput): Promise<TechnicalSheet> => {
    const { data } = await api.post<TechnicalSheetPayload>(CAMINHO, paraCorpo(input));
    return paraModelo(data);
  },

  update: async (id: number, input: TechnicalSheetInput): Promise<TechnicalSheet> => {
    const { data } = await api.patch<TechnicalSheetPayload>(`${CAMINHO}/${id}`, paraCorpo(input));
    return paraModelo(data);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`${CAMINHO}/${id}`);
  },
};
