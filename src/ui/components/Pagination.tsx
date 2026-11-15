import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./Button";
import { Select } from "./Select";

export interface PaginationProps {
  /** Página atual (1-based); é limitada a `[1, totalPages]`. */
  page: number;
  /** Tamanho da página usado quando `size` não é informado. */
  pageSize: number;
  /** Total de registros (vem da API). */
  total: number;
  onPageChange: (page: number) => void;
  /** A presença de `size` liga o modo "rico" (Primeira/Última e texto "Mostrando…"). */
  size?: number;
  /** Mostra o seletor "N por página" (oculto em celular). */
  onSizeChange?: (size: number) => void;
  tamanhos?: number[];
  className?: string;
}

const TAMANHOS_PADRAO = [10, 20, 50, 100];

/** Paginação controlada e presentacional. Modo simples (sem `size`) ou rico. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  size,
  onSizeChange,
  tamanhos = TAMANHOS_PADRAO,
  className,
}: PaginationProps) {
  const effectiveSize = size ?? pageSize;
  const rich = size != null;

  const totalPages = Math.max(1, Math.ceil(total / effectiveSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const firstItem = total === 0 ? 0 : (currentPage - 1) * effectiveSize + 1;
  const lastItem = Math.min(currentPage * effectiveSize, total);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        "mt-4 flex items-center justify-between gap-4 text-body-sm text-on-surface-variant sm:text-body-md",
        className,
      )}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <span>
          {rich ? "Mostrando " : ""}
          {firstItem}–{lastItem} de {total}
        </span>
        {onSizeChange && (
          <div className="hidden items-center gap-2 sm:flex">
            <div className="w-20">
              <Select
                ariaLabel="Itens por página"
                value={String(effectiveSize)}
                onValueChange={(novo) => onSizeChange(Number(novo))}
                options={tamanhos.map((t) => ({ value: String(t), label: String(t) }))}
              />
            </div>
            <span>por página</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {rich && (
          <Button
            variant="tonal"
            size="icon"
            aria-label="Primeira"
            icon={<ChevronsLeft size={16} aria-hidden="true" />}
            disabled={isFirstPage}
            onClick={() => onPageChange(1)}
            className="hidden sm:flex"
          />
        )}
        <Button
          variant="tonal"
          aria-label="Anterior"
          disabled={isFirstPage}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Anterior
        </Button>
        <span aria-live="polite" className="w-8 tabular-nums text-on-surface sm:w-12">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="tonal"
          aria-label="Próxima"
          disabled={isLastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Próxima
        </Button>
        {rich && (
          <Button
            variant="tonal"
            size="icon"
            aria-label="Última"
            icon={<ChevronsRight size={16} aria-hidden="true" />}
            disabled={isLastPage}
            onClick={() => onPageChange(totalPages)}
            className="hidden sm:flex"
          />
        )}
      </div>
    </nav>
  );
}
