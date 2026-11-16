import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormDialog } from "@/ui/components/form-dialog/FormDialog";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { useDebounce } from "@/ui/lib/useDebounce";
import { toast } from "@/ui/toast/toast";
import { useRoleOptions } from "../hooks/useRoles";
import { useCreateUser, useUpdateUser } from "../hooks/useUsers";
import { userSchema, type UserFormData } from "../schemas/userSchema";
import type { User } from "../types/user";

export interface UserFormDialogProps {
  /** Usuário em edição; ausente = convidar um novo. */
  user?: User;
  onClose: () => void;
}

/**
 * Convite (criação) e edição de usuário. O componente só é montado enquanto o
 * diálogo está aberto, então o formulário já nasce com os valores certos.
 */
export function UserFormDialog({ user, onClose }: UserFormDialogProps) {
  const criando = user === undefined;
  const [busca, setBusca] = useState("");
  const termo = useDebounce(busca);
  const roles = useRoleOptions(termo);
  const criar = useCreateUser();
  const editar = useUpdateUser();
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      roleIds: user?.roles.map((role) => role.id) ?? [],
    },
  });

  // Cargos que o usuário já tem: dão o rótulo dos chips antes de virem numa busca.
  const cargosAtuais = (user?.roles ?? []).map((role) => ({
    value: role.id,
    label: role.name,
  }));

  async function salvar(dados: UserFormData) {
    const input = {
      name: dados.name,
      lastName: dados.lastName,
      email: dados.email,
      roleIds: dados.roleIds,
    };
    try {
      if (criando) {
        await criar.mutateAsync(input);
        toast.success(`Convite enviado para ${input.email}.`);
      } else {
        await editar.mutateAsync({ id: user.id, input });
        toast.success("Usuário atualizado.");
      }
      onClose();
    } catch {
      // O toast global de erro das mutations já informou a falha; o diálogo continua aberto.
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(aberto) => {
        if (!aberto) onClose();
      }}
      titulo={criando ? "Convidar usuário" : "Editar usuário"}
      descricaoModal={
        criando
          ? "Preencha os dados e escolha os cargos de quem vai receber o acesso."
          : "Altere os dados ou os cargos deste usuário."
      }
      confirmacaoDescarte={{
        titulo: "Descartar as alterações?",
        descricao: "Os dados preenchidos neste formulário serão perdidos.",
      }}
      isDirty={form.formState.isDirty}
      isSubmitting={form.formState.isSubmitting}
    >
      <Formulario
        form={form}
        label={criando ? "Convidar usuário" : "Editar usuário"}
        className="mt-4"
        onSubmit={salvar}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Formulario.Input name="name" label="Nome" required autoComplete="off" />
          <Formulario.Input name="lastName" label="Sobrenome" required autoComplete="off" />
        </div>
        <Formulario.Input name="email" label="E-mail" type="email" required autoComplete="off" />
        <Formulario.ComboboxMulti
          name="roleIds"
          label="Cargos"
          required
          options={roles.data ?? []}
          selectedOptions={cargosAtuais}
          onSearch={setBusca}
          loading={roles.isLoading || busca !== termo || roles.isPlaceholderData}
          placeholder="Selecione os cargos"
        />
        <FormDialog.Actions submitLabel={criando ? "Convidar" : "Salvar"} />
      </Formulario>
    </FormDialog>
  );
}
