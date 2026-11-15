/* eslint-disable react-refresh/only-export-components -- compound component do design system. */
import type { ComponentProps, ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import type {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { cn } from "../../lib/cn";
import { FormularioCheckbox } from "./Checkbox";
import { FormularioCombobox } from "./Combobox";
import { FormularioComboboxMulti } from "./ComboboxMulti";
import { FormularioDatePicker } from "./DatePicker";
import { FormularioInput } from "./Input";
import { FormularioRadioBox } from "./RadioBox";
import { FormularioSelect, FormularioSelectMulti } from "./Select";
import { FormularioTextarea } from "./Textarea";
import { FormularioToggle } from "./Toggle";

type LayoutFormulario = "vertical" | "inline" | "nenhum";

const CLASSES_LAYOUT: Record<LayoutFormulario, string> = {
  vertical: "space-y-4",
  inline: "flex flex-wrap items-end gap-3",
  nenhum: "",
};

export interface FormularioProps<TCampos extends FieldValues>
  extends Omit<
    ComponentProps<"form">,
    "aria-label" | "noValidate" | "onInvalid" | "onSubmit"
  > {
  /** Instância retornada por useForm(), compartilhada com todos os campos filhos. */
  form: UseFormReturn<TCampos>;
  /** Nome acessível (`aria-label`) do `<form>`. Obrigatório. */
  label: string;
  onSubmit: SubmitHandler<TCampos>;
  onInvalid?: SubmitErrorHandler<TCampos>;
  layout?: LayoutFormulario;
  children: ReactNode;
}

function FormularioBase<TCampos extends FieldValues>({
  form,
  label,
  onSubmit,
  onInvalid,
  layout = "vertical",
  className,
  children,
  ...props
}: FormularioProps<TCampos>) {
  return (
    <FormProvider {...form}>
      <form
        aria-label={label}
        noValidate
        className={cn(CLASSES_LAYOUT[layout], className)}
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}

type FormularioComposto = typeof FormularioBase & {
  Input: typeof FormularioInput;
  Textarea: typeof FormularioTextarea;
  Select: typeof FormularioSelect;
  SelectMulti: typeof FormularioSelectMulti;
  RadioBox: typeof FormularioRadioBox;
  Checkbox: typeof FormularioCheckbox;
  Combobox: typeof FormularioCombobox;
  ComboboxMulti: typeof FormularioComboboxMulti;
  Toggle: typeof FormularioToggle;
  DatePicker: typeof FormularioDatePicker;
};

/**
 * Formulário composto integrado ao React Hook Form.
 * Os campos acessam a mesma instância de formulário pelo contexto interno,
 * então `control`/`register` não são passados por prop.
 *
 * Campo "vazio" de select/combobox é `''` (nunca `null`/`undefined`).
 */
export const Formulario = Object.assign(FormularioBase, {
  Input: FormularioInput,
  Textarea: FormularioTextarea,
  Select: FormularioSelect,
  SelectMulti: FormularioSelectMulti,
  RadioBox: FormularioRadioBox,
  Checkbox: FormularioCheckbox,
  Combobox: FormularioCombobox,
  ComboboxMulti: FormularioComboboxMulti,
  Toggle: FormularioToggle,
  DatePicker: FormularioDatePicker,
}) as FormularioComposto;
