import { createContext } from "react";
import type { LoginDTO, Usuario } from "../types/auth";

/** `carregando`: restaurando a sessão a partir do token salvo. */
export type AuthStatus = "carregando" | "autenticado" | "anonimo";

export interface AuthContextValue {
  usuario: Usuario | null;
  status: AuthStatus;
  login: (dados: LoginDTO) => Promise<Usuario>;
  logout: () => void;
  /** Recarrega o usuário do servidor (ex.: após definir a senha). */
  atualizarUsuario: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
