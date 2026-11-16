import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Alert } from "@/ui/components/Alert";
import { Badge } from "@/ui/components/Badge";
import { Card } from "@/ui/components/Card";
import { DataTable, type DataTableColumn } from "@/ui/components/DataTable";
import { Dropdown } from "@/ui/components/dropdown/Dropdown";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { Pagination } from "@/ui/components/Pagination";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { buttonVariants } from "@/ui/design-system/variants";
import { toast } from "@/ui/toast/toast";
import { useDeleteRole, useRoles } from "../hooks/useRoles";
import type { Role } from "../types/role";

const LIMITE_PADRAO = 10;

export function RolesPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const remover = useDeleteRole();

  const [page, setPage] = useState(1);

  // Paginação feita pela API: cada mudança de página ou de limite é uma nova consulta.
  const roles = useRoles({ page, limit: LIMITE_PADRAO });
  const linhas = roles.data?.data ?? [];
  const meta = roles.data?.meta;

  async function excluir(role: Role) {
    const confirmado = await confirm({
      titulo: `Excluir o cargo ${role.name}?`,
      descricao: "Quem tem este cargo perde as permissões dele. Esta ação não pode ser desfeita.",
      confirmar: "Excluir",
      tom: "danger",
    });
    if (!confirmado) return;
    remover.mutate(role.id, {
      onSuccess: () => {
        toast.success("Cargo excluído.");
        // Apagou o único item da última página: volta uma página para não ficar numa página vazia.
        if (linhas.length === 1 && page > 1) setPage(page - 1);
      },
    });
  }

  const columns: Array<DataTableColumn<Role>> = [
    {
      key: "name",
      header: "Cargo",
      alinhamento: "esquerda",
      sortAccessor: (role) => role.name,
      render: (role) => (
        <div className="min-w-0">
          <p className="truncate text-label-md text-on-surface">{role.name}</p>
          {role.description && (
            <p className="truncate text-body-sm text-tertiary">{role.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "permissions",
      header: "Permissões",
      sortAccessor: (role) => role.permissions.length,
      render: (role) => (
        <Badge tone="neutral">
          {role.permissions.length} {role.permissions.length === 1 ? "permissão" : "permissões"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      alinhamento: "direita",
      render: (role) => {
        const podeEditar = can("roles.update");
        const podeExcluir = can("roles.delete");
        if (!podeEditar && !podeExcluir) return null;
        return (
          <Dropdown>
            <Dropdown.Trigger aria-label={`Ações do cargo ${role.name}`} />
            <Dropdown.Content>
              {podeEditar && (
                <Dropdown.Option
                  icon={<Pencil size={16} />}
                  onClick={() => navigate(`/administracao/cargos/${role.id}`)}
                >
                  Editar
                </Dropdown.Option>
              )}
              {podeEditar && podeExcluir && <Dropdown.Separator />}
              {podeExcluir && (
                <Dropdown.Option
                  icon={<Trash2 size={16} />}
                  variant="danger"
                  onClick={() => void excluir(role)}
                >
                  Excluir
                </Dropdown.Option>
              )}
            </Dropdown.Content>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Cargos & Permissões"
        description="Defina o que cada cargo pode fazer no sistema."
        actions={
          can("roles.create") && (
            <Link to="/administracao/cargos/novo" className={buttonVariants()}>
              <Plus size={16} aria-hidden="true" />
              Novo cargo
            </Link>
          )
        }
      />

      {roles.isError && (
        <Alert tone="danger" title="Não foi possível carregar os cargos.">
          {roles.error.message}{" "}
          <button type="button" className="underline" onClick={() => void roles.refetch()}>
            Tentar novamente
          </button>
        </Alert>
      )}

      <Card padded={false} className="overflow-hidden">
        <DataTable
          caption="Cargos"
          columns={columns}
          rows={linhas}
          getRowKey={(role) => role.id}
          loading={roles.isLoading}
        />
        {meta && (
          <Pagination
            page={meta.page}
            limit={meta.limit}
            count={meta.count}
            pages={meta.pages}
            rotulo="cargos"
            onPageChange={setPage}
          />
        )}
      </Card>
    </PageShell>
  );
}
