import type { PermissionGroup, RolePayload } from "../types/role";
import type { UserPayload } from "../types/user";

export const permissoes = [
  { id: 1, key: "users.index", description: "Listar usuários" },
  { id: 2, key: "users.create", description: "Criar usuários" },
  { id: 3, key: "users.update", description: "Editar usuários" },
  { id: 4, key: "users.delete", description: "Excluir usuários" },
  { id: 5, key: "roles.index", description: "Listar cargos" },
  { id: 6, key: "roles.create", description: "Criar cargos" },
];

/** Resposta de `GET /permissions`: agrupada por recurso (mesmos ids de `permissoes`). */
export const catalogoDePermissoes: PermissionGroup[] = [
  {
    resource: "Usuários",
    permissions: [
      { id: 1, value: "Listar" },
      { id: 2, value: "Criar" },
      { id: 3, value: "Editar" },
      { id: 4, value: "Excluir" },
    ],
  },
  {
    resource: "Cargos",
    permissions: [
      { id: 5, value: "Listar" },
      { id: 6, value: "Criar" },
    ],
  },
];

export const cargoAdmin: RolePayload = {
  id: 1,
  name: "superadmin",
  description: "Acesso total",
  permissions: permissoes,
};

export const cargoBoleiro: RolePayload = {
  id: 2,
  name: "boleiro",
  description: null,
  permissions: [permissoes[0]],
};

/** O primeiro usuário é o mesmo da sessão de teste (id 2): serve para o caso "não excluir a si mesmo". */
export const usuariosPayload: UserPayload[] = [
  {
    id: 2,
    name: "Super",
    last_name: "Admin",
    email: "super@cakeflow.com.br",
    roles: [{ id: 1, name: "superadmin" }],
    created_at: "2026-01-10T12:00:00.000Z",
  },
  {
    id: 3,
    name: "Júlia",
    last_name: "Prado",
    email: "julia@cakeflow.com.br",
    roles: [{ id: 2, name: "boleiro" }],
    created_at: "2026-02-15T12:00:00.000Z",
  },
  {
    id: 4,
    name: "Marcos",
    last_name: "Lima",
    email: "marcos@cakeflow.com.br",
    roles: [],
    created_at: "2026-03-20T12:00:00.000Z",
  },
];

/**
 * Imita a paginação da API: lê `page` e `limit` da URL e devolve
 * `{ data, meta: { page, limit, count, pages } }`.
 */
export function paginar<T>(itens: T[], url: URL) {
  const page = Number(url.searchParams.get("page") ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? 10);
  const inicio = (page - 1) * limit;
  return {
    data: itens.slice(inicio, inicio + limit),
    meta: { page, limit, count: itens.length, pages: Math.max(1, Math.ceil(itens.length / limit)) },
  };
}

/** Todas as permissões de usuários e cargos que a interface verifica. */
export const TODAS = [
  "users.index",
  "users.create",
  "users.update",
  "users.delete",
  "roles.index",
  "roles.create",
  "roles.update",
  "roles.delete",
];
