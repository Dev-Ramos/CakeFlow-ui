/**
 * Contratos do domínio de autenticação.
 *
 * ATENÇÃO — CONTRATO PROVISÓRIO: os nomes de campos e endpoints abaixo e em
 * `api/authApi.ts` são uma hipótese até o contrato real do backend ser
 * definido. Ajustar apenas estes dois arquivos quando ele chegar.
 */

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  /** Primeiro acesso (ou senha temporária): precisa definir a senha antes de usar o sistema. */
  precisaDefinirSenha: boolean;
}

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  usuario: Usuario;
}

/** Dados do convite exibidos na tela de definir senha (link enviado ao usuário). */
export interface ConviteInfo {
  nome: string;
  email: string;
}

export interface DefinirSenhaDTO {
  /** Token do link de convite. Ausente na troca obrigatória feita já autenticado. */
  token?: string;
  senha: string;
}
