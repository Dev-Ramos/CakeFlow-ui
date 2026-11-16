/* eslint-disable react-refresh/only-export-components -- o domínio exporta suas rotas como elemento (composto em app/routes); as páginas são carregadas sob demanda */
import { lazy } from "react";
import { Route } from "react-router";
import { RequirePermission } from "@/domains/auth/components/RequirePermission";

const UsersPage = lazy(() =>
  import("./pages/UsersPage").then((modulo) => ({ default: modulo.UsersPage })),
);
const RolesPage = lazy(() =>
  import("./pages/RolesPage").then((modulo) => ({ default: modulo.RolesPage })),
);
const RoleFormPage = lazy(() =>
  import("./pages/RoleFormPage").then((modulo) => ({ default: modulo.RoleFormPage })),
);

/** Rotas autenticadas de usuários e cargos, cada uma protegida pela permissão correspondente. */
export const userManagementRoutes = (
  <>
    <Route
      path="administracao/usuarios"
      element={
        <RequirePermission permission="users.index">
          <UsersPage />
        </RequirePermission>
      }
    />
    <Route
      path="administracao/cargos"
      element={
        <RequirePermission permission="roles.index">
          <RolesPage />
        </RequirePermission>
      }
    />
    <Route
      path="administracao/cargos/novo"
      element={
        <RequirePermission permission="roles.create">
          <RoleFormPage />
        </RequirePermission>
      }
    />
    <Route
      path="administracao/cargos/:id"
      element={
        <RequirePermission permission="roles.update">
          <RoleFormPage />
        </RequirePermission>
      }
    />
  </>
);
