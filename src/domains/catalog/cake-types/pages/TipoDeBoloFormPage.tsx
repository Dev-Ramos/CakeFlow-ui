import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { LoadingState } from "@/ui/components/LoadingState";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { useDebounce } from "@/ui/lib/useDebounce";
import { toast } from "@/ui/toast/toast";
import { useBatterTypeOptions } from "../../batter-types/hooks/useBatterTypes";
import { useFillingOptions } from "../../fillings/hooks/useFillings";
import { usePanSpecOptions } from "../../pan-specs/hooks/usePanSpecs";
import { ImagemDoTipo } from "../components/ImagemDoTipo";
import { useCakeType, useCreateCakeType, useUpdateCakeType } from "../hooks/useCakeTypes";
import {
  cakeTypeSchema,
  MAX_RECHEIOS_PADRAO,
  type CakeTypeFormData,
} from "../schemas/cakeTypeSchema";
import type { CakeType } from "../types/cakeType";

const LISTA = "/catalogo/tipos-de-bolo";

/** Item já escolhido que ficou inativo continua aparecendo (marcado), mas não dá para escolhê-lo de novo. */
const rotulo = (nome: string, ativo: boolean) => (ativo ? nome : `${nome} (inativo)`);

function TipoForm({ tipo }: { tipo?: CakeType }) {
  const editando = tipo !== undefined;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const criar = useCreateCakeType();
  const editar = useUpdateCakeType();

  const [imagem, setImagem] = useState<File | null>(null);
  const [removerImagem, setRemoverImagem] = useState(false);

  const [buscaForma, setBuscaForma] = useState("");
  const [buscaMassa, setBuscaMassa] = useState("");
  const [buscaRecheio, setBuscaRecheio] = useState("");
  const formas = usePanSpecOptions(useDebounce(buscaForma.trim()));
  const massas = useBatterTypeOptions(useDebounce(buscaMassa.trim()));
  const recheios = useFillingOptions(useDebounce(buscaRecheio.trim()));

  const form = useForm<CakeTypeFormData>({
    resolver: zodResolver(cakeTypeSchema),
    defaultValues: {
      name: tipo?.name ?? "",
      description: tipo?.description ?? "",
      defaultPanSpecId: tipo?.defaultPanSpec?.id ?? "",
      defaultBatterTypeId: tipo?.defaultBatterType?.id ?? "",
      defaultFillingIds: tipo?.defaultFillings.map((recheio) => recheio.id) ?? [],
      requiresDecoration: tipo?.requiresDecoration ?? false,
      requiresReinforcement: tipo?.requiresReinforcement ?? false,
      active: tipo?.active ?? true,
    },
  });

  // Lidos na renderização de propósito: o RHF só rastreia o estado lido aqui.
  const { isDirty, isSubmitting } = form.formState;
  const alterado = isDirty || imagem !== null || removerImagem;

  async function cancelar() {
    if (alterado) {
      const descartar = await confirm({
        titulo: "Descartar as alterações?",
        descricao: "Os dados preenchidos neste formulário serão perdidos.",
        confirmar: "Descartar",
        tom: "danger",
      });
      if (!descartar) return;
    }
    navigate(LISTA);
  }

  async function salvar(dados: CakeTypeFormData) {
    const input = {
      name: dados.name,
      description: dados.description,
      defaultPanSpecId: dados.defaultPanSpecId === "" ? null : Number(dados.defaultPanSpecId),
      defaultBatterTypeId: dados.defaultBatterTypeId === "" ? null : Number(dados.defaultBatterTypeId),
      defaultFillingIds: dados.defaultFillingIds,
      requiresDecoration: dados.requiresDecoration,
      requiresReinforcement: dados.requiresReinforcement,
      active: dados.active,
      image: imagem,
      removeImage: removerImagem,
    };
    try {
      if (editando) await editar.mutateAsync({ id: tipo.id, input });
      else await criar.mutateAsync(input);
      toast.success(editando ? "Tipo de bolo atualizado." : "Tipo de bolo criado.");
      navigate(LISTA);
    } catch {
      // O toast global de erro já informou a falha (ex.: nome repetido, imagem inválida).
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={editando ? `Editar tipo de bolo: ${tipo.name}` : "Novo tipo de bolo"}
        description="Formato e altura vêm da forma padrão. O tipo de bolo não tem preço."
      />

      <Card>
        <Formulario form={form} label={editando ? "Editar tipo de bolo" : "Novo tipo de bolo"} onSubmit={salvar}>
          <Formulario.Input name="name" label="Nome" required autoComplete="off" />
          <Formulario.Textarea name="description" label="Descrição" rows={3} />

          <ImagemDoTipo
            urlAtual={tipo?.imageUrl ?? null}
            arquivo={imagem}
            onArquivo={setImagem}
            removida={removerImagem}
            onRemovida={setRemoverImagem}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Formulario.Combobox
              name="defaultPanSpecId"
              label="Forma padrão"
              options={formas.data ?? []}
              selectedOption={
                tipo?.defaultPanSpec
                  ? {
                      value: tipo.defaultPanSpec.id,
                      label: rotulo(tipo.defaultPanSpec.name, tipo.defaultPanSpec.active),
                    }
                  : undefined
              }
              onSearch={setBuscaForma}
              loading={formas.isLoading}
              placeholder="Sem forma padrão"
              searchPlaceholder="Buscar forma…"
              allowEmpty
            />
            <Formulario.Combobox
              name="defaultBatterTypeId"
              label="Massa padrão"
              options={massas.data ?? []}
              selectedOption={
                tipo?.defaultBatterType
                  ? {
                      value: tipo.defaultBatterType.id,
                      label: rotulo(tipo.defaultBatterType.name, tipo.defaultBatterType.active),
                    }
                  : undefined
              }
              onSearch={setBuscaMassa}
              loading={massas.isLoading}
              placeholder="Sem massa padrão"
              searchPlaceholder="Buscar massa…"
              allowEmpty
            />
          </div>

          <Formulario.ComboboxMulti
            name="defaultFillingIds"
            label="Recheios padrão"
            descricao={`Até ${MAX_RECHEIOS_PADRAO} recheios.`}
            options={recheios.data ?? []}
            selectedOptions={tipo?.defaultFillings.map((recheio) => ({
              value: recheio.id,
              label: rotulo(recheio.name, recheio.active),
            }))}
            onSearch={setBuscaRecheio}
            loading={recheios.isLoading}
            placeholder="Selecione os recheios"
            searchPlaceholder="Buscar recheio…"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Formulario.Toggle name="requiresDecoration" label="Exige decoração" onLabel="Sim" offLabel="Não" />
            <Formulario.Toggle name="requiresReinforcement" label="Exige reforço" onLabel="Sim" offLabel="Não" />
            <Formulario.Toggle name="active" label="Ativo" onLabel="Sim" offLabel="Não" />
          </div>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <Button variant="neutral" onClick={() => void cancelar()}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editando ? "Salvar" : "Criar tipo de bolo"}
            </Button>
          </div>
        </Formulario>
      </Card>
    </PageShell>
  );
}

/** Criar (`/novo`) e editar (`/:id`) um tipo de bolo. */
export function TipoDeBoloFormPage() {
  const { id } = useParams();
  const tipoId = id === undefined ? undefined : Number(id);
  const tipo = useCakeType(tipoId);

  if (tipoId !== undefined) {
    if (tipo.isPending) return <LoadingState title="Carregando o tipo de bolo" className="py-16" />;
    if (tipo.isError) {
      return (
        <PageShell>
          <Alert tone="danger" title="Não foi possível carregar o tipo de bolo.">
            {tipo.error.message}
          </Alert>
          <Link to={LISTA} className={cn(buttonVariants({ variant: "neutral" }))}>
            Voltar para os tipos de bolo
          </Link>
        </PageShell>
      );
    }
  }

  return <TipoForm key={tipoId ?? "novo"} tipo={tipo.data} />;
}
