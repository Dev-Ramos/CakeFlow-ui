import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export type CheckboxProps = Omit<ComponentProps<"input">, "type">;

/**
 * Caixa de seleção do design system: quadrado de borda hairline que, marcado
 * (ou indeterminado), vira `primary` com o ícone em branco. Presentacional.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded border border-outline bg-surface-container-lowest bg-center bg-no-repeat transition-colors",
        "checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary",
        // Ícones via variáveis de `index.css`. Propriedade arbitrária (e não `bg-[url(...)]`):
        // o tailwind-merge confundia o `bg-[url]` com cor e descartava o `bg-primary`,
        // deixando a caixa só com contorno.
        "checked:[background-image:var(--checkbox-check)]",
        "indeterminate:[background-image:var(--checkbox-dash)]",
        "hover:border-primary",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export interface CheckboxFieldProps extends CheckboxProps {
  /** Texto exibido à direita da caixa (o `<label>` envolve os dois). */
  label: ReactNode;
}

/**
 * Caixa de seleção rotulada: `<label>` envolvendo Checkbox + texto à direita.
 * Diferente do `Field` (rótulo acima do controle) porque a convenção de
 * checkbox é rótulo ao lado — clicar no texto alterna a caixa.
 */
export function CheckboxField({ label, className, ...props }: CheckboxFieldProps) {
  return (
    <label className={cn("flex items-center gap-2 text-body-md text-on-surface", className)}>
      <Checkbox {...props} />
      {label}
    </label>
  );
}
