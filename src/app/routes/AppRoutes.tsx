import { Suspense } from "react";
import { Route, Routes } from "react-router";
import { Card } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { AppLayout } from "../layouts/AppLayout";

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
    <Suspense fallback={null}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Inicio />} />
          <Route path="*" element={<EmConstrucao />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
