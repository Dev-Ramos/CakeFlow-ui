export type ConfirmTone = "danger" | "primary";

export interface ConfirmOptions {
  titulo: string;
  descricao?: string;
  confirmar?: string;
  cancelar?: string;
  tom?: ConfirmTone;
}

export interface ConfirmContextValue {
  /** Abre o diálogo e resolve `true` ao confirmar, `false` ao cancelar/fechar. */
  confirm: (opcoes: ConfirmOptions) => Promise<boolean>;
}
