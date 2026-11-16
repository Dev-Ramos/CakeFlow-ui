import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Alert } from "@/ui/components/Alert";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { DataTable, type DataTableColumn } from "@/ui/components/DataTable";
import { Dropdown } from "@/ui/components/dropdown/Dropdown";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { Pagination } from "@/ui/components/Pagination";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { formatarDataCurta } from "@/ui/lib/calendario";
import { toast } from "@/ui/toast/toast";
import { UserFormDialog } from "../components/UserFormDialog";
import { useDeleteUser, useUsers } from "../hooks/useUsers";
import type { User } from "../types/user";

const LIMITE_PADRAO = 10;

/** `undefined` = diálogo fechado; `{}` = convidar; `{ user }` = editar. */
type Dialogo = { user?: User } | undefined;

function nomeCompleto(user: User) {
  return `${user.name} ${user.lastName}`.trim();
}

export function UsersPage() {
  const { usuario, can } = useAuth();
  const confirm = useConfirm();
  const remover = useDeleteUser();

  const [page, setPage] = useState(1);
  const [dialogo, setDialogo] = useState<Dialogo>(undefined);

  // Paginação feita pela API: cada mudança de página ou de limite é uma nova consulta.
  const users = useUsers({ page, limit: LIMITE_PADRAO });
  const linhas = users.data?.data ?? [];
  const meta = users.data?.meta;

  async function excluir(user: User) {
    const confirmado = await confirm({
      titulo: `Excluir ${nomeCompleto(user)}?`,
      descricao: "O acesso deste usuário será removido. Esta ação não pode ser desfeita.",
      confirmar: "Excluir",
      tom: "danger",
    });
    if (!confirmado) return;
    remover.mutate(user.id, {
      onSuccess: () => {
        toast.success("Usuário excluído.");
        // Apagou o único item da última página: volta uma página para não ficar numa página vazia.
        if (linhas.length === 1 && page > 1) setPage(page - 1);
      },
    });
  }

  const columns: Array<DataTableColumn<User>> = [
    {
      key: "name",
      header: "Colaborador",
      alinhamento: "esquerda",
      sortAccessor: (user) => nomeCompleto(user),
      render: (user) => (
        <div className="min-w-0">
          <p className="truncate text-label-md text-on-surface">{nomeCompleto(user)}</p>
          <p className="truncate text-body-sm text-tertiary">{user.email}</p>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Cargos",
      alinhamento: "esquerda",
      render: (user) =>
        user.roles.length === 0 ? (
          <span className="text-tertiary">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge key={role.id} tone="primary">
                {role.name}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      key: "createdAt",
      header: "Criado em",
      prioridade: "media",
      sortAccessor: (user) => user.createdAt,
      render: (user) => formatarDataCurta(new Date(user.createdAt)),
    },
    {
      key: "actions",
      header: "Ações",
      alinhamento: "direita",
      render: (user) => {
        const podeEditar = can("users.update");
        const podeExcluir = can("users.delete") && user.id !== usuario?.id;
        if (!podeEditar && !podeExcluir) return null;
        return (
          <Dropdown>
            <Dropdown.Trigger aria-label={`Ações de ${nomeCompleto(user)}`} />
            <Dropdown.Content>
              {podeEditar && (
                <Dropdown.Option icon={<Pencil size={16} />} onClick={() => setDialogo({ user })}>
                  Editar
                </Dropdown.Option>
              )}
              {podeEditar && podeExcluir && <Dropdown.Separator />}
              {podeExcluir && (
                <Dropdown.Option
                  icon={<Trash2 size={16} />}
                  variant="danger"
                  onClick={() => void excluir(user)}
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
        title="Equipe & Colaboradores"
        description="Gerencie os acessos da equipe do ateliê."
        actions={
          can("users.create") && (
            <Button icon={<UserPlus size={16} />} onClick={() => setDialogo({})}>
              Convidar usuário
            </Button>
          )
        }
      />

      {users.isError && (
        <Alert tone="danger" title="Não foi possível carregar os usuários.">
          {users.error.message}{" "}
          <button type="button" className="underline" onClick={() => void users.refetch()}>
            Tentar novamente
          </button>
        </Alert>
      )}

      <Card padded={false} className="overflow-hidden">
        <DataTable
          caption="Usuários"
          columns={columns}
          rows={linhas}
          getRowKey={(user) => user.id}
          loading={users.isLoading}
          colunasPorPrioridade
        />
        {meta && (
          <Pagination
            page={meta.page}
            limit={meta.limit}
            count={meta.count}
            pages={meta.pages}
            rotulo="colaboradores"
            onPageChange={setPage}
          />
        )}
      </Card>

      {dialogo && (
        <UserFormDialog
          key={dialogo.user?.id ?? "novo"}
          user={dialogo.user}
          onClose={() => setDialogo(undefined)}
        />
      )}
    </PageShell>
  );
}
