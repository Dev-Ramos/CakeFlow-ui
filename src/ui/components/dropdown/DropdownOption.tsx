import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { DropdownMenuItem } from "../DropdownMenu";

export type DropdownOptionVariant = "default" | "danger";

const VARIANT_CLASSES: Record<DropdownOptionVariant, string> = {
  default: "",
  danger: "text-error data-highlighted:bg-danger-surface",
};

export interface DropdownOptionProps
  extends Omit<ComponentProps<typeof DropdownMenuItem>, "onSelect" | "onClick"> {
  icon?: ReactNode;
  variant?: DropdownOptionVariant;
  onClick?: (event: Event) => void;
}

/** Item acionável do `Dropdown`, com ícone e variante opcionais. */
export function DropdownOption({
  icon,
  variant = "default",
  className,
  onClick,
  children,
  ...props
}: DropdownOptionProps) {
  return (
    <DropdownMenuItem
      className={cn(VARIANT_CLASSES[variant], className)}
      onSelect={onClick}
      {...props}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      )}
      {children}
    </DropdownMenuItem>
  );
}
