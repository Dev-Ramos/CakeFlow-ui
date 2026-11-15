import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { LoadingState } from "@/ui/components/LoadingState";

/**
 * Protege as rotas autenticadas:
 * - token salvo, mas sem usuário para exibir: mostra carregamento (aguardando o `/me`);
 * - sem sessão: vai para o login, lembrando a origem.
 */
export function ProtectedRoute() {
  const { status, usuario } = useAuth();
  const location = useLocation();

  if (status === "carregando") {
    return <LoadingState title="Carregando o ateliê" className="min-h-screen" />;
  }
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
