/* eslint-disable react-refresh/only-export-components -- o domínio exporta suas rotas como elemento (composto em app/routes); as páginas são carregadas sob demanda */
import { lazy } from "react";
import { Route } from "react-router";
import { RequirePermission } from "@/domains/auth/components/RequirePermission";

const ComponentesPage = lazy(() =>
  import("./pages/ComponentesPage").then((modulo) => ({ default: modulo.ComponentesPage })),
);
const FichasTecnicasPage = lazy(() =>
  import("./technical-sheets/pages/FichasTecnicasPage").then((modulo) => ({ default: modulo.FichasTecnicasPage })),
);
const FichaTecnicaFormPage = lazy(() =>
  import("./technical-sheets/pages/FichaTecnicaFormPage").then((modulo) => ({ default: modulo.FichaTecnicaFormPage })),
);
const TiposDeBoloPage = lazy(() =>
  import("./cake-types/pages/TiposDeBoloPage").then((modulo) => ({ default: modulo.TiposDeBoloPage })),
);
const TipoDeBoloFormPage = lazy(() =>
  import("./cake-types/pages/TipoDeBoloFormPage").then((modulo) => ({ default: modulo.TipoDeBoloFormPage })),
);

/** Rotas autenticadas do Catálogo, cada uma protegida pela permissão correspondente. */
export const catalogRoutes = (
  <>
    <Route
      path="catalogo/componentes"
      element={
        <RequirePermission permission={["pan_specs.index", "batter_types.index", "fillings.index"]}>
          <ComponentesPage />
        </RequirePermission>
      }
    />
    <Route
      path="catalogo/fichas-tecnicas"
      element={
        <RequirePermission permission="technical_sheets.index">
          <FichasTecnicasPage />
        </RequirePermission>
      }
    />
    <Route
      path="catalogo/fichas-tecnicas/nova"
      element={
        <RequirePermission permission="technical_sheets.create">
          <FichaTecnicaFormPage />
        </RequirePermission>
      }
    />
    <Route
      path="catalogo/fichas-tecnicas/:id"
      element={
        <RequirePermission permission="technical_sheets.update">
          <FichaTecnicaFormPage />
        </RequirePermission>
      }
    />
    <Route
      path="catalogo/tipos-de-bolo"
      element={
        <RequirePermission permission="cake_types.index">
          <TiposDeBoloPage />
        </RequirePermission>
      }
    />
    <Route
      path="catalogo/tipos-de-bolo/novo"
      element={
        <RequirePermission permission="cake_types.create">
          <TipoDeBoloFormPage />
        </RequirePermission>
      }
    />
    <Route
      path="catalogo/tipos-de-bolo/:id"
      element={
        <RequirePermission permission="cake_types.update">
          <TipoDeBoloFormPage />
        </RequirePermission>
      }
    />
  </>
);
