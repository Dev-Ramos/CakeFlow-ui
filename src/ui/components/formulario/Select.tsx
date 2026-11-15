import type { ComponentProps, ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Field, fieldDescribedBy } from "../Field";
import { SelectNativo } from "../SelectNativo";
import { useCampoFormulario } from "./contexto";

export interface FormularioOpcao {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface BaseSelectProps<TCampos extends FieldValues>
  extends Omit<
    ComponentProps<"select">,
    "aria-describedby" | "children" | "id" | "multiple" | "name"
  > {
  name: FieldPath<TCampos>;
  label: ReactNode;
  options: readonly FormularioOpcao[];
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  className?: string;
  controlClassName?: string;
}

export type FormularioSelectProps<TCampos extends FieldValues> = BaseSelectProps<TCampos>;
export type FormularioSelectMultiProps<TCampos extends FieldValues> = BaseSelectProps<TCampos>;

function SelectRHF<TCampos extends FieldValues>({
  multiple,
  name,
  label,
  options,
  descricao,
  rules,
  id: idProp,
  className,
  controlClassName,
  required,
  onChange,
  onBlur,
  ...props
}: BaseSelectProps<TCampos> & { multiple: boolean }) {
  const { id, erro, register } = useCampoFormulario<TCampos>(name, idProp);
  const registro = register(name, rules);

  return (
    <Field
      id={id}
      label={label}
      hint={descricao}
      error={erro}
      required={required}
      className={className}
    >
      <SelectNativo
        id={id}
        multiple={multiple}
        required={required}
        aria-invalid={erro ? true : undefined}
        aria-describedby={fieldDescribedBy(id, { hint: Boolean(descricao), error: Boolean(erro) })}
        className={controlClassName}
        {...props}
        {...registro}
        onChange={(event) => {
          void registro.onChange(event);
          onChange?.(event);
        }}
        onBlur={(event) => {
          void registro.onBlur(event);
          onBlur?.(event);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </SelectNativo>
    </Field>
  );
}

/** Select nativo integrado ao RHF. Valor: `string` (use `value: ''` para "Todos"). */
export function FormularioSelect<TCampos extends FieldValues>(
  props: FormularioSelectProps<TCampos>,
) {
  return <SelectRHF<TCampos> {...props} multiple={false} />;
}

/** Select nativo múltiplo integrado ao RHF. Valor: `string[]`. */
export function FormularioSelectMulti<TCampos extends FieldValues>(
  props: FormularioSelectMultiProps<TCampos>,
) {
  return <SelectRHF<TCampos> {...props} multiple />;
}
