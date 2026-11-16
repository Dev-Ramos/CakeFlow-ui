import { formatarReais } from "../lib/dinheiro";
import { cn } from "../lib/cn";

export interface LinhaDeValor {
  rotulo: string;
  centavos: number;
  /** Total/subtotal: separado por uma linha e em destaque. */
  destaque?: boolean;
}

/** Lista de rótulo e valor em reais (`4500` → `R$ 45,00`). Presentacional. */
export function ResumoDeValores({ linhas, className }: { linhas: LinhaDeValor[]; className?: string }) {
  return (
    <dl className={cn("space-y-2 text-body-md", className)}>
      {linhas.map(({ rotulo, centavos, destaque }) => (
        <div
          key={rotulo}
          className={cn(
            "flex justify-between gap-4",
            destaque && "border-t border-outline-variant pt-2 text-on-surface",
          )}
        >
          <dt className={destaque ? "text-on-surface" : "text-on-surface-variant"}>{rotulo}</dt>
          <dd className={destaque ? "font-semibold text-primary" : "text-on-surface"}>
            {formatarReais(centavos)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
