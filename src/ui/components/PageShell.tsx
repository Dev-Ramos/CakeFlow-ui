import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

/**
 * Contêiner do conteúdo de uma página: largura máxima de 1600px, centralizado e
 * com espaçamento vertical entre as seções. O padding externo é do shell
 * (`AppLayout`). Layout puro.
 */
export function PageShell({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1600px] space-y-8", className)} {...props} />;
}
