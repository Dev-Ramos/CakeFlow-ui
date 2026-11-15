import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ToggleProps
  extends Omit<ComponentProps<"button">, "onChange" | "value" | "type"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  offLabel?: ReactNode;
  onLabel?: ReactNode;
}

/**
 * Toggle (switch): trilho em pílula com um círculo que desliza de um lado a
 * outro; o rótulo textual ("OFF"/"ON") ocupa o espaço livre do lado oposto.
 * Presentacional.
 *
 * Usa `role="switch"` + `aria-checked`; o rótulo visual interno é decorativo
 * (`aria-hidden`) — o nome acessível vem de `aria-label` ou do `<label>` externo.
 */
export function Toggle({
  checked = false,
  onCheckedChange,
  offLabel = "OFF",
  onLabel = "ON",
  className,
  disabled,
  ...props
}: ToggleProps) {
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-7 w-15 shrink-0 items-center rounded-full border border-outline-variant p-1",
        "transition-colors duration-300 ease-in-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-success" : "bg-surface-container",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center px-2",
          "text-[11px] font-bold uppercase tracking-wide transition-colors duration-300 ease-in-out",
          checked
            ? "justify-start text-on-primary"
            : "justify-end text-outline",
        )}
      >
        {checked ? onLabel : offLabel}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none z-10 inline-block h-6 w-6 rounded-full bg-surface-container-lowest shadow-sm",
          "transform transition-transform duration-300 ease-in-out",
          checked ? "translate-x-7" : "-translate-x-0.5",
        )}
      />
    </button>
  );
}
