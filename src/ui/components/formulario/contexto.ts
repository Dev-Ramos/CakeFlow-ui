import { useId } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { useFormContext } from "react-hook-form";

/** Estado compartilhado pelos campos de `Formulario` através do FormProvider. */
export function useCampoFormulario<TCampos extends FieldValues>(
  name: FieldPath<TCampos>,
  id?: string,
) {
  const form = useFormContext<TCampos>();
  const reactId = useId();
  const estado = form.getFieldState(name, form.formState);
  const erro = estado.error?.message;

  return {
    ...form,
    id: id ?? `form-${reactId}`,
    erro: typeof erro === "string" ? erro : undefined,
  };
}
