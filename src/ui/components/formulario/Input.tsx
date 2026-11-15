import type { ComponentProps, ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Field, fieldDescribedBy } from "../Field";
import { Input as InputBase } from "../Input";
import { useCampoFormulario } from "./contexto";

export interface FormularioInputProps<TCampos extends FieldValues>
  extends Omit<ComponentProps<"input">, "aria-describedby" | "id" | "name"> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  /** Classes do agrupamento (rótulo, controle e erro). */
  className?: string;
  /** Classes aplicadas somente ao input. */
  controlClassName?: string;
}

export function FormularioInput<TCampos extends FieldValues>({
  name,
  label,
  descricao,
  rules,
  id: idProp,
  className,
  controlClassName,
  required,
  onChange,
  onBlur,
  ...props
}: FormularioInputProps<TCampos>) {
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
      <InputBase
        id={id}
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
      />
    </Field>
  );
}
