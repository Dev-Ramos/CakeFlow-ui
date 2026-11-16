import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Cake, ImagePlus, Trash2, Undo2 } from "lucide-react";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { FORMATOS_DE_IMAGEM, TAMANHO_MAXIMO_IMAGEM_MB, validarImagem } from "@/ui/lib/imagem";

export interface ImagemDoTipoProps {
  /** Imagem que o tipo de bolo já tem (`image_url`). */
  urlAtual: string | null;
  /** Arquivo novo escolhido (ainda não enviado). */
  arquivo: File | null;
  onArquivo: (arquivo: File | null) => void;
  /** A imagem atual está marcada para remoção ao salvar. */
  removida: boolean;
  onRemovida: (removida: boolean) => void;
}

/**
 * Imagem do tipo de bolo: escolhe, pré-visualiza e marca para remover. Nada é enviado
 * aqui; o arquivo (`cake_type[image]`) e a remoção (`remove_image`) vão com o formulário.
 */
export function ImagemDoTipo({ urlAtual, arquivo, onArquivo, removida, onRemovida }: ImagemDoTipoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  const previa = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo]);
  useEffect(
    () => () => {
      if (previa) URL.revokeObjectURL(previa);
    },
    [previa],
  );

  const exibida = previa ?? (removida ? null : urlAtual);

  function aoEscolher(event: ChangeEvent<HTMLInputElement>) {
    const escolhido = event.target.files?.[0];
    // Limpa o input: escolher o mesmo arquivo de novo volta a disparar o evento.
    event.target.value = "";
    if (!escolhido) return;

    const problema = validarImagem(escolhido);
    setErro(problema);
    if (!problema) {
      onArquivo(escolhido);
      onRemovida(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-label-md text-on-surface">Imagem</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-28 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low text-outline">
          {exibida ? (
            <img src={exibida} alt="Imagem do tipo de bolo" className="h-full w-full object-cover" />
          ) : (
            <Cake size={32} aria-hidden="true" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-body-sm text-tertiary">
            JPG, PNG ou WebP, até {TAMANHO_MAXIMO_IMAGEM_MB} MB.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={FORMATOS_DE_IMAGEM.join(",")}
            aria-label="Escolher imagem do tipo de bolo"
            className="sr-only"
            tabIndex={-1}
            onChange={aoEscolher}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<ImagePlus size={16} />}
              onClick={() => inputRef.current?.click()}
            >
              {exibida ? "Trocar imagem" : "Escolher imagem"}
            </Button>
            {arquivo && (
              <Button
                variant="neutral"
                icon={<Undo2 size={16} />}
                onClick={() => {
                  onArquivo(null);
                  setErro(null);
                }}
              >
                Desfazer escolha
              </Button>
            )}
            {!arquivo && urlAtual && !removida && (
              <Button variant="neutral" icon={<Trash2 size={16} />} onClick={() => onRemovida(true)}>
                Remover imagem
              </Button>
            )}
            {!arquivo && removida && (
              <Button variant="neutral" icon={<Undo2 size={16} />} onClick={() => onRemovida(false)}>
                Manter imagem atual
              </Button>
            )}
          </div>
        </div>
      </div>
      {erro && <Alert tone="danger">{erro}</Alert>}
    </div>
  );
}
