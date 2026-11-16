/** Formato bruto de `/cake_types` (campos da API, em inglês). */
export interface CakeTypePayload {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  default_pan_spec: {
    id: number;
    name: string;
    dimensions_label: string;
    height_cm: number;
    active: boolean;
  } | null;
  default_batter_type: { id: number; name: string; active: boolean } | null;
  default_fillings: Array<{ id: number; name: string; active: boolean }>;
  requires_decoration: boolean;
  requires_reinforcement: boolean;
  active: boolean;
}

/** Tipo de bolo, como o front o usa. Sem preço; formato e altura vêm da forma padrão. */
export interface CakeType {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  defaultPanSpec: {
    id: number;
    name: string;
    dimensionsLabel: string;
    heightCm: number;
    active: boolean;
  } | null;
  defaultBatterType: { id: number; name: string; active: boolean } | null;
  defaultFillings: Array<{ id: number; name: string; active: boolean }>;
  requiresDecoration: boolean;
  requiresReinforcement: boolean;
  active: boolean;
}

/** Dados enviados ao criar ou editar (vão em `multipart/form-data`). */
export interface CakeTypeInput {
  name: string;
  description: string;
  defaultPanSpecId: number | null;
  defaultBatterTypeId: number | null;
  defaultFillingIds: number[];
  requiresDecoration: boolean;
  requiresReinforcement: boolean;
  active: boolean;
  /** Arquivo novo da imagem (substitui a atual). */
  image: File | null;
  /** Apaga a imagem atual (ignorado se `image` vier junto). */
  removeImage: boolean;
}

/** Filtros da lista, além dos comuns (`page`, `limit`, `search`, `active`). */
export interface CakeTypeListParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  requiresDecoration?: boolean;
}
