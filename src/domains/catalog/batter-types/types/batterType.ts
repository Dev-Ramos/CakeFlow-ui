/** Formato bruto de `/batter_types` (campos da API, em inglês). */
export interface BatterTypePayload {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

/** Massa, como o front a usa. */
export interface BatterType {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

/** Dados enviados ao criar ou editar uma massa. */
export interface BatterTypeInput {
  name: string;
  description: string;
  active: boolean;
}
