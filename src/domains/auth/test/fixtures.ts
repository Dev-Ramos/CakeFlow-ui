import { HttpResponse } from "msw";
import type { AuthPayload, Usuario } from "../types/auth";

/** Corpo de `POST /login` e `GET /me`, no formato bruto da API. */
export const payload: AuthPayload = {
  user: { id: 2, name: "Super", last_name: "Admin", email: "super@cakeflow.com.br" },
  roles: ["superadmin"],
  permissions: ["users.index", "users.create"],
};

/** O mesmo usuário, já no modelo do front. */
export const usuario: Usuario = {
  id: 2,
  name: "Super",
  lastName: "Admin",
  email: "super@cakeflow.com.br",
  roles: ["superadmin"],
  permissions: ["users.index", "users.create"],
};

/** Resposta de login: dados no corpo e token no header `Authorization`. */
export function respostaDeLogin(token = "token-abc", corpo: AuthPayload = payload) {
  return HttpResponse.json(corpo, { headers: { Authorization: `Bearer ${token}` } });
}
