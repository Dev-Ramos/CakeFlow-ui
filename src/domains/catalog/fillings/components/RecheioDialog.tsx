import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormDialog } from "@/ui/components/form-dialog/FormDialog";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { toast } from "@/ui/toast/toast";
import { useCreateFilling, useUpdateFilling } from "../hooks/useFillings";
import { fillingSchema, type FillingFormData } from "../schemas/fillingSchema";
import type { Filling } from "../types/filling";

export interface RecheioDialogProps {
  /** Recheio em edição; ausente = novo. */
  recheio?: Filling;
  onClose: () => void;
}

/**
 * Modal de cadastro de recheio. Recheio só ativa depois de ter acréscimo definido em
 * Preços e acréscimos (`priced`): até lá o alternador "Ativo" fica travado.
 */
export function RecheioDialog({ recheio, onClose }: RecheioDialogProps) {
  const criando = recheio === undefined;
  const criar = useCreateFilling();
  const editar = useUpdateFilling();
  const semPreco = !recheio?.priced;

  const form = useForm<FillingFormData>({
    resolver: zodResolver(fillingSchema),
    defaultValues: {
      name: recheio?.name ?? "",
      description: recheio?.description ?? "",
      active: recheio?.active ?? false,
    },
  });

  async function salvar(dados: FillingFormData) {
    try {
      if (criando) await criar.mutateAsync(dados);
      else await editar.mutateAsync({ id: recheio.id, input: dados });
      toast.success(criando ? "Recheio criado." : "Recheio atualizado.");
      onClose();
    } catch {
      // O toast global de erro já informou a falha; o diálogo continua aberto.
    }
  }

  const titulo = criando ? "Novo recheio" : "Editar recheio";

  return (
    <FormDialog
      open
      onOpenChange={(aberto) => {
        if (!aberto) onClose();
      }}
      titulo={titulo}
      descricaoModal="O acréscimo do recheio é definido em Preços e acréscimos; só então ele pode ser ativado."
      confirmacaoDescarte={{
        titulo: "Descartar as alterações?",
        descricao: "Os dados preenchidos neste formulário serão perdidos.",
      }}
      isDirty={form.formState.isDirty}
      isSubmitting={form.formState.isSubmitting}
    >
      <Formulario form={form} label={titulo} className="mt-4" onSubmit={salvar}>
        <Formulario.Input name="name" label="Nome" required autoComplete="off" />
        <Formulario.Textarea name="description" label="Descrição" rows={3} />
        <Formulario.Toggle
          name="active"
          label="Ativo"
          onLabel="Sim"
          offLabel="Não"
          disabled={semPreco}
          descricao={semPreco ? "Defina o preço em Preços e acréscimos para poder ativar." : undefined}
        />
        <FormDialog.Actions submitLabel="Salvar" />
      </Formulario>
    </FormDialog>
  );
}
