import type { ComponentProps, ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Field, fieldDescribedBy } from "../Field";
import { PasswordInput } from "../PasswordInput";
import { useCampoFormulario } from "./contexto";

export interface FormularioPasswordProps<TCampos extends FieldValues>
  extends Omit<ComponentProps<"input">, "aria-describedby" | "id" | "name" | "type"> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  className?: string;
  controlClassName?: string;
}

/** Campo de senha (mostrar/ocultar) integrado ao RHF. Valor: `string`. */
export function FormularioPassword<TCampos extends FieldValues>({
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
}: FormularioPasswordProps<TCampos>) {
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
      <PasswordInput
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
