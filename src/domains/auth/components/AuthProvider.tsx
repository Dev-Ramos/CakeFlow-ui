import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  setAccessTokenGetter,
  setUnauthorizedHandler,
} from "@/services/http/interceptors";
import { toast } from "@/ui/toast/toast";
import { authApi } from "../api/authApi";
import { tokenStorage } from "../storage/tokenStorage";
import { AuthContext, type AuthContextValue, type AuthStatus } from "../hooks/authContext";
import type { LoginDTO, Usuario } from "../types/auth";

/**
 * Mantém o estado de autenticação, liga o token à camada HTTP e restaura a
 * sessão ao carregar a página. Não conhece permissões de domínios.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Token salvo lido uma única vez, na montagem.
  const [tokenInicial] = useState(() => tokenStorage.get());
  const tokenRef = useRef<string | null>(tokenInicial);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [status, setStatus] = useState<AuthStatus>(tokenInicial ? "carregando" : "anonimo");

  const encerrarSessao = useCallback(() => {
    tokenRef.current = null;
    tokenStorage.clear();
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

  // Restaura a sessão a partir do token salvo.
  useEffect(() => {
    if (!tokenRef.current) return;
    let cancelado = false;
    authApi
      .me()
      .then((atual) => {
        if (cancelado) return;
        setUsuario(atual);
        setStatus("autenticado");
      })
      .catch(() => {
        if (!cancelado) encerrarSessao();
      });
    return () => {
      cancelado = true;
    };
  }, [encerrarSessao]);

  const login = useCallback(async (dados: LoginDTO) => {
    const resposta = await authApi.login(dados);
    tokenRef.current = resposta.accessToken;
    tokenStorage.set(resposta.accessToken);
    setUsuario(resposta.user);
    setStatus("autenticado");
    return resposta.user;
  }, []);

  const atualizarUsuario = useCallback(async () => {
    setUsuario(await authApi.me());
  }, []);

  const valor = useMemo<AuthContextValue>(
    () => ({ usuario, status, login, logout: encerrarSessao, atualizarUsuario }),
    [usuario, status, login, encerrarSessao, atualizarUsuario],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
