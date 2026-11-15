/* eslint-disable react-refresh/only-export-components -- design system: exporta os helpers de id (fieldHintId/fieldErrorId/fieldDescribedBy) ao lado dos componentes, para controles customizados ligarem o mesmo aria-describedby */
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Label } from "./Label";
import type { InputProps } from "./Input";
import { Input } from "./Input";
import type { SelectNativoProps } from "./SelectNativo";
import { SelectNativo } from "./SelectNativo";

/**
 * Trilho de largura dos campos — evita larguras arbitrárias por tela.
 *
 * - `sm` — códigos e quantidades curtas
 * - `md` — padrão: a maioria dos filtros e campos
 * - `lg` — texto livre e buscas
 *
 * Larguras fora do trilho continuam possíveis via `className`.
 */
export type FieldSize = "sm" | "md" | "lg";

// `max-sm:w-full`: em celular o campo ocupa a largura disponível; a partir de
// `sm` volta à largura do trilho.
const LARGURA_POR_SIZE: Record<FieldSize, string> = {
  sm: "max-sm:w-full w-28",
  md: "max-sm:w-full w-48",
  lg: "max-sm:w-full w-64",
};

/** Id do parágrafo de dica de um Field (para `aria-describedby` do controle). */
export function fieldHintId(id: string): string {
  return `${id}-hint`;
}

/** Id do parágrafo de erro de um Field (para `aria-describedby` do controle). */
export function fieldErrorId(id: string): string {
  return `${id}-erro`;
}

/**
 * `aria-describedby` de um controle dentro de um Field: aponta para a dica e/ou
 * o erro quando existem. Controles customizados (Combobox, DatePicker) usam
 * este helper para ligar os mesmos ids.
 */
export function fieldDescribedBy(
  id: string,
  opts: { hint?: boolean; error?: boolean },
): string | undefined {
  return (
    [opts.hint ? fieldHintId(id) : null, opts.error ? fieldErrorId(id) : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

/** Dica e mensagem de erro de um campo, com os ids esperados pelo `aria-describedby`. */
export function FieldMessages({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: ReactNode;
  error?: string;
}) {
  return (
    <>
      {hint && (
        <p id={fieldHintId(id)} className="text-body-sm text-tertiary">
          {hint}
        </p>
      )}
      {error && (
        <p id={fieldErrorId(id)} className="text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Largura do campo pelo trilho do design system. Sem `size`, a largura fica com quem chama. */
  size?: FieldSize;
  className?: string;
  /** Elemento extra no canto direito da linha do rótulo (ex.: ícone de ajuda com tooltip). */
  labelAside?: ReactNode;
  children: ReactNode;
}

/**
 * Molécula genérica de formulário: rótulo + controle + dica/erro.
 * Presentacional — não decide validação, só exibe o estado recebido.
 *
 * A dica e o erro recebem ids derivados (`{id}-hint` / `{id}-erro`) para o
 * controle filho referenciá-los via `aria-describedby`.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  size,
  className,
  labelAside,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1", size && LARGURA_POR_SIZE[size], className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5">
          <Label htmlFor={id}>{label}</Label>
          {required && (
            <span className="text-error" aria-hidden="true">
              *
            </span>
          )}
        </div>
        {labelAside}
      </div>
      {children}
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

// Omit<'size'>: o <input> nativo tem um `size` numérico que ninguém usa aqui; o
// `size` do design system é o trilho sm/md/lg e precisa vencer.
export interface TextFieldProps extends Omit<InputProps, "size"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  size?: FieldSize;
}

/**
 * Campo de texto rotulado (uso fora do React Hook Form): Field + Input.
 *
 * Acessibilidade do estado de erro: o input inválido recebe `aria-invalid`
 * (que também ativa a borda de erro) e `aria-describedby` apontando para a
 * mensagem de erro (e dica, se houver).
 */
export function TextField({
  id,
  label,
  hint,
  error,
  required,
  size,
  className,
  ...props
}: TextFieldProps) {
  const describedBy = fieldDescribedBy(id, { hint: Boolean(hint), error: Boolean(error) });
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      size={size}
      className={className}
    >
      <Input
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
    </Field>
  );
}

// Mesmo motivo do TextField: o <select> nativo também tem um `size` numérico.
export interface SelectFieldProps extends Omit<SelectNativoProps, "size"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  size?: FieldSize;
}

/**
 * Select nativo rotulado (uso fora do React Hook Form): Field + SelectNativo.
 * As `<option>` vêm como children. `className` vai para o `Field` (largura).
 */
export function SelectField({
  id,
  label,
  hint,
  error,
  required,
  size,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const describedBy = fieldDescribedBy(id, { hint: Boolean(hint), error: Boolean(error) });
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      size={size}
      className={className}
    >
      <SelectNativo
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </SelectNativo>
    </Field>
  );
}
