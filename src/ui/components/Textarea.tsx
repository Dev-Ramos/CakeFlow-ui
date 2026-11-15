import type { ComponentProps } from "react";
import { controlBase } from "../design-system/variants";
import { cn } from "../lib/cn";

export type TextareaProps = ComponentProps<"textarea">;

/** Área de texto do design system. Presentacional. Espelha o `Input`. */
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn("block w-full resize-y", controlBase, className)}
      {...props}
    />
  );
}
