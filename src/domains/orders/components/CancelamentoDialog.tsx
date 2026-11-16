import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormDialog } from "@/ui/components/form-dialog/FormDialog";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { toast } from "@/ui/toast/toast";
import { useCancelOrder, useRequestCancel } from "../hooks/useOrders";

const schema = z.object({ description: z.string().trim().min(1, "Descreva o motivo do cancelamento.") });
type Dados = z.infer<typeof schema>;

interface Props {
  orderId: number;
  orderCode: string;
  /** `direto`: o Super Admin cancela na hora. `solicitar`: o atendente pede e o admin decide. */
  modo: "direto" | "solicitar";
  onClose: () => void;
}

/** Motivo do cancelamento (obrigatório nos dois modos, D14). */
export function CancelamentoDialog({ orderId, orderCode, modo, onClose }: Props) {
  const cancelar = useCancelOrder();
  const solicitar = useRequestCancel();
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: { description: "" } });
  const direto = modo === "direto";
  const titulo = direto ? `Cancelar ${orderCode}` : `Solicitar cancelamento de ${orderCode}`;

  async function enviar({ description }: Dados) {
    try {
      if (direto) await cancelar.mutateAsync({ id: orderId, description });
      else await solicitar.mutateAsync({ id: orderId, description });
      toast.success(direto ? "Pedido cancelado." : "Solicitação enviada para análise.");
      onClose();
    } catch {
      // O toast global já mostrou o motivo (ex.: bolo em decoração não pode ser cancelado).
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(aberto) => {
        if (!aberto) onClose();
      }}
      titulo={titulo}
      descricaoModal={
        direto
          ? "O pedido e os bolos serão cancelados. Esta ação não pode ser desfeita."
          : "A administração decide se o pedido será cancelado. Até lá, ele fica em análise."
      }
      confirmacaoDescarte={{
        titulo: "Descartar o texto?",
        descricao: "O motivo digitado será perdido.",
      }}
      isDirty={form.formState.isDirty}
      isSubmitting={form.formState.isSubmitting}
    >
      <Formulario form={form} label={titulo} className="mt-4" onSubmit={enviar}>
        <Formulario.Textarea name="description" label="Motivo" required rows={4} />
        <FormDialog.Actions submitLabel={direto ? "Cancelar pedido" : "Enviar solicitação"} />
      </Formulario>
    </FormDialog>
  );
}
