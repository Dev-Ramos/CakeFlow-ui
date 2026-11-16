import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { LoadingState } from "@/ui/components/LoadingState";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { toast } from "@/ui/toast/toast";
import { PermissionMatrix } from "../components/PermissionMatrix";
import { usePermissions } from "../hooks/usePermissions";
import { useCreateRole, useRole, useUpdateRole } from "../hooks/useRoles";
import { roleSchema, type RoleFormData } from "../schemas/roleSchema";
import type { Role } from "../types/role";

const LISTA = "/administracao/cargos";

function RoleForm({ role }: { role?: Role }) {
  const editando = role !== undefined;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const catalogo = usePermissions();
  const criar = useCreateRole();
  const editar = useUpdateRole();

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionIds: role?.permissions.map((permission) => permission.id) ?? [],
    },
  });

  // Lidos na renderização de propósito: o React Hook Form só rastreia o estado que é lido aqui,
  // e `cancelar` (um handler) precisa do `isDirty` atualizado.
  const { isDirty, isSubmitting } = form.formState;

  async function cancelar() {
    if (isDirty) {
      const descartar = await confirm({
        titulo: "Descartar as alterações?",
        descricao: "Os dados preenchidos neste formulário serão perdidos.",
        confirmar: "Descartar",
        tom: "danger",
      });
      if (!descartar) return;
    }
    navigate(LISTA);
  }

  async function salvar(dados: RoleFormData) {
    try {
      if (editando) {
        await editar.mutateAsync({ id: role.id, input: dados });
        toast.success("Cargo atualizado.");
      } else {
        await criar.mutateAsync(dados);
        toast.success("Cargo criado.");
      }
      navigate(LISTA);
    } catch {
      // O toast global de erro das mutations já informou a falha.
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={editando ? `Editar cargo: ${role.name}` : "Novo cargo"}
        description="Dados do cargo e as permissões que ele concede."
      />

      <Card>
        <Formulario form={form} label={editando ? "Editar cargo" : "Novo cargo"} onSubmit={salvar}>
          <Formulario.Input name="name" label="Nome do cargo" required autoComplete="off" />
          <Formulario.Textarea
            name="description"
            label="Descrição"
            rows={3}
            descricao="Explique, em poucas palavras, para que serve este cargo."
          />

          <div className="space-y-3">
            <div>
              <h2 className="text-headline-sm text-on-surface">Permissões</h2>
              <p className="text-body-sm text-tertiary">
                Marque o que quem tem este cargo pode fazer em cada área.
              </p>
            </div>
            {catalogo.isLoading ? (
              <LoadingState title="Carregando permissões" />
            ) : catalogo.isError ? (
              <Alert tone="danger" title="Não foi possível carregar as permissões.">
                {catalogo.error.message}
              </Alert>
            ) : (
              <Controller
                control={form.control}
                name="permissionIds"
                render={({ field }) => (
                  <PermissionMatrix
                    grupos={catalogo.data ?? []}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <Button variant="neutral" onClick={() => void cancelar()}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editando ? "Salvar" : "Criar cargo"}
            </Button>
          </div>
        </Formulario>
      </Card>
    </PageShell>
  );
}

/** Criar (`/novo`) e editar (`/:id`) um cargo. */
export function RoleFormPage() {
  const { id } = useParams();
  const roleId = id === undefined ? undefined : Number(id);
  const role = useRole(roleId);

  if (roleId !== undefined) {
    if (role.isPending) return <LoadingState title="Carregando o cargo" className="py-16" />;
    if (role.isError) {
      return (
        <PageShell>
          <Alert tone="danger" title="Não foi possível carregar o cargo.">
            {role.error.message}
          </Alert>
          <Link to={LISTA} className={cn(buttonVariants({ variant: "neutral" }))}>
            Voltar para os cargos
          </Link>
        </PageShell>
      );
    }
  }

  return <RoleForm key={roleId ?? "novo"} role={role.data} />;
}
