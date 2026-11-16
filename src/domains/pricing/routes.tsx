/* eslint-disable react-refresh/only-export-components -- o domínio exporta suas rotas como elemento (composto em app/routes); as páginas são carregadas sob demanda */
import { lazy } from "react";
import { Route } from "react-router";
import { RequirePermission } from "@/domains/auth/components/RequirePermission";

const PrecosPage = lazy(() =>
  import("./pages/PrecosPage").then((modulo) => ({
    default: modulo.PrecosPage,
  })),
);

/** Preços e acréscimos (Administração): só quem tem `pricing.index`. */
export const pricingRoutes = (
  <Route
    path="administracao/precos"
    element={
      <RequirePermission permission="pricing.index">
        <PrecosPage />
      </RequirePermission>
    }
  />
);
