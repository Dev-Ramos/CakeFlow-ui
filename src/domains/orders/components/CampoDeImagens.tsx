import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { useController, useFormContext } from "react-hook-form";
import { Button } from "@/ui/components/Button";
import { FORMATOS_DE_IMAGEM, TAMANHO_MAXIMO_IMAGEM_MB, validarImagem } from "@/ui/lib/imagem";

interface Props {
  /** Campo do formulário: `File | null` (uma imagem) ou `File[]` (várias). */
  name: string;
  label: string;
  multiple?: boolean;
  /** Imagens que o bolo já tem (só exibição). */
  urlsAtuais?: string[];
  disabled?: boolean;
}

/** Miniatura de um arquivo escolhido, com a URL de prévia liberada ao sair da tela. */
function Previa({ arquivo, onRemover }: { arquivo: File; onRemover: () => void }) {
  const url = useMemo(() => URL.createObjectURL(arquivo), [arquivo]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-outline-variant">
      <img src={url} alt={`Nova imagem: ${arquivo.name}`} className="h-full w-full object-cover" />
      <button
        type="button"
        aria-label={`Remover ${arquivo.name}`}
        onClick={onRemover}
        className="absolute right-1 top-1 rounded-full bg-surface-container-lowest p-0.5 text-on-surface shadow-warm"
      >
        <X size={12} />
      </button>
    </div>
  );
}

/**
 * Escolha de imagem(ns) do bolo. Só guarda os arquivos no formulário; o envio (`POST /uploads`)
 * acontece ao salvar, então imagem escolhida e descartada nunca chega à API.
 */
export function CampoDeImagens({ name, label, multiple = false, urlsAtuais = [], disabled }: Props) {
  const { control } = useFormContext();
  const { field } = useController({ control, name });
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  const escolhidos: File[] = multiple
    ? ((field.value as File[]) ?? [])
    : field.value
      ? [field.value as File]
      : [];

  function aoEscolher(event: ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(event.target.files ?? []);
    event.target.value = "";
    const problema = novos.map(validarImagem).find((mensagem) => mensagem !== null) ?? null;
    setErro(problema);
    if (problema || novos.length === 0) return;
    field.onChange(multiple ? [...escolhidos, ...novos] : novos[0]);
  }

  function remover(arquivo: File) {
    field.onChange(multiple ? escolhidos.filter((a) => a !== arquivo) : null);
  }

  return (
    <div className="space-y-2">
      <span className="text-label-md text-on-surface">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {urlsAtuais.map((url) => (
          <img
            key={url}
            src={url}
            alt={`${label} atual`}
            className="h-20 w-20 rounded-lg border border-outline-variant object-cover"
          />
        ))}
        {escolhidos.map((arquivo) => (
          <Previa
            key={`${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`}
            arquivo={arquivo}
            onRemover={() => remover(arquivo)}
          />
        ))}
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={FORMATOS_DE_IMAGEM.join(",")}
          aria-label={label}
          className="sr-only"
          tabIndex={-1}
          onChange={aoEscolher}
        />
        <Button
          variant="secondary"
          icon={<ImagePlus size={16} />}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {multiple
            ? "Adicionar imagem"
            : urlsAtuais.length > 0 || escolhidos.length > 0
              ? "Trocar imagem"
              : "Escolher imagem"}
        </Button>
      </div>
      <p className="text-body-sm text-tertiary">JPG, PNG ou WebP, até {TAMANHO_MAXIMO_IMAGEM_MB} MB.</p>
      {erro && <p className="text-body-sm text-danger-text">{erro}</p>}
    </div>
  );
}
