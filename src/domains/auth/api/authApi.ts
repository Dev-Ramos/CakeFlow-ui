import { api } from "@/services/http/api";
import type {
  ConviteInfo,
  DefinirSenhaDTO,
  LoginDTO,
  LoginResponse,
  Usuario,
} from "../types/auth";

/**
 * CONTRATO PROVISÓRIO (ver `types/auth.ts`): endpoints e formatos são hipótese
 * até o backend definir o contrato real.
 */
export const authApi = {
  login: async (payload: LoginDTO): Promise<LoginResponse> => {
    // 401 aqui é "credenciais inválidas", não sessão expirada.
    const { data } = await api.post("/auth/login", payload, {
      skipUnauthorizedHandler: true,
    });
    return data;
  },

  me: async (): Promise<Usuario> => {
    // Quem chama decide o que fazer em caso de falha (ex.: restaurar sessão).
    const { data } = await api.get("/auth/me", { skipUnauthorizedHandler: true });
    return data;
  },

  validarConvite: async (token: string): Promise<ConviteInfo> => {
    const { data } = await api.get(`/auth/convites/${encodeURIComponent(token)}`, {
      skipUnauthorizedHandler: true,
    });
    return data;
  },

  definirSenha: async ({ token, senha }: DefinirSenhaDTO): Promise<void> => {
    await api.post(
      "/auth/definir-senha",
      { token, senha },
      // Com token de convite não há sessão: 401 não deve derrubar nada.
      { skipUnauthorizedHandler: token !== undefined },
    );
  },
};
