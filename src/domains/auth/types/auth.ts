/**
 * Contratos do domínio de autenticação.
 *
 * Os nomes dos campos seguem o que a API espera e devolve (inglês), mesmo com
 * as telas em português. Os nomes de campos de resposta e o caminho do
 * endpoint de definir senha ainda são hipótese até serem confirmados contra o
 * backend: ajustar apenas este arquivo e `api/authApi.ts`.
 */

export interface Usuario {
  id: number;
  name: string;
  email: string;
  role: string;
  /** Primeiro acesso (ou senha temporária): precisa definir a senha antes de usar o sistema. */
  mustChangePassword: boolean;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: Usuario;
}

/** Dados do convite exibidos na tela de definir senha (link enviado ao usuário). */
export interface ConviteInfo {
  name: string;
  email: string;
}

export interface DefinirSenhaDTO {
  /** Token do link de convite. Ausente na troca obrigatória feita já autenticado. */
  token?: string;
  password: string;
}
