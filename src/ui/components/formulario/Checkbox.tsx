import type { ComponentProps, ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { cn } from "../../lib/cn";
import { Checkbox as CheckboxBase } from "../Checkbox";
import { FieldMessages, fieldDescribedBy } from "../Field";
import { useCampoFormulario } from "./contexto";

export interface FormularioCheckboxProps<TCampos extends FieldValues>
  extends Omit<ComponentProps<"input">, "aria-describedby" | "id" | "name" | "type"> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  className?: string;
  controlClassName?: string;
}

/** Checkbox integrado ao RHF. Valor: `boolean`. Rótulo ao lado, sem `Field`. */
export function FormularioCheckbox<TCampos extends FieldValues>({
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
}: FormularioCheckboxProps<TCampos>) {
  const { id, erro, register } = useCampoFormulario<TCampos>(name, idProp);
  const registro = register(name, rules);

  return (
    <div className={cn("space-y-1", className)}>
      <label className="flex items-center gap-2 text-body-md text-on-surface" htmlFor={id}>
        <CheckboxBase
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
        <span>{label}</span>
      </label>
      <FieldMessages id={id} hint={descricao} error={erro} />
    </div>
  );
}
