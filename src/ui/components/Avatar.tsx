import { useState } from "react";
import { cn } from "../lib/cn";
import { iniciais } from "../lib/iniciais";

export interface AvatarProps {
  /** Nome completo: gera as iniciais de reserva e o texto alternativo. */
  nome: string;
  /** URL da foto. Sem ela (ou se falhar ao carregar), mostra as iniciais. */
  src?: string | null;
  size?: "md" | "lg" | "xl";
  /** Quando o nome já aparece ao lado, o avatar é só decoração (some para leitores de tela). */
  decorativo?: boolean;
  className?: string;
}

const tamanhos = {
  md: "h-9 w-9 text-body-md",
  lg: "h-14 w-14 text-headline-sm",
  xl: "h-28 w-28 text-headline-lg",
};

/** Foto de perfil circular, com as iniciais como reserva. Presentacional. */
export function Avatar({ nome, src, size = "md", decorativo = false, className }: AvatarProps) {
  // Guarda qual URL falhou: ao trocar a foto, a nova tenta carregar de novo.
  const [falhou, setFalhou] = useState<string | null>(null);
  const mostrarFoto = Boolean(src) && falhou !== src;

  return (
    <span
      role={decorativo ? undefined : "img"}
      aria-label={decorativo ? undefined : `Foto de ${nome}`}
      aria-hidden={decorativo ? true : undefined}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-fixed-dim bg-primary-fixed font-bold text-primary",
        tamanhos[size],
        className,
      )}
    >
      {mostrarFoto ? (
        <img
          src={src as string}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFalhou(src ?? null)}
        />
      ) : (
        iniciais(nome)
      )}
    </span>
  );
}
