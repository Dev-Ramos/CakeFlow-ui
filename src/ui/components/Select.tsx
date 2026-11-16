import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { controlBase, controlHeight } from "../design-system/variants";
import { cn } from "../lib/cn";
import { paraTexto, type ValorDeOpcao } from "../lib/valorDeOpcao";

export interface SelectOption<V extends ValorDeOpcao = string> {
  value: V;
  label: string;
}

export interface SelectProps<V extends ValorDeOpcao = string> {
  value: V;
  /** Recebe o valor no tipo original da opção (número continua número). */
  onValueChange: (value: V) => void;
  options: SelectOption<V>[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** `md` (42px, padrão dos formulários) ou `sm` (32px, para barras e rodapés de tabela). */
  size?: "md" | "sm";
}

/**
 * Seletor do design system sobre Radix Select. Trigger no padrão do Input,
 * conteúdo em portal. Não aceita `value=""` (limitação do Radix) — para opção
 * "Todos" use `SelectNativo`. Presentacional.
 */
export function Select<V extends ValorDeOpcao = string>({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  disabled,
  ariaLabel,
  size = "md",
}: SelectProps<V>) {
  return (
    <SelectPrimitive.Root
      value={paraTexto(value)}
      // O Radix só entrega texto: volta ao tipo original da opção escolhida.
      onValueChange={(texto) => {
        const opcao = options.find((o) => paraTexto(o.value) === texto);
        if (opcao) onValueChange(opcao.value);
      }}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-center justify-between",
          controlHeight,
          controlBase,
          "disabled:cursor-not-allowed data-placeholder:text-outline",
          size === "sm" && "h-8 gap-1.5 px-2.5 py-0 text-label-md",
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
                value={paraTexto(option.value)}
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
