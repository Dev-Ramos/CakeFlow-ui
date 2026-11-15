import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "../Button";
import { useFecharFormDialog } from "./formDialogContext";

export interface FormDialogActionsProps {
  submitLabel: ReactNode;
  submitIcon?: ReactNode;
  cancelLabel?: ReactNode;
  /** Use somente quando o salvamento não é controlado pelo RHF. */
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Rodapé padrão de um formulário em diálogo: Cancelar protegido e submit com
 * estado do RHF. Deve ficar dentro do `<Formulario>`.
 */
export function FormDialogActions({
  submitLabel,
  submitIcon,
  cancelLabel = "Cancelar",
  loading,
  disabled,
}: FormDialogActionsProps) {
  const fechar = useFecharFormDialog();
  const { formState } = useFormContext();
  const carregando = loading ?? formState.isSubmitting;

  return (
    <div className="sticky bottom-0 flex justify-end gap-4 border-t border-outline-variant bg-surface-container-lowest p-2">
      <Button type="button" variant="neutral" onClick={fechar}>
        {cancelLabel}
      </Button>
      <Button type="submit" icon={submitIcon} loading={carregando} disabled={disabled || carregando}>
        {submitLabel}
      </Button>
    </div>
  );
}
