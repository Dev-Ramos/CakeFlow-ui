import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "../lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Ícone decorativo exibido acima do texto (`aria-hidden`). Default: `Inbox`. */
  icon?: ReactNode;
  /** Ação opcional (botão, link) exibida abaixo da descrição. */
  action?: ReactNode;
  className?: string;
}

/** Estado vazio: título, descrição e ação opcional, centralizados. Presentacional. */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-on-surface-variant",
        className,
      )}
    >
      <span aria-hidden="true" className="text-outline">
        {icon ?? <Inbox size={16} />}
      </span>
      <p className="text-headline-sm text-on-surface">{title}</p>
      {description && <p className="max-w-md text-body-md text-tertiary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
