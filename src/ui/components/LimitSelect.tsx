import { cn } from "../lib/cn";
import { Select } from "./Select";

const LIMITES_PADRAO = [10, 20, 50, 100];

export interface LimitSelectProps {
  /** Limite atual (itens por página). */
  value: number;
  onChange: (limit: number) => void;
  /** Opções oferecidas. O valor atual sempre aparece, mesmo que não esteja na lista. */
  limits?: number[];
  className?: string;
}

/**
 * Seletor de itens por página ("Exibir [10 por página]"), no padrão do rodapé
 * de tabela do design. Pode ser usado dentro do `Pagination` (`onLimitChange`)
 * ou sozinho, onde só o limite for necessário. Presentacional.
 */
export function LimitSelect({ value, onChange, limits = LIMITES_PADRAO, className }: LimitSelectProps) {
  const opcoes = limits.includes(value) ? limits : [...limits, value].sort((a, b) => a - b);

  return (
    <div className={cn("flex items-center gap-2 text-body-sm text-tertiary", className)}>
      <span aria-hidden="true">Exibir</span>
      <div className="w-36">
        <Select
          size="sm"
          ariaLabel="Itens por página"
          value={value}
          onValueChange={onChange}
          options={opcoes.map((limite) => ({
            value: limite,
            label: `${limite} por página`,
          }))}
        />
      </div>
    </div>
  );
}
