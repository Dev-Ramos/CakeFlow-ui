/* eslint-disable react-refresh/only-export-components -- o domínio exporta suas rotas como elemento (composto em app/routes); as páginas são carregadas sob demanda */
import { lazy } from "react";
import { Route } from "react-router";

const MinhaContaPage = lazy(() =>
  import("./pages/MinhaContaPage").then((modulo) => ({ default: modulo.MinhaContaPage })),
);

/** Rotas autenticadas da conta do próprio usuário (sem permissão específica). */
export const accountRoutes = <Route path="minha-conta" element={<MinhaContaPage />} />;
