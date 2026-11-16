/* eslint-disable react-refresh/only-export-components -- o domínio exporta suas rotas como elemento (composto em app/routes); as páginas são carregadas sob demanda */
import { lazy } from "react";
import { Route } from "react-router";
import { RequirePermission } from "@/domains/auth/components/RequirePermission";

const PedidosPage = lazy(() => import("./pages/PedidosPage").then((m) => ({ default: m.PedidosPage })));
const PedidoDetalhePage = lazy(() =>
  import("./pages/PedidoDetalhePage").then((m) => ({ default: m.PedidoDetalhePage })),
);
const PedidoFormPage = lazy(() =>
  import("./pages/PedidoFormPage").then((m) => ({ default: m.PedidoFormPage })),
);
const SolicitacoesDeCancelamentoPage = lazy(() =>
  import("./pages/SolicitacoesDeCancelamentoPage").then((m) => ({
    default: m.SolicitacoesDeCancelamentoPage,
  })),
);

/** Rotas de pedidos e das solicitações de cancelamento, cada uma com a sua permissão. */
export const ordersRoutes = (
  <>
    <Route
      path="pedidos"
      element={
        <RequirePermission permission="orders.index">
          <PedidosPage />
        </RequirePermission>
      }
    />
    <Route
      path="pedidos/novo"
      element={
        <RequirePermission permission="orders.create">
          <PedidoFormPage />
        </RequirePermission>
      }
    />
    <Route
      path="pedidos/:id"
      element={
        <RequirePermission permission="orders.read">
          <PedidoDetalhePage />
        </RequirePermission>
      }
    />
    <Route
      path="pedidos/:id/editar"
      element={
        <RequirePermission permission="orders.update">
          <PedidoFormPage />
        </RequirePermission>
      }
    />
    <Route
      path="administracao/solicitacoes-de-cancelamento"
      element={
        <RequirePermission permission="orders.approve_cancel">
          <SolicitacoesDeCancelamentoPage />
        </RequirePermission>
      }
    />
  </>
);
