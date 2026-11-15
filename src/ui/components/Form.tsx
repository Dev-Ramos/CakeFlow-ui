import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

/**
 * Arranjo dos campos:
 * - `vertical` (padrão): empilhados, com respiro entre eles
 * - `inline`: em linha, alinhados pela base — barras de busca/filtro
 * - `nenhum`: o chamador controla tudo pelo `className`
 */
type LayoutForm = "vertical" | "inline" | "nenhum";

const LAYOUT_CLASSES: Record<LayoutForm, string> = {
  vertical: "space-y-4",
  inline: "flex flex-wrap items-end gap-3",
  nenhum: "",
};

export interface FormProps extends Omit<ComponentProps<"form">, "aria-label" | "noValidate"> {
  /**
   * Nome acessível do formulário (`aria-label`). Obrigatório: é como o leitor de
   * tela distingue dois formulários na mesma página — e como os testes o encontram.
   */
  label: string;
  layout?: LayoutForm;
}

/**
 * Formulário do design system (sem React Hook Form; para RHF use `Formulario`).
 *
 * Sempre `noValidate`: a validação é da aplicação (mensagens em pt-BR, no lugar
 * certo). Sem isso o browser dispara a bolha nativa antes do `onSubmit`.
 */
export function Form({ label, layout = "vertical", className, ...props }: FormProps) {
  return (
    <form
      aria-label={label}
      noValidate
      className={cn(LAYOUT_CLASSES[layout], className)}
      {...props}
    />
  );
}
