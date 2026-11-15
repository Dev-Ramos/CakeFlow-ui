import { useContext } from "react";
import { ConfirmContext } from "./confirmContext";
import type { ConfirmContextValue } from "./types";

/**
 * Hook para confirmar ações destrutivas. Requer `ConfirmProvider` acima na árvore.
 * Devolve a função `confirm`, que retorna `Promise<boolean>`.
 */
export function useConfirm(): ConfirmContextValue["confirm"] {
  const ctx = useContext(ConfirmContext);
  if (ctx === null) {
    throw new Error("useConfirm deve ser usado dentro de <ConfirmProvider>");
  }
  return ctx.confirm;
}
