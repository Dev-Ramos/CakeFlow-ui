
export interface PageMeta {
  page: number;
  limit: number;
  count: number;
  pages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

/** Parâmetros opcionais de paginação. Sem eles, a API aplica a página e o limite padrão dela. */
export interface PageParams {
  page?: number;
  limit?: number;
}

/** Converte os itens da página mantendo o `meta`. */
export function mapPaginated<T, U>(
  resposta: Paginated<T>,
  converter: (item: T) => U,
): Paginated<U> {
  return { data: resposta.data.map(converter), meta: resposta.meta };
}

/**
 * Percorre todas as páginas e devolve todos os itens. Para listas pequenas que
 * alimentam seletores (ex.: cargos num combobox), onde a página padrão da API
 * não pode truncar as opções.
 */
export async function buscarTodas<T>(
  buscar: (params: Required<PageParams>) => Promise<Paginated<T>>,
  limit = 100,
): Promise<T[]> {
  const primeira = await buscar({ page: 1, limit });
  const itens = [...primeira.data];
  for (let page = 2; page <= primeira.meta.pages; page++) {
    itens.push(...(await buscar({ page, limit })).data);
  }
  return itens;
}
