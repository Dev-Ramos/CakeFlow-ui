import { createContext, useContext } from "react";

const FormDialogContext = createContext<(() => void) | null>(null);

export const FormDialogProvider = FormDialogContext.Provider;

/** Solicita o fechamento pelo mesmo fluxo de confirmação de descarte do diálogo. */
export function useFecharFormDialog() {
  const fechar = useContext(FormDialogContext);
  if (!fechar) throw new Error("useFecharFormDialog deve ser usado dentro de FormDialog.");
  return fechar;
}
