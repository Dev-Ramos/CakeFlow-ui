import { createContext } from "react";
import type { LoginDTO, Usuario } from "../types/auth";

/** `carregando`: há token salvo, mas ainda sem usuário para exibir (aguardando o `/me`). */
export type AuthStatus = "carregando" | "autenticado" | "anonimo";

export interface AuthContextValue {
  usuario: Usuario | null;
  status: AuthStatus;
  login: (dados: LoginDTO) => Promise<Usuario>;
  logout: () => void;
  /** Recarrega o usuário e as permissões do servidor (`GET /me`). */
  atualizarUsuario: () => Promise<void>;
  /** O usuário tem a permissão (ex.: `users.create`)? Só controla a UI; o servidor é quem autoriza. */
  can: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
