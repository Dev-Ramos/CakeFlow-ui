import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/cn";
import { Input } from "./Input";

export type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

/** Campo de senha com botão para mostrar/ocultar. Presentacional. */
export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visivel ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        disabled={disabled}
        onClick={() => setVisivel((atual) => !atual)}
        className={cn(
          "absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded",
          "text-tertiary hover:text-on-surface",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {visivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
