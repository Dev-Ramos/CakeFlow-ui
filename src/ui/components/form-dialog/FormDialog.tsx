/* eslint-disable react-refresh/only-export-components -- compound component do design system. */
import { useCallback, useEffect, useRef, type ReactElement } from "react";
import type { ConfirmOptions } from "../../confirm/types";
import { useConfirm } from "../../confirm/useConfirm";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../Dialog";
import { FormDialogActions } from "./FormDialogActions";
import { FormDialogProvider } from "./formDialogContext";

type ConfirmacaoDescarte = Pick<ConfirmOptions, "titulo" | "descricao">;

export interface FormDialogProps {
  /** Controla a visibilidade do diálogo. */
  open: boolean;
  /** Notifica o componente pai quando o diálogo deve abrir ou fechar. */
  onOpenChange: (open: boolean) => void;
  /** Título apresentado no formulário. */
  titulo: string;
  /** Descrição apresentada no formulário. */
  descricaoModal?: string;
  /** Dados apresentados na confirmação antes de descartar alterações. */
  confirmacaoDescarte: ConfirmacaoDescarte;
  /** Indica se o formulário possui alterações ainda não salvas. */
  isDirty: boolean;
  /**
   * Indica que o `onSubmit` está em andamento (`formState.isSubmitting`). Enquanto
   * estiver, pedidos de fechamento são ignorados: um `confirm` aberto de dentro do
   * submit é um `AlertDialog` do Radix e, ao fechar, propaga o evento para este
   * `Dialog` — que sem isso entende como "fechar" e emenda a confirmação de
   * descarte logo após a do próprio fluxo.
   */
  isSubmitting?: boolean;
  /** O próprio formulário (normalmente `Formulario`), incluindo suas ações. */
  children: ReactElement;
}

/**
 * Diálogo de formulário com proteção centralizada contra descarte de alterações.
 *
 * O formulário informa apenas se está sujo e fornece a ação de salvar. Todos os
 * caminhos de fechamento (Cancelar, ×, Esc e clique externo) passam pela mesma
 * confirmação de descarte. O conteúdo só é montado quando `open`, então o
 * formulário reinicia a cada abertura.
 */
function FormDialogBase({
  open,
  onOpenChange,
  titulo,
  descricaoModal,
  confirmacaoDescarte,
  isDirty,
  isSubmitting = false,
  children,
}: FormDialogProps) {
  const confirm = useConfirm();
  const isDirtyAtual = useRef(isDirty);
  const isSubmittingAtual = useRef(isSubmitting);
  const confirmandoDescarte = useRef(false);

  useEffect(() => {
    isDirtyAtual.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    isSubmittingAtual.current = isSubmitting;
  }, [isSubmitting]);

  const fechar = useCallback(() => {
    isDirtyAtual.current = false;
    onOpenChange(false);
  }, [onOpenChange]);

  const solicitarFechamento = useCallback(async () => {
    if (confirmandoDescarte.current) return;
    // Salvando: quem fecha é o próprio fluxo, ao terminar. Um pedido de fechamento
    // aqui vem do evento propagado por um AlertDialog aberto durante o submit.
    if (isSubmittingAtual.current) return;
    if (!isDirtyAtual.current) {
      fechar();
      return;
    }

    confirmandoDescarte.current = true;
    try {
      const descartar = await confirm({
        ...confirmacaoDescarte,
        tom: "danger",
        confirmar: "Descartar",
        cancelar: "Cancelar",
      });
      if (descartar) fechar();
    } finally {
      // O Radix pode propagar o evento que fechou o AlertDialog para o Dialog.
      // Libera a próxima tentativa apenas depois desse ciclo de eventos.
      setTimeout(() => {
        confirmandoDescarte.current = false;
      }, 0);
    }
  }, [confirm, confirmacaoDescarte, fechar]);

  function handleOpenChange(proximoAberto: boolean) {
    if (proximoAberto) {
      onOpenChange(true);
      return;
    }
    void solicitarFechamento();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {open ? (
        <DialogContent
          onPointerDownOutside={(event) => {
            event.preventDefault();
            void solicitarFechamento();
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            void solicitarFechamento();
          }}
        >
          <DialogTitle className="text-headline-md">{titulo}</DialogTitle>
          <DialogDescription>{descricaoModal}</DialogDescription>
          <FormDialogProvider value={() => void solicitarFechamento()}>
            {children}
          </FormDialogProvider>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

type FormDialogComposto = typeof FormDialogBase & {
  Actions: typeof FormDialogActions;
};

/** Shell de diálogo para um `Formulario` filho, com descarte de alterações centralizado. */
export const FormDialog = Object.assign(FormDialogBase, {
  Actions: FormDialogActions,
}) as FormDialogComposto;
