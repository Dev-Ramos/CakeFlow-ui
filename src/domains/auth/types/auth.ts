/**
 * Contratos do domínio de autenticação.
 *
 * Os nomes dos campos seguem o que a API espera e devolve (inglês, snake_case
 * no JSON), mesmo com as telas em português. O mapeamento do formato da API
 * para o modelo do front acontece em `api/authApi.ts`.
 */

/** Formato bruto devolvido por `POST /login` e `GET /me`. */
export interface AuthPayload {
  user: {
    id: number;
    name: string;
    last_name: string;
    email: string;
  };
  roles: string[];
  /** Permissões no formato `recurso.acao` (ex.: `users.create`, `roles.index`). */
  permissions: string[];
}

/** Usuário autenticado, como o front o usa. */
export interface Usuario {
  id: number;
  name: string;
  lastName: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface LoginDTO {
  email: string;
  password: string;
}

/** Resultado do login: o token vem no header da resposta; os dados, no corpo. */
export interface LoginResultado {
  accessToken: string;
  usuario: Usuario;
}

/** Dados do convite exibidos na tela de definir senha (link enviado ao usuário). */
export interface ConviteInfo {
  name: string;
  email: string;
}

export interface DefinirSenhaDTO {
  /** Token do link de convite. */
  token: string;
  password: string;
}
