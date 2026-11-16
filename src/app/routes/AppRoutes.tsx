import { Suspense } from "react";
import { Route, Routes } from "react-router";
import { authRoutes } from "@/domains/auth/routes";
import { userManagementRoutes } from "@/domains/user-management/routes";
import { Card } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { LoadingState } from "@/ui/components/LoadingState";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { ProtectedRoute } from "./ProtectedRoute";

// Temporários: substituídos pelas rotas dos domínios (lazy por rota).
function Inicio() {
  return (
    <PageShell>
      <PageHeader title="Início" description="Visão geral do ateliê." />
      <Card>
        <p className="text-body-md text-on-surface-variant">Infraestrutura inicial pronta.</p>
      </Card>
    </PageShell>
  );
}

function EmConstrucao() {
  return (
    <PageShell>
      <PageHeader title="Em construção" />
      <Card padded={false}>
        <EmptyState
          title="Este módulo ainda não foi implementado."
          description="Ele aparecerá aqui quando o domínio correspondente for criado."
        />
      </Card>
    </PageShell>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState title="Carregando" className="min-h-screen" />}>
      <Routes>
        {/* Públicas */}
        <Route element={<AuthLayout />}>{authRoutes}</Route>

        {/* Autenticadas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Inicio />} />
            {userManagementRoutes}
            <Route path="*" element={<EmConstrucao />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
