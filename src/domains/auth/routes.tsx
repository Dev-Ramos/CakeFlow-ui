/* eslint-disable react-refresh/only-export-components -- o domínio exporta suas rotas como elemento (composto em app/routes); as páginas são carregadas sob demanda */
import { lazy } from "react";
import { Route } from "react-router";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((modulo) => ({ default: modulo.LoginPage })),
);
const DefinirSenhaPage = lazy(() =>
  import("./pages/DefinirSenhaPage").then((modulo) => ({
    default: modulo.DefinirSenhaPage,
  })),
);

/** Rotas públicas do domínio de autenticação. */
export const authRoutes = (
  <>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/reset-password" element={<DefinirSenhaPage />} />
  </>
);
