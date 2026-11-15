import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../lib/cn";
import { EmptyState } from "./EmptyState";

/** Importância da coluna quando falta largura. `alta` nunca some. Ausente = `alta`. */
export type PrioridadeColuna = "alta" | "media" | "baixa";

/**
 * Classes escritas por extenso: o Tailwind varre o código para saber o que
 * gerar, então nome montado em runtime não existiria no CSS.
 *
 * `@container` e não breakpoint de viewport porque a sidebar recolhe — a mesma
 * tela dá larguras diferentes para a tabela.
 */
const CLASSE_POR_PRIORIDADE: Record<PrioridadeColuna, string> = {
  alta: "",
  media: "hidden @3xl:table-cell",
  baixa: "hidden @5xl:table-cell",
};

/**
 * O inverso exato de {@link CLASSE_POR_PRIORIDADE}: o item some do resumo no
 * instante em que a coluna reaparece na grade. Tem de ser por CSS — o React não
 * sabe quem está oculto.
 */
const CLASSE_NO_RESUMO: Record<Exclude<PrioridadeColuna, "alta">, string> = {
  media: "@3xl:hidden",
  baixa: "@5xl:hidden",
};

/** Alinhamento de quem não declara o seu: centro mantém as colunas alinhadas entre si. */
const ALINHAMENTO_PADRAO = "centro" as const;

type Alinhamento = "esquerda" | "direita" | "centro";

const CLASSE_ALINHAMENTO: Record<Alinhamento, string> = {
  esquerda: "text-left",
  direita: "text-right",
  centro: "text-center",
};

const CLASSE_ALINHAMENTO_CABECALHO: Record<Alinhamento, string> = {
  esquerda: "justify-start",
  direita: "justify-end",
  centro: "justify-center",
};

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  /** Renderiza a célula da linha; sem `render`, a célula fica vazia. */
  render?: (row: T) => ReactNode;
  className?: string;
  /**
   * Torna a coluna ordenável (client-side, só a página corrente). Extrai o valor
   * usado para comparar as linhas. `null`/`undefined` são ordenados por último.
   */
  sortAccessor?: (row: T) => string | number | null | undefined;
  /**
   * Alinhamento do conteúdo **e do cabeçalho**. Existe porque `className` sozinho
   * não resolve: em coluna ordenável o rótulo vira um `<button>` flex, que ignora
   * o `text-align` do `<th>`.
   */
  alinhamento?: Alinhamento;
  /** Ver {@link PrioridadeColuna}. Só tem efeito com `colunasPorPrioridade`. */
  prioridade?: PrioridadeColuna;
}

export interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T) => string | number;
  /** Exibe linhas skeleton no lugar dos dados. */
  loading?: boolean;
  /** Conteúdo quando não há linhas (e não está carregando). */
  emptyMessage?: ReactNode;
  /** Legenda acessível da tabela. Na prática obrigatória com `scrollX`. */
  caption?: string;
  /**
   * Contém o scroll horizontal na própria tabela, em vez de arrastar a área de
   * conteúdo. Normalmente junto de `className="min-w-[…]"`.
   */
  scrollX?: boolean;
  /**
   * Limita a altura da tabela (ex.: `'32rem'`), que passa a rolar por dentro.
   * Existe por causa do cabeçalho fixo: um wrapper com `overflow-x` vira container
   * de scroll nos dois eixos e, sem altura definida, o `sticky` perde a âncora.
   */
  maxHeight?: string;
  /**
   * Classes do wrapper criado por `scrollX`/`maxHeight` — é onde vai o
   * **espaçamento externo** (`mt-4`). Não use `className` para isso: ele vai
   * para a `<table>`, que fica *dentro* do wrapper (a margem deixa de colapsar).
   */
  wrapperClassName?: string;
  /**
   * Linha de detalhe: quando retorna conteúdo para uma linha, ele é renderizado
   * numa `<tr>` extra de largura total logo abaixo dela. O estado de expansão
   * vive no chamador (retorne `null` para linhas recolhidas).
   */
  rowDetail?: (row: T) => ReactNode;
  /** Classes extras por linha (ex.: destaque transitório). */
  rowClassName?: (row: T) => string | undefined;
  /**
   * Esconde colunas de menor `prioridade` conforme o container encolhe, em vez
   * de espremer tudo ou empurrar para o scroll horizontal. O que sai da grade
   * reaparece numa linha de resumo (`rótulo: valor`) logo abaixo.
   */
  colunasPorPrioridade?: boolean;
  /**
   * `nested` é para tabelas dentro de `rowDetail`/modais: chrome leve, sem hover
   * e sem cabeçalho fixo.
   */
  variant?: "default" | "nested";
  className?: string;
}

const SKELETON_ROWS = 5;

type SortDirection = "asc" | "desc";

interface SortState {
  key: string;
  direction: SortDirection;
}

function compareValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): number {
  const aNil = a == null;
  const bNil = b == null;
  // Nulos por último, independentemente da direção da coluna.
  if (aNil && bNil) return 0;
  if (aNil) return 1;
  if (bNil) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR");
}

/** Tabela de dados genérica do design system. Presentacional. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyMessage,
  caption,
  scrollX = false,
  maxHeight,
  wrapperClassName,
  rowDetail,
  rowClassName,
  colunasPorPrioridade = false,
  variant = "default",
  className,
}: DataTableProps<T>) {
  // Defensivo: se um chamador passar shape errado (ex.: objeto paginado em vez de
  // itens), degrada para vazio em vez de derrubar a aplicação inteira.
  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const [sort, setSort] = useState<SortState | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return safeRows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortAccessor) return safeRows;
    const accessor = column.sortAccessor;
    const factor = sort.direction === "asc" ? 1 : -1;
    // Cópia: nunca mutar o array recebido.
    return [...safeRows].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      // Nulos ficam por último nas duas direções: não passam pelo fator de inversão.
      if (va == null || vb == null) return compareValues(va, vb);
      return factor * compareValues(va, vb);
    });
  }, [safeRows, sort, columns]);

  const showEmpty = !loading && sortedRows.length === 0;

  // Ciclo de ordenação por clique: asc → desc → sem ordenação.
  function handleSort(key: string) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  function ariaSortFor(key: string): "ascending" | "descending" | "none" {
    if (sort?.key !== key) return "none";
    return sort.direction === "asc" ? "ascending" : "descending";
  }

  const aninhada = variant === "nested";

  // O cabeçalho só gruda quando existe um container de scroll com altura para
  // ancorá-lo: sem wrapper, é o scroll da página; com wrapper, só se `maxHeight`
  // foi definido. Na variante aninhada nunca gruda.
  const envolve = scrollX || maxHeight !== undefined;
  const cabecalhoFixo = !aninhada && (!envolve || maxHeight !== undefined);

  const paddingCelula = aninhada ? "py-1 pr-4" : "px-3 py-2";

  const classeDaColuna = (column: DataTableColumn<T>) =>
    colunasPorPrioridade ? CLASSE_POR_PRIORIDADE[column.prioridade ?? "alta"] : undefined;

  const ocultaveis = colunasPorPrioridade
    ? columns.flatMap((column) => {
        const { prioridade } = column;
        if (prioridade === undefined || prioridade === "alta") return [];
        return [{ column, classeNoResumo: CLASSE_NO_RESUMO[prioridade] }];
      })
    : [];

  // O resumo some quando a última coluna oculta volta à grade. Enquanto está
  // visível é ele que fecha o grupo, então a borda sai da linha de cima.
  const [classeResumo, classeSemBordaNaLinha] = ocultaveis.some(
    ({ column }) => column.prioridade === "baixa",
  )
    ? (["@5xl:hidden", "@max-5xl:border-b-0"] as const)
    : (["@3xl:hidden", "@max-3xl:border-b-0"] as const);

  const temResumo = ocultaveis.length > 0;

  const tabela = (
    <table className={cn("w-full border-collapse text-left tabular-nums", className)}>
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead className={cn(cabecalhoFixo && "sticky top-0 z-10")}>
        <tr
          className={cn(
            "text-label-md uppercase text-tertiary",
            aninhada ? "tracking-wide" : "border-b border-outline-variant bg-surface-container-low",
          )}
        >
          {columns.map((column) => {
            const sortable = Boolean(column.sortAccessor);
            const active = sort?.key === column.key;
            const SortIcon = !active ? ArrowUpDown : sort?.direction === "asc" ? ArrowUp : ArrowDown;
            return (
              <th
                key={column.key}
                scope="col"
                aria-sort={sortable ? ariaSortFor(column.key) : undefined}
                className={cn(
                  "tracking-wider",
                  // Ordenável: o padding migra do <th> para o <button>, que ocupa a
                  // célula inteira — alvo de toque >= 24px (WCAG 2.5.8).
                  sortable ? "p-0" : paddingCelula,
                  // Só dentro de container de scroll: a tabela é `w-full`, então
                  // deixando o rótulo quebrar ela sempre cabe e o scroll nunca ativa.
                  envolve && "whitespace-nowrap",
                  cabecalhoFixo && "bg-surface-container-low",
                  CLASSE_ALINHAMENTO[column.alinhamento ?? ALINHAMENTO_PADRAO],
                  classeDaColuna(column),
                  column.className,
                )}
              >
                {sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(column.key)}
                    className={cn(
                      "flex w-full items-center gap-1 uppercase tracking-wider",
                      CLASSE_ALINHAMENTO_CABECALHO[column.alinhamento ?? ALINHAMENTO_PADRAO],
                      paddingCelula,
                      "transition-colors hover:text-on-surface",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                      active && "text-on-surface",
                    )}
                  >
                    {column.header}
                    <SortIcon size={14} aria-hidden="true" className="shrink-0" />
                  </button>
                ) : (
                  column.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {loading &&
          Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
            <tr
              key={`skeleton-${rowIndex}`}
              className={aninhada ? "border-t border-outline-variant" : "border-b border-outline-variant"}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    paddingCelula,
                    "text-body-md",
                    CLASSE_ALINHAMENTO[column.alinhamento ?? ALINHAMENTO_PADRAO],
                    classeDaColuna(column),
                    column.className,
                  )}
                >
                  <span className="block h-4 w-full animate-pulse rounded bg-surface-container" />
                </td>
              ))}
            </tr>
          ))}

        {showEmpty && (
          <tr>
            <td colSpan={columns.length} className={paddingCelula}>
              {emptyMessage ?? <EmptyState title="Nenhum registro encontrado." />}
            </td>
          </tr>
        )}

        {!loading &&
          sortedRows.map((row) => {
            const key = getRowKey(row);
            const detail = rowDetail?.(row);
            return (
              <Fragment key={key}>
                {/* data-row-key: permite a quem chama mapear eventos delegados de volta
                    à linha, sem acoplar handler por célula. */}
                <tr
                  data-row-key={key}
                  className={cn(
                    aninhada
                      ? "border-t border-outline-variant"
                      : "border-b border-outline-variant hover:bg-row-hover",
                    temResumo && !aninhada && classeSemBordaNaLinha,
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        paddingCelula,
                        "text-body-md text-on-surface",
                        CLASSE_ALINHAMENTO[column.alinhamento ?? ALINHAMENTO_PADRAO],
                        classeDaColuna(column),
                        column.className,
                      )}
                    >
                      {column.render ? column.render(row) : null}
                    </td>
                  ))}
                </tr>
                {temResumo && (
                  <tr
                    className={cn(
                      classeResumo,
                      !aninhada && "border-b border-outline-variant",
                      rowClassName?.(row),
                    )}
                  >
                    {/* colSpan maior que a largura real é ignorado pelo navegador — as
                        colunas ocultas não ocupam célula. */}
                    <td colSpan={columns.length} className={cn(paddingCelula, "pt-0 text-body-md")}>
                      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm">
                        {ocultaveis.map(({ column, classeNoResumo }) => (
                          <div key={column.key} className={cn("flex gap-1", classeNoResumo)}>
                            <dt className="text-on-surface-variant">{column.header}:</dt>
                            <dd className="text-on-surface">
                              {column.render ? column.render(row) : null}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                  </tr>
                )}
                {detail != null && detail !== false && (
                  <tr className="border-b border-outline-variant">
                    <td colSpan={columns.length} className="bg-surface-container-low px-3 py-2">
                      {detail}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
      </tbody>
    </table>
  );

  if (!envolve) {
    // O `@container` não cria contexto de scroll, então o cabeçalho fixo continua
    // ancorado no scroll da página.
    if (colunasPorPrioridade) {
      return <div className={cn("@container", wrapperClassName)}>{tabela}</div>;
    }
    return tabela;
  }

  return (
    <div
      // Região de scroll precisa ser alcançável por teclado (WCAG 2.1.1): Firefox
      // e Safari não tornam scrollers focáveis sozinhos.
      //
      // `group` (e não `region`) de propósito: telas costumam embrulhar a seção
      // num card com o mesmo nome do caption, e dois landmarks homônimos aninhados
      // só poluem o leitor de tela. Só com `caption`: sem nome o role não ajuda.
      tabIndex={0}
      role={caption ? "group" : undefined}
      aria-label={caption}
      className={cn(
        // `relative`: o scroller vira o containing block dos `sr-only` (caption),
        // que são `absolute`; sem isso eles escapam do clip e esticam o scroll da página.
        "relative",
        colunasPorPrioridade && "@container",
        maxHeight === undefined ? "overflow-x-auto" : "overflow-auto",
        // O container passa a receber foco — o anel precisa aparecer.
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        wrapperClassName,
      )}
      style={maxHeight === undefined ? undefined : { maxHeight }}
    >
      {tabela}
    </div>
  );
}
