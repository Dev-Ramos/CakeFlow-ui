import { cva, type VariantProps } from "class-variance-authority";

/**
 * Variantes visuais do design system (Artisanal Confectionery Workflow).
 *
 * Ponto único de estilo dos componentes de `ui/`: os componentes apenas
 * consomem estas definições. Cores e tipografia vêm de `tokens.css`.
 */

/** Estado desabilitado dos botões preenchidos/contornados (COMPONENTES.md §2). */
const desabilitado =
  "disabled:border disabled:border-outline-variant/50 disabled:bg-surface-variant disabled:text-outline disabled:shadow-none";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-lg text-label-lg",
    "transition-all active:scale-[0.98] cursor-pointer",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    "disabled:cursor-not-allowed disabled:active:scale-100",
  ],
  {
    variants: {
      variant: {
        /** Ação principal. */
        primary: [
          "bg-primary text-on-primary shadow-sm hover:bg-primary-container",
          desabilitado,
        ],
        /** Contorno. */
        secondary: [
          "border-2 border-primary bg-surface-container-lowest text-primary shadow-sm",
          "hover:bg-primary-fixed hover:text-on-primary-fixed",
          desabilitado,
        ],
        /** Tonal: ações de apoio e botões de paginação. */
        tonal: [
          "border border-outline-variant bg-surface-container text-primary",
          "hover:bg-surface-container-high",
          desabilitado,
        ],
        /** Ação crítica/destrutiva. */
        danger: ["bg-danger text-white shadow-sm hover:bg-danger-hover", desabilitado],
        /** Ações comerciais/operacionais (caramelo). */
        caramel: [
          "bg-brand-caramel text-white shadow-sm hover:bg-brand-caramel-hover",
          desabilitado,
        ],
        /** Terciário, sem fundo. */
        ghost: "bg-transparent text-ink-body hover:bg-ghost-hover disabled:text-outline",
        /** Neutro: cancelar em diálogos. */
        neutral: [
          "border border-outline-variant bg-surface-container-lowest text-on-surface-variant",
          "hover:bg-surface-container-low",
          desabilitado,
        ],
      },
      size: {
        md: "h-10 px-5",
        sm: "h-8 px-3 text-label-md",
        // Quadrado, para ação só-ícone (exige `aria-label`).
        icon: "h-10 w-10 shrink-0 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * Base visual de controles de campo (Input, Textarea, SelectNativo e triggers
 * de Select/Combobox/DatePicker). Layout (`block`/`flex`, largura, altura) fica
 * com cada componente. Erro é sinalizado somente por `aria-invalid`.
 */
export const controlBase = [
  "rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-2",
  "text-body-md text-on-surface placeholder:text-outline",
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
  "read-only:cursor-default read-only:bg-surface-container-low",
  "disabled:cursor-not-allowed disabled:border-outline-variant/60 disabled:bg-surface-variant/40 disabled:text-outline",
  "aria-invalid:border-error aria-invalid:bg-error-container/20 aria-invalid:focus:ring-error/20",
].join(" ");

/** Altura padrão de campos de linha única (42px). */
export const controlHeight = "h-[42px]";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-outline-variant bg-surface-container text-on-surface-variant",
        primary: "border-primary-fixed-dim bg-primary-fixed text-primary",
        success: "border-success-border bg-success-surface text-success-text",
        info: "border-info-border bg-info-surface text-info-text",
        warning: "border-oven-border bg-oven-surface text-oven-text",
        danger: "border-danger-border bg-danger-surface text-danger-text",
      },
      size: {
        sm: "px-2.5 py-1 text-label-sm",
        md: "px-3 py-1.5 text-label-md",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "sm",
    },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export const alertVariants = cva("flex items-start gap-3 rounded-lg border p-3", {
  variants: {
    tone: {
      info: "border-info-border bg-info-surface text-info-text",
      success: "border-success-border bg-success-surface text-success-text",
      warning: "border-oven-border bg-oven-surface text-oven-text",
      danger: "border-danger-border bg-danger-surface text-danger-text",
    },
  },
  defaultVariants: {
    tone: "info",
  },
});

export type AlertVariants = VariantProps<typeof alertVariants>;
