import type { ReactElement, ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "../Button";
import { DropdownMenuTrigger } from "../DropdownMenu";

export interface DropdownTriggerProps {
  children?: ReactElement;
  label?: string;
  icon?: ReactNode;
  "aria-label"?: string;
  disabled?: boolean;
}

/**
 * Gatilho do `Dropdown`: ou um elemento pronto via `children`, ou o botão padrão
 * do design system montado a partir de `label`/`icon`. Sempre `asChild` sobre o
 * Radix Trigger — não introduz nó de DOM extra. Sem props vira botão só-ícone
 * (⋮ "Mais ações").
 */
export function DropdownTrigger({
  children,
  label,
  icon,
  disabled,
  "aria-label": ariaLabel,
}: DropdownTriggerProps) {
  if (children) {
    return (
      <DropdownMenuTrigger asChild disabled={disabled}>
        {children}
      </DropdownMenuTrigger>
    );
  }

  return (
    <DropdownMenuTrigger asChild disabled={disabled}>
      <Button
        variant="ghost"
        size={label ? "md" : "icon"}
        icon={icon ?? <MoreVertical size={16} />}
        aria-label={label ? undefined : (ariaLabel ?? "Mais ações")}
        title={label ? undefined : "Mais ações"}
        disabled={disabled}
        className="data-[state=open]:bg-surface-container"
      >
        {label}
      </Button>
    </DropdownMenuTrigger>
  );
}
