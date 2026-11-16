import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/http/errors";
import {
  setAccessTokenGetter,
  setUnauthorizedHandler,
} from "@/services/http/interceptors";
import { toast } from "@/ui/toast/toast";
import { authApi } from "../api/authApi";
import { AuthContext, type AuthContextValue, type AuthStatus } from "../hooks/authContext";
import { tokenStorage } from "../storage/tokenStorage";
import { usuarioStorage } from "../storage/usuarioStorage";
import type { LoginDTO, Usuario } from "../types/auth";

/** O servidor recusou o token (expirado, revogado ou usuário inativo). */
function sessaoRecusada(erro: unknown) {
  return erro instanceof ApiError && (erro.status === 401 || erro.status === 403);
}

/**
 * Mantém o estado de autenticação.
 *
 * Ao carregar a página: se há token salvo, usa a cópia do usuário (quando existe)
 * para a aplicação aparecer na hora e revalida em seguida pelo `GET /me`, que
 * confirma que o acesso segue ativo e traz dados e permissões atualizados.
 * Não conhece regras de acesso de outros domínios.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Sessão salva, lida uma única vez na montagem.
  const [salva] = useState(() => {
    const token = tokenStorage.get();
    return token ? { token, usuario: usuarioStorage.get() } : null;
  });
  const tokenRef = useRef<string | null>(salva?.token ?? null);
  const [usuario, setUsuario] = useState<Usuario | null>(salva?.usuario ?? null);
  const [status, setStatus] = useState<AuthStatus>(
    !salva ? "anonimo" : salva.usuario ? "autenticado" : "carregando",
  );
  const temCopia = salva?.usuario != null;
  const temToken = salva !== null;

  const aplicarUsuario = useCallback((atual: Usuario) => {
    usuarioStorage.set(atual);
    setUsuario(atual);
    setStatus("autenticado");
  }, []);

  const encerrarSessao = useCallback(() => {
    tokenRef.current = null;
    tokenStorage.clear();
    usuarioStorage.clear();
    setUsuario(null);
    setStatus("anonimo");
    // Dados em cache pertencem ao usuário anterior.
    queryClient.clear();
  }, [queryClient]);

  // Liga o token e o tratamento de 401 à instância Axios.
  useEffect(() => {
    setAccessTokenGetter(() => tokenRef.current);
    setUnauthorizedHandler(() => {
      encerrarSessao();
      toast.warning("Sua sessão expirou. Entre novamente.");
    });
    return () => {
      setAccessTokenGetter(() => null);
      setUnauthorizedHandler(null);
    };
  }, [encerrarSessao]);

  // Logout em outra aba encerra a sessão aqui também.
  useEffect(
    () =>
      tokenStorage.subscribe((token) => {
        if (!token) encerrarSessao();
      }),
    [encerrarSessao],
  );

  // Revalida a sessão salva: confirma o acesso e atualiza dados e permissões.
  useEffect(() => {
    if (!temToken) return;
    let cancelado = false;
    authApi
      .me()
      .then((atual) => {
        // Se houve logout enquanto o /me estava em andamento, a resposta tardia
        // não pode ressuscitar a sessão.
        if (!cancelado && tokenRef.current) aplicarUsuario(atual);
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        // Sem cópia para exibir, ou acesso recusado: não há o que manter.
        if (!temCopia || sessaoRecusada(erro)) {
          encerrarSessao();
          return;
        }
        // Falha de rede/servidor com cópia salva: mantém a sessão e avisa.
        toast.warning("Não foi possível atualizar seus dados. Usando a última sessão salva.");
      });
    return () => {
      cancelado = true;
    };
  }, [temToken, temCopia, aplicarUsuario, encerrarSessao]);

  const login = useCallback(
    async (dados: LoginDTO) => {
      const { accessToken, usuario: autenticado } = await authApi.login(dados);
      tokenRef.current = accessToken;
      tokenStorage.set(accessToken);
      aplicarUsuario(autenticado);
      return autenticado;
    },
    [aplicarUsuario],
  );

  const atualizarUsuario = useCallback(async () => {
    const atual = await authApi.me();
    if (tokenRef.current) aplicarUsuario(atual);
  }, [aplicarUsuario]);

  const can = useCallback(
    (permission: string) => usuario?.permissions.includes(permission) ?? false,
    [usuario],
  );

  const valor = useMemo<AuthContextValue>(
    () => ({ usuario, status, login, logout: encerrarSessao, atualizarUsuario, can }),
    [usuario, status, login, encerrarSessao, atualizarUsuario, can],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
