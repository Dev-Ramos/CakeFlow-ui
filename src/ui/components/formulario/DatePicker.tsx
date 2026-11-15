import type { ReactNode } from "react";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { useController } from "react-hook-form";
import { DatePicker, type DatePickerIntervalo } from "../DatePicker";
import { Field } from "../Field";
import { useCampoFormulario } from "./contexto";

interface FormularioDatePickerPropsBase<TCampos extends FieldValues> {
  name: FieldPath<TCampos>;
  label: ReactNode;
  descricao?: ReactNode;
  rules?: RegisterOptions<TCampos, FieldPath<TCampos>>;
  id?: string;
  required?: boolean;
  placeholder?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  controlClassName?: string;
}

export type FormularioDatePickerProps<TCampos extends FieldValues> =
  FormularioDatePickerPropsBase<TCampos> & {
    /** `false`/ausente (padrão): uma data + horário. `true`: intervalo de datas, sem horário. */
    intervalo?: false;
  };

export type FormularioDatePickerIntervaloProps<TCampos extends FieldValues> =
  FormularioDatePickerPropsBase<TCampos> & { intervalo: true };

/**
 * Calendário (`DatePicker`) integrado ao RHF. O campo guarda `Date | null` no
 * modo único, ou `{ inicio, fim }` no modo `intervalo`.
 */
export function FormularioDatePicker<TCampos extends FieldValues>(
  props: FormularioDatePickerProps<TCampos> | FormularioDatePickerIntervaloProps<TCampos>,
) {
  const {
    name,
    label,
    descricao,
    rules,
    id: idProp,
    required,
    placeholder,
    allowEmpty,
    disabled,
    className,
    controlClassName,
    intervalo,
  } = props;
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
      {intervalo ? (
        <DatePicker
          id={id}
          intervalo
          value={(field.value as DatePickerIntervalo | undefined) ?? { inicio: null, fim: null }}
          onChange={field.onChange}
          placeholder={placeholder}
          allowEmpty={allowEmpty}
          disabled={disabled}
          error={Boolean(erro)}
          hasHint={Boolean(descricao)}
          className={controlClassName}
        />
      ) : (
        <DatePicker
          id={id}
          value={(field.value as Date | null | undefined) ?? null}
          onChange={field.onChange}
          placeholder={placeholder}
          allowEmpty={allowEmpty}
          disabled={disabled}
          error={Boolean(erro)}
          hasHint={Boolean(descricao)}
          className={controlClassName}
        />
      )}
    </Field>
  );
}
