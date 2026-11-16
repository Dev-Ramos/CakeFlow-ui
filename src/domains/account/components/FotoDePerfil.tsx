import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Camera, Trash2, Upload, X } from "lucide-react";
import type { Usuario } from "@/domains/auth/types/auth";
import { Alert } from "@/ui/components/Alert";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { FORMATOS_DE_IMAGEM, TAMANHO_MAXIMO_IMAGEM_MB, validarImagem } from "@/ui/lib/imagem";
import { toast } from "@/ui/toast/toast";
import { useEnviarFoto, useRemoverFoto } from "../hooks/useConta";

/**
 * Foto de perfil: escolhe a imagem, mostra a prévia no próprio avatar e só envia
 * quando o usuário confirma em "Salvar foto".
 */
export function FotoDePerfil({ usuario }: { usuario: Usuario }) {
  const confirm = useConfirm();
  const enviar = useEnviarFoto();
  const remover = useRemoverFoto();
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const nomeCompleto = `${usuario.name} ${usuario.lastName}`.trim();

  const previa = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo]);
  useEffect(
    () => () => {
      if (previa) URL.revokeObjectURL(previa);
    },
    [previa],
  );

  function aoEscolher(event: ChangeEvent<HTMLInputElement>) {
    const escolhido = event.target.files?.[0];
    // Limpa o input: escolher o mesmo arquivo de novo (após cancelar) volta a disparar o evento.
    event.target.value = "";
    if (!escolhido) return;

    const problema = validarImagem(escolhido);
    setErro(problema);
    setArquivo(problema ? null : escolhido);
  }

  function cancelar() {
    setArquivo(null);
    setErro(null);
  }

  function salvar() {
    if (!arquivo) return;
    enviar.mutate(arquivo, {
      onSuccess: () => {
        toast.success("Foto de perfil atualizada.");
        setArquivo(null);
      },
    });
  }

  async function removerFoto() {
    const ok = await confirm({
      titulo: "Remover a foto de perfil?",
      descricao: "Suas iniciais voltarão a aparecer no lugar da foto.",
      confirmar: "Remover",
      tom: "danger",
    });
    if (!ok) return;
    remover.mutate(undefined, { onSuccess: () => toast.success("Foto de perfil removida.") });
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <Avatar nome={nomeCompleto} src={previa ?? usuario.avatarUrl} size="xl" />

      <div className="min-w-0 space-y-3 text-center sm:text-left">
        <div>
          <h2 className="text-headline-sm text-on-surface">Foto de perfil</h2>
          <p className="text-body-sm text-tertiary">
            JPG, PNG ou WebP, até {TAMANHO_MAXIMO_IMAGEM_MB} MB.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={FORMATOS_DE_IMAGEM.join(",")}
          aria-label="Escolher foto de perfil"
          className="sr-only"
          tabIndex={-1}
          onChange={aoEscolher}
        />

        {arquivo ? (
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button icon={<Upload size={16} />} loading={enviar.isPending} onClick={salvar}>
              Salvar foto
            </Button>
            <Button
              variant="neutral"
              icon={<X size={16} />}
              disabled={enviar.isPending}
              onClick={cancelar}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              variant="secondary"
              icon={<Camera size={16} />}
              onClick={() => inputRef.current?.click()}
            >
              {usuario.avatarUrl ? "Trocar foto" : "Escolher foto"}
            </Button>
            {usuario.avatarUrl && (
              <Button
                variant="neutral"
                icon={<Trash2 size={16} />}
                loading={remover.isPending}
                onClick={() => void removerFoto()}
              >
                Remover
              </Button>
            )}
          </div>
        )}

        {erro && <Alert tone="danger">{erro}</Alert>}
      </div>
    </div>
  );
}
