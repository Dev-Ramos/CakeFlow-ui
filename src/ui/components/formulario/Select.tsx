import type { ComponentProps, ReactNode } from "react";
import { useController, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";
import { deTexto, paraTexto, type ValorDeOpcao } from "../../lib/valorDeOpcao";
import { Field, fieldDescribedBy } from "../Field";
import { SelectNativo } from "../SelectNativo";
import { useCampoFormulario } from "./contexto";

export interface FormularioOpcao {
  /** `string` ou `number`: o campo guarda o valor no tipo original da opção. */
  value: ValorDeOpcao;
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
  const { id, erro, control } = useCampoFormulario<TCampos>(name, idProp);
  const { field } = useController({ control, name, rules });

  // O DOM só entrega texto: volta ao tipo original (ex.: id numérico) da opção escolhida.
  const valorDoCampo = multiple
    ? (Array.isArray(field.value) ? (field.value as ValorDeOpcao[]) : []).map(paraTexto)
    : paraTexto(field.value as ValorDeOpcao | null | undefined);

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
        name={field.name}
        value={valorDoCampo}
        onChange={(event) => {
          field.onChange(
            multiple
              ? Array.from(event.target.selectedOptions, (o) => deTexto(options, o.value))
              : deTexto(options, event.target.value),
          );
          onChange?.(event);
        }}
        onBlur={(event) => {
          field.onBlur();
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

/** Select nativo integrado ao RHF. Valor: o `value` da opção, no tipo dela (use `value: ''` para "Todos"). */
export function FormularioSelect<TCampos extends FieldValues>(
  props: FormularioSelectProps<TCampos>,
) {
  return <SelectRHF<TCampos> {...props} multiple={false} />;
}

/** Select nativo múltiplo integrado ao RHF. Valor: lista com o `value` das opções, no tipo delas. */
export function FormularioSelectMulti<TCampos extends FieldValues>(
  props: FormularioSelectMultiProps<TCampos>,
) {
  return <SelectRHF<TCampos> {...props} multiple />;
}
