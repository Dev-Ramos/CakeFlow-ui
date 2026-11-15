import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Ações da página (ex.: botão "Novo ..."), alinhadas à direita. */
  actions?: ReactNode;
  className?: string;
}

/** Cabeçalho de página: título (H1), descrição opcional e ações. Layout puro. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{title}</h1>
        {description && <p className="text-body-md text-tertiary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
