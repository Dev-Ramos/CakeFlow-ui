import type { ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { useController } from "react-hook-form";
import { ComboboxMulti, type ComboboxMultiOption } from "../ComboboxMulti";
import { Field } from "../Field";
import { useCampoFormulario } from "./contexto";

export interface FormularioComboboxMultiProps<TCampos extends FieldValues> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  options: ComboboxMultiOption[];
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  controlClassName?: string;
  onChange?: (value: string[]) => void;
  onSearch?: (query: string) => void;
}

/** Seleção múltipla pesquisável integrada ao RHF. Valor: `string[]`. */
export function FormularioComboboxMulti<TCampos extends FieldValues>({
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
  disabled,
  className,
  controlClassName,
  onChange,
  onSearch,
}: FormularioComboboxMultiProps<TCampos>) {
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
      <ComboboxMulti
        id={id}
        options={options}
        // Campo ainda não inicializado vira lista vazia: "nada marcado", não "sem estado".
        value={Array.isArray(field.value) ? field.value.map(String) : []}
        onChange={(valores) => {
          field.onChange(valores);
          onChange?.(valores);
        }}
        onSearch={onSearch}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        loading={loading}
        disabled={disabled}
        error={Boolean(erro)}
        hasHint={Boolean(descricao)}
        className={controlClassName}
      />
    </Field>
  );
}
