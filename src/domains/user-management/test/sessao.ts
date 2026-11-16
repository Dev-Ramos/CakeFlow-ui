import { http, HttpResponse } from "msw";
import { tokenStorage } from "@/domains/auth/storage/tokenStorage";
import { usuarioStorage } from "@/domains/auth/storage/usuarioStorage";
import { payload, usuario } from "@/domains/auth/test/fixtures";
import { API } from "@/domains/auth/test/renderAuth";
import { server } from "@/test/server";

/** Deixa uma sessão salva (token + cópia) com as permissões informadas e o `/me` coerente. */
export function logarComo(permissions: string[]) {
  tokenStorage.set("token-teste");
  usuarioStorage.set({ ...usuario, permissions });
  server.use(http.get(`${API}/me`, () => HttpResponse.json({ ...payload, permissions })));
}

export function limparSessao() {
  tokenStorage.clear();
  usuarioStorage.clear();
}
