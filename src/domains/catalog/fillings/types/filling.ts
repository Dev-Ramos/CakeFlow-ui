/** Formato bruto de `/fillings` (campos da API, em inglês). */
export interface FillingPayload {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  /** Tem acréscimo definido em Preços e acréscimos (libera a ativação). */
  priced: boolean;
}

/** Recheio, como o front o usa. O valor do acréscimo nunca aparece no catálogo. */
export interface Filling {
  id: number;
  name: string;
  description: string;
  active: boolean;
  priced: boolean;
}

/** Dados enviados ao criar ou editar um recheio. */
export interface FillingInput {
  name: string;
  description: string;
  active: boolean;
}
