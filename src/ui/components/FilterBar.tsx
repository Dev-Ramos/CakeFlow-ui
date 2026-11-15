import { useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, FilterX, Search } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./Button";

export interface FilterBarProps {
  /** Campos principais do filtro. */
  children: ReactNode;
  className?: string;
  /** Mostra o botão "Limpar filtros" (com selo de `filtrosAtivos`). */
  onLimpar?: () => void;
  /** Quantidade de filtros **aplicados**. */
  filtrosAtivos?: number;
  /**
   * Apenas habilita o botão "Filtrar" (`type="submit"`): o envio acontece pelo
   * `<form>` pai, então a barra deve ficar dentro de um `<Formulario layout="nenhum">`.
   */
  onSubmitFilters?: () => void;
  /**
   * Filtros menos usados, recolhidos por padrão atrás de "Mostrar filtros
   * avançados". Ficam sempre montados (só escondidos): o valor digitado num campo
   * recolhido continua valendo ao filtrar.
   */
  avancados?: ReactNode;
  /** Classes do contêiner de `avancados`. */
  avancadosClassName?: string;
  /**
   * Descrição de cada filtro avançado **aplicado** (ex.: "Período 01/01–31/01").
   * Alimenta o resumo que continua visível com o painel recolhido — o que está
   * escondido nunca fica invisível.
   */
  avancadosAtivos?: string[];
}

/** Barra de filtros de listagem, com painel de filtros avançados recolhível. */
export function FilterBar({
  children,
  className,
  onLimpar,
  filtrosAtivos,
  onSubmitFilters,
  avancados,
  avancadosClassName,
  avancadosAtivos = [],
}: FilterBarProps) {
  const [avancadosAbertos, setAvancadosAbertos] = useState(false);
  const painelId = useId();
  const temFiltrosAtivos = (filtrosAtivos ?? 0) > 0;

  return (
    <div role="search" className={cn("flex w-full flex-wrap items-end gap-3", className)}>
      {children}
      {avancados ? (
        <>
          <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-dashed border-outline-variant pt-3">
            <p className="text-body-md text-on-surface-variant">
              Filtros avançados:{" "}
              <span className="font-medium text-on-surface">
                {avancadosAtivos.length === 0
                  ? "nenhum ativo"
                  : `${avancadosAtivos.length} ${avancadosAtivos.length === 1 ? "ativo" : "ativos"}`}
              </span>
              {avancadosAtivos.length > 0 ? ` · ${avancadosAtivos.join(" · ")}` : null}
            </p>
            <Button
              variant="ghost"
              aria-expanded={avancadosAbertos}
              aria-controls={painelId}
              icon={avancadosAbertos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              onClick={() => setAvancadosAbertos((aberto) => !aberto)}
            >
              {avancadosAbertos ? "Ocultar filtros avançados" : "Mostrar filtros avançados"}
            </Button>
          </div>
          <div
            id={painelId}
            className={cn(
              "grid w-full grid-cols-1 gap-3 md:grid-cols-6",
              avancadosClassName,
              !avancadosAbertos && "hidden",
            )}
          >
            {avancados}
          </div>
        </>
      ) : null}
      {temFiltrosAtivos && !onLimpar ? (
        <span aria-label={`${filtrosAtivos} filtros ativos`} className="sr-only">
          {filtrosAtivos}
        </span>
      ) : null}
      <div className="flex w-full justify-end gap-2 pt-2">
        {onLimpar ? (
          <Button
            variant="ghost"
            aria-label="Limpar filtros"
            icon={<FilterX size={16} aria-hidden="true" />}
            onClick={onLimpar}
            className="relative"
          >
            Limpar filtros
            {temFiltrosAtivos ? (
              <span
                aria-label={`${filtrosAtivos} filtros ativos`}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-body-sm text-on-primary"
              >
                {filtrosAtivos}
              </span>
            ) : null}
          </Button>
        ) : null}
        {onSubmitFilters ? (
          <Button type="submit" icon={<Search size={16} />} className="ml-3">
            Filtrar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
