import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { alertVariants, type AlertVariants } from "../design-system/variants";
import { cn } from "../lib/cn";

const ICONES: Record<NonNullable<AlertVariants["tone"]>, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export interface AlertProps extends Omit<ComponentProps<"div">, "title">, AlertVariants {
  title?: ReactNode;
}

/**
 * Aviso em linha. `danger` e `warning` usam `role="alert"` (anunciados na hora);
 * `info` e `success` usam `role="status"`. Presentacional.
 */
export function Alert({ tone = "info", title, className, children, ...props }: AlertProps) {
  const Icone = ICONES[tone ?? "info"];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <Icone size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0 space-y-0.5 text-body-sm">
        {title && <p className="text-label-md">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
