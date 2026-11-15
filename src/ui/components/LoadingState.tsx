import { cn } from "../lib/cn";

export interface LoadingStateProps {
  title: string;
  description?: string;
  className?: string;
}

/** Estado de carregamento centralizado (spinner + texto). Presentacional. */
export function LoadingState({ title, description, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-4 border-surface-container-high border-t-primary"
      />
      <p className="text-headline-sm text-on-surface">{title}</p>
      {description && <p className="max-w-xs text-body-sm text-tertiary">{description}</p>}
    </div>
  );
}
