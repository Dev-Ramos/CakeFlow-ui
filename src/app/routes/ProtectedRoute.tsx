import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { LoadingState } from "@/ui/components/LoadingState";

/**
 * Protege as rotas autenticadas:
 * - restaurando a sessão: mostra carregamento;
 * - sem usuário: vai para o login, lembrando a origem;
 * - usuário com senha pendente (primeiro acesso): vai para definir a senha.
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
  if (usuario.mustChangePassword) {
    return <Navigate to="/definir-senha" replace />;
  }
  return <Outlet />;
}
