export type PanShape = "round" | "rectangular" | "square";

/** Formato bruto de `/pan_specs` (campos da API, em inglês). */
export interface PanSpecPayload {
  id: number;
  name: string;
  shape: PanShape;
  diameter_cm: number | null;
  length_cm: number | null;
  width_cm: number | null;
  side_cm: number | null;
  height_cm: number;
  servings: number | null;
  active: boolean;
  /** Tem preço definido em Preços e acréscimos (libera a ativação). */
  priced: boolean;
  /** "20 cm de diâmetro", "30 x 20 cm" ou "20 x 20 cm". */
  dimensions_label: string;
}

/** Forma, como o front a usa. O valor do preço nunca aparece no catálogo. */
export interface PanSpec {
  id: number;
  name: string;
  shape: PanShape;
  diameterCm: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  sideCm: number | null;
  heightCm: number;
  servings: number | null;
  active: boolean;
  priced: boolean;
  dimensionsLabel: string;
}

/** Dados enviados ao criar ou editar uma forma: só as medidas do formato escolhido são preenchidas. */
export interface PanSpecInput {
  name: string;
  shape: PanShape;
  diameterCm: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  sideCm: number | null;
  heightCm: number;
  servings: number | null;
  active: boolean;
}
