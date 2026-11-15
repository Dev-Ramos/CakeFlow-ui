import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./authContext";

/** Acesso ao usuário autenticado e às ações de sessão. Requer `AuthProvider` acima na árvore. */
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (contexto === null) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return contexto;
}
