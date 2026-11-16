/** Filtros e paginação comuns às listas do catálogo. `active` omitido = todos. */
export interface ListParams {
  page?: number;
  limit?: number;
  /** Parte do nome, sem diferenciar maiúsculas (a API busca no servidor). */
  search?: string;
  active?: boolean;
}

/** Item de `GET /<recurso>/options` (só itens ativos), já no formato dos comboboxes. */
export interface Opcao {
  value: number;
  label: string;
  hint?: string;
}
