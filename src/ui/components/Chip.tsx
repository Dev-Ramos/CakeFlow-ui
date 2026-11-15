import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export interface ChipProps extends Omit<ComponentProps<"button">, "type"> {
  /** Estado selecionado (`aria-pressed`). */
  selected?: boolean;
}

/** Chip de filtro em cápsula (alternância). Presentacional. */
export function Chip({ selected = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-md transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-ink bg-ink text-white"
          : "border-brand-line bg-brand-surface text-ink-body hover:bg-ghost-hover",
        className,
      )}
      {...props}
    />
  );
}
