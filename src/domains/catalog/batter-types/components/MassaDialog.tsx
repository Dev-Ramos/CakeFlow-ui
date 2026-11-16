import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormDialog } from "@/ui/components/form-dialog/FormDialog";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { toast } from "@/ui/toast/toast";
import { useCreateBatterType, useUpdateBatterType } from "../hooks/useBatterTypes";
import { batterTypeSchema, type BatterTypeFormData } from "../schemas/batterTypeSchema";
import type { BatterType } from "../types/batterType";

export interface MassaDialogProps {
  /** Massa em edição; ausente = nova. */
  massa?: BatterType;
  onClose: () => void;
}

/** Modal de cadastro de massa. Massas não têm preço: nascem ativas. */
export function MassaDialog({ massa, onClose }: MassaDialogProps) {
  const criando = massa === undefined;
  const criar = useCreateBatterType();
  const editar = useUpdateBatterType();

  const form = useForm<BatterTypeFormData>({
    resolver: zodResolver(batterTypeSchema),
    defaultValues: {
      name: massa?.name ?? "",
      description: massa?.description ?? "",
      active: massa?.active ?? true,
    },
  });

  async function salvar(dados: BatterTypeFormData) {
    try {
      if (criando) await criar.mutateAsync(dados);
      else await editar.mutateAsync({ id: massa.id, input: dados });
      toast.success(criando ? "Massa criada." : "Massa atualizada.");
      onClose();
    } catch {
      // O toast global de erro já informou a falha; o diálogo continua aberto.
    }
  }

  const titulo = criando ? "Nova massa" : "Editar massa";

  return (
    <FormDialog
      open
      onOpenChange={(aberto) => {
        if (!aberto) onClose();
      }}
      titulo={titulo}
      descricaoModal="Massas não têm preço: nascem ativas e podem ser usadas nas fichas técnicas."
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
        <Formulario.Toggle name="active" label="Ativo" onLabel="Sim" offLabel="Não" />
        <FormDialog.Actions submitLabel="Salvar" />
      </Formulario>
    </FormDialog>
  );
}
