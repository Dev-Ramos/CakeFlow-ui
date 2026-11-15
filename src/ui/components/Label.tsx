import type { ComponentProps } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../lib/cn";

export type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;

/** Rótulo de formulário do design system. Presentacional. */
export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn("text-label-md text-on-surface", className)}
      {...props}
    />
  );
}
