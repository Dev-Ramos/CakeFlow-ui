import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./Button";
import { LimitSelect } from "./LimitSelect";

export interface PaginationProps {
  /** Página atual (a partir de 1); é limitada ao intervalo válido. */
  page: number;
  /** Itens por página. */
  limit: number;
  /** Total de registros. */
  count: number;
  /** Total de páginas. Se ausente, é calculado a partir de `count` e `limit`. */
  pages?: number;
  onPageChange: (page: number) => void;
  /** Quando informado, mostra o seletor de itens por página. */
  onLimitChange?: (limit: number) => void;
  /** Opções do seletor de limite. */
  limits?: number[];
  /** Nome dos itens no texto de resumo (ex.: "colaboradores"). */
  rotulo?: string;
  className?: string;
}

/** Páginas a mostrar: todas se forem poucas; senão a primeira, a última e as vizinhas da atual. */
function paginasVisiveis(atual: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const janela = new Set([1, total, atual - 1, atual, atual + 1]);
  const ordenadas = [...janela].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const resultado: Array<number | "…"> = [];
  ordenadas.forEach((numero, indice) => {
    const anterior = ordenadas[indice - 1];
    if (anterior !== undefined && numero - anterior > 1) resultado.push("…");
    resultado.push(numero);
  });
  return resultado;
}

/**
 * Paginação controlada e presentacional, no padrão do rodapé de tabela do
 * design: resumo à esquerda; "Exibir N por página", Anterior, páginas
 * numeradas e Próxima à direita. Usa os mesmos nomes do `meta` da API
 * (`page`, `limit`, `count`, `pages`). Feita para ir dentro do `Card` da tabela.
 */
export function Pagination({
  page,
  limit,
  count,
  pages,
  onPageChange,
  onLimitChange,
  limits,
  rotulo = "registros",
  className,
}: PaginationProps) {
  const totalDePaginas = Math.max(1, pages ?? Math.ceil(count / limit));
  const paginaAtual = Math.min(Math.max(page, 1), totalDePaginas);

  const primeiroItem = count === 0 ? 0 : (paginaAtual - 1) * limit + 1;
  const ultimoItem = Math.min(paginaAtual * limit, count);

  const naPrimeira = paginaAtual <= 1;
  const naUltima = paginaAtual >= totalDePaginas;

  const numeros = "text-on-surface";
  // Desabilitado no rodapé do design: fundo branco e texto apagado (sem o rosado dos botões cheios).
  const botaoDeNavegacao = "disabled:bg-surface-container-lowest disabled:text-outline";

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-4 py-3",
        "text-body-sm text-tertiary",
        className,
      )}
    >
      <p>
        Mostrando <strong className={numeros}>{primeiroItem}</strong> a{" "}
        <strong className={numeros}>{ultimoItem}</strong> de{" "}
        <strong className={numeros}>{count}</strong> {rotulo}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {onLimitChange && (
          <LimitSelect value={limit} onChange={onLimitChange} limits={limits} className="hidden sm:flex" />
        )}

        <div className="flex items-center gap-1.5">
          <Button
            variant="neutral"
            size="sm"
            className={botaoDeNavegacao}
            disabled={naPrimeira}
            onClick={() => onPageChange(paginaAtual - 1)}
          >
            <ChevronLeft size={14} aria-hidden="true" />
            Anterior
          </Button>

          {paginasVisiveis(paginaAtual, totalDePaginas).map((item, indice) =>
            item === "…" ? (
              <span
                key={`reticencias-${indice}`}
                aria-hidden="true"
                className="hidden w-6 text-center text-tertiary sm:inline-block"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Página ${item}`}
                aria-current={item === paginaAtual ? "page" : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  "h-8 min-w-8 rounded-lg px-2 text-label-md tabular-nums transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  item === paginaAtual
                    ? "bg-primary text-on-primary"
                    : "hidden border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low sm:inline-block",
                )}
              >
                {item}
              </button>
            ),
          )}

          <Button
            variant="neutral"
            size="sm"
            className={botaoDeNavegacao}
            disabled={naUltima}
            onClick={() => onPageChange(paginaAtual + 1)}
          >
            Próxima
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
