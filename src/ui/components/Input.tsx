import type { ComponentProps } from "react";
import { controlBase, controlHeight } from "../design-system/variants";
import { cn } from "../lib/cn";

export type InputProps = ComponentProps<"input">;

/** Campo de texto do design system. Presentacional. */
export function Input({ className, ...props }: InputProps) {
  return <input className={cn("block w-full", controlHeight, controlBase, className)} {...props} />;
}
