import type { ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { useController } from "react-hook-form";
import { Combobox, type ComboboxOption } from "../Combobox";
import { Field } from "../Field";
import { useCampoFormulario } from "./contexto";

export interface FormularioComboboxProps<TCampos extends FieldValues> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  options: ComboboxOption[];
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
  value?: string | null;
  onChange?: (value: string | null) => void;
  onSearch?: (query: string) => void;
}

/**
 * Combobox pesquisável integrado ao RHF. Valor: `string` — `''` quando vazio
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
        // Normaliza ids numéricos recebidos da API para a mesma representação das opções.
        value={value ?? (field.value == null || field.value === "" ? null : String(field.value))}
        onChange={(novo) => {
          field.onChange(novo ?? "");
          onChange?.(novo);
        }}
        onSearch={onSearch}
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
