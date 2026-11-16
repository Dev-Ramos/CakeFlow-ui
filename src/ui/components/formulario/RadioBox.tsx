import type { ReactNode } from "react";
import { useController, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";
import { cn } from "../../lib/cn";
import { mesmoValor, type ValorDeOpcao } from "../../lib/valorDeOpcao";
import { FieldMessages, fieldDescribedBy } from "../Field";
import { useCampoFormulario } from "./contexto";
import type { FormularioOpcao } from "./Select";

export interface FormularioRadioBoxProps<TCampos extends FieldValues> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  options: readonly FormularioOpcao[];
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  optionsClassName?: string;
  optionClassName?: string;
  controlClassName?: string;
}

/** Grupo de rádios integrado ao RHF. Valor: o `value` da opção, no tipo dela (`string` ou `number`). */
export function FormularioRadioBox<TCampos extends FieldValues>({
  name,
  label,
  options,
  descricao,
  rules,
  id: idProp,
  required,
  disabled,
  className,
  optionsClassName,
  optionClassName,
  controlClassName,
}: FormularioRadioBoxProps<TCampos>) {
  const { id, erro, control } = useCampoFormulario<TCampos>(name, idProp);
  const { field } = useController({ control, name, rules });

  return (
    <fieldset className={cn("space-y-1", className)}>
      <legend className="text-label-md text-on-surface">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-error">
            *
          </span>
        )}
      </legend>
      <div
        aria-describedby={fieldDescribedBy(id, { hint: Boolean(descricao), error: Boolean(erro) })}
        className={cn("flex flex-wrap gap-3", optionsClassName)}
      >
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn("flex items-center gap-2 text-body-md text-on-surface", optionClassName)}
            >
              <input
                id={optionId}
                type="radio"
                value={String(option.value)}
                name={field.name}
                checked={mesmoValor(field.value as ValorDeOpcao | null | undefined, option.value)}
                onChange={() => field.onChange(option.value)}
                onBlur={field.onBlur}
                disabled={disabled || option.disabled}
                required={required}
                aria-invalid={erro ? true : undefined}
                className={cn(
                  "h-4 w-4 shrink-0 border-outline-variant text-primary",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  controlClassName,
                )}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <FieldMessages id={id} hint={descricao} error={erro} />
    </fieldset>
  );
}
