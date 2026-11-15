import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { controlBase, controlHeight } from "../design-system/variants";
import { cn } from "../lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Seletor do design system sobre Radix Select. Trigger no padrão do Input,
 * conteúdo em portal. Não aceita `value=""` (limitação do Radix) — para opção
 * "Todos" use `SelectNativo`. Presentacional.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  disabled,
  ariaLabel,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-center justify-between",
          controlHeight,
          controlBase,
          "disabled:cursor-not-allowed data-placeholder:text-outline",
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={16} aria-hidden="true" className="text-on-surface-variant" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-60 min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-modal"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-body-md text-on-surface",
                  "outline-none data-highlighted:bg-surface-container",
                  "data-[state=checked]:bg-surface-container data-[state=checked]:font-medium data-[state=checked]:text-primary",
                )}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
