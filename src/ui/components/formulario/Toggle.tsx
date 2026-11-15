import type { ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { useController } from "react-hook-form";
import { Info } from "lucide-react";
import { cn } from "../../lib/cn";
import { Field, fieldDescribedBy } from "../Field";
import { Toggle } from "../Toggle";
import { Tooltip } from "../Tooltip";
import { useCampoFormulario } from "./contexto";

export interface FormularioToggleProps<TCampos extends FieldValues> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  disabled?: boolean;
  className?: string;
  controlClassName?: string;
  /** Rótulo interno quando desligado. Default: "OFF". */
  offLabel?: ReactNode;
  /** Rótulo interno quando ligado. Default: "ON". */
  onLabel?: ReactNode;
  /**
   * Explicação do que a flag faz, num ícone de info ao lado do rótulo — só
   * aparece com hover/foco. Sem `tooltip`, nada é renderizado.
   */
  tooltip?: ReactNode;
}

/**
 * Toggle (switch) integrado ao RHF — controlado via `useController` (como o
 * `Combobox`), não `register`: o trilho não é um `<input>` nativo.
 * Valor: `boolean`.
 */
export function FormularioToggle<TCampos extends FieldValues>({
  name,
  label,
  descricao,
  rules,
  id: idProp,
  disabled,
  className,
  controlClassName,
  offLabel,
  onLabel,
  tooltip,
}: FormularioToggleProps<TCampos>) {
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
      className={className}
      labelAside={
        tooltip ? (
          <Tooltip content={tooltip}>
            <button
              type="button"
              aria-label="Mais informações"
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-outline",
                "hover:text-on-surface-variant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
            >
              <Info size={14} aria-hidden="true" />
            </button>
          </Tooltip>
        ) : undefined
      }
    >
      <Toggle
        id={id}
        checked={Boolean(field.value)}
        onCheckedChange={field.onChange}
        disabled={disabled}
        offLabel={offLabel}
        onLabel={onLabel}
        aria-invalid={erro ? true : undefined}
        aria-describedby={fieldDescribedBy(id, { hint: Boolean(descricao), error: Boolean(erro) })}
        className={controlClassName}
      />
    </Field>
  );
}
