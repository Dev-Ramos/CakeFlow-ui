/** Ingrediente como a API devolve (`id` só vem na leitura). */
export interface IngredientPayload {
  id?: number;
  name: string;
  quantity: number;
  unit: string;
}

/** Formato bruto de `/technical_sheets` (campos da API, em inglês). */
export interface TechnicalSheetPayload {
  id: number;
  pan_spec: { id: number; name: string };
  batter_type: { id: number; name: string };
  batter_quantity_g: number;
  bake_temp_c: number | null;
  bake_time_min: number | null;
  notes: string | null;
  ingredients_count: number;
  ingredients: IngredientPayload[];
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

/** Ficha técnica, como o front a usa. Única por (forma, massa). */
export interface TechnicalSheet {
  id: number;
  panSpec: { id: number; name: string };
  batterType: { id: number; name: string };
  batterQuantityG: number;
  bakeTempC: number | null;
  bakeTimeMin: number | null;
  notes: string;
  ingredientsCount: number;
  ingredients: Ingredient[];
}

/** Dados enviados ao criar ou editar. Atualizar substitui a lista inteira de ingredientes. */
export interface TechnicalSheetInput {
  panSpecId: number;
  batterTypeId: number;
  batterQuantityG: number;
  bakeTempC: number | null;
  bakeTimeMin: number | null;
  notes: string;
  ingredients: Ingredient[];
}

/** Filtros da lista (a API só aceita estes, além de `page` e `limit`). */
export interface TechnicalSheetListParams {
  page?: number;
  limit?: number;
  panSpecId?: number;
  batterTypeId?: number;
}
