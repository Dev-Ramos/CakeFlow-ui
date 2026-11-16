/** Permissão no formato `recurso.acao` (ex.: `users.create`). */
export interface Permission {
  id: number;
  key: string;
  description: string | null;
}

/** Uma permissão do catálogo (`GET /permissions`): `value` é o rótulo da ação. */
export interface PermissionItem {
  id: number;
  value: string;
}

/** Permissões de um recurso, como a rota as agrupa: `resource` é o título do card. */
export interface PermissionGroup {
  resource: string;
  permissions: PermissionItem[];
}

/** Formato bruto devolvido por `/roles` (index, show, create e update). */
export interface RolePayload {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

/** Cargo (role), como o front o usa. */
export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
}

/** Item da rota de options (`GET /roles/options`), para seletores. */
export interface RoleOption {
  value: number;
  label: string;
  hint: string | null;
}

/** Dados enviados ao criar ou editar um cargo. */
export interface RoleInput {
  name: string;
  description: string;
  permissionIds: number[];
}
