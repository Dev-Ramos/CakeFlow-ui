/** Referência resumida a um cargo, como vem embutida no usuário. */
export interface RoleRef {
  id: number;
  name: string;
}

/** Formato bruto devolvido por `/users` (index, show, create e update). */
export interface UserPayload {
  id: number;
  name: string;
  last_name: string;
  email: string;
  roles: RoleRef[];
  created_at: string;
}

/** Usuário, como o front o usa. */
export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  roles: RoleRef[];
  /** Data/hora ISO de criação. */
  createdAt: string;
}

/** Dados enviados ao criar ou editar um usuário. */
export interface UserInput {
  name: string;
  lastName: string;
  email: string;
  roleIds: number[];
}
