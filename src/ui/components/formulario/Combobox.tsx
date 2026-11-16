import type { ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { useController } from "react-hook-form";
import { Combobox, type ComboboxOption } from "../Combobox";
import { Field } from "../Field";
import type { ValorDeOpcao } from "../../lib/valorDeOpcao";
import { useCampoFormulario } from "./contexto";

export interface FormularioComboboxProps<TCampos extends FieldValues> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  /** Valores `string | number`: o campo guarda o valor no tipo original da opção (id numérico fica número). */
  options: ComboboxOption<ValorDeOpcao>[];
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  controlClassName?: string;
  /** Valor externo opcional para controles derivados de `watch` (ex.: edição inicial). */
  value?: ValorDeOpcao | null;
  onChange?: (value: ValorDeOpcao | null) => void;
  onSearch?: (query: string) => void;
  /** Opção já escolhida, para mostrar o rótulo antes de vir numa busca server-side. */
  selectedOption?: ComboboxOption<ValorDeOpcao>;
}

/**
 * Combobox pesquisável integrado ao RHF. Valor: o `value` da opção, no tipo dela (`string` ou `number`) — `''` quando vazio
 * (nunca `null`/`undefined`, para manter o controle controlado).
 */
export function FormularioCombobox<TCampos extends FieldValues>({
  name,
  label,
  options,
  descricao,
  rules,
  id: idProp,
  required,
  placeholder,
  searchPlaceholder,
  loading,
  allowEmpty,
  disabled,
  className,
  controlClassName,
  value,
  onChange,
  onSearch,
  selectedOption,
}: FormularioComboboxProps<TCampos>) {
  const { control, getValues, id } = useCampoFormulario<TCampos>(name, idProp);
  const { field, fieldState } = useController({
    control,
    name,
    rules,
    defaultValue: getValues(name),
  });
  const erro = typeof fieldState.error?.message === "string" ? fieldState.error.message : undefined;

  return (
    <Field
      id={id}
      label={label}
      hint={descricao}
      error={erro}
      required={required}
      className={className}
    >
      <Combobox
        id={id}
        options={options}
        // O Combobox compara por texto, então `3` e `"3"` casam; vazio vira `null`.
        value={value ?? (field.value == null || field.value === "" ? null : (field.value as ValorDeOpcao))}
        onChange={(novo) => {
          field.onChange(novo ?? "");
          onChange?.(novo);
        }}
        onSearch={onSearch}
        selectedOption={selectedOption}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        loading={loading}
        allowEmpty={allowEmpty}
        disabled={disabled}
        error={Boolean(erro)}
        hasHint={Boolean(descricao)}
        className={controlClassName}
      />
    </Field>
  );
}
