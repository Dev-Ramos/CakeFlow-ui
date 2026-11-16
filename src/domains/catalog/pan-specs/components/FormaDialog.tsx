import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { FormDialog } from "@/ui/components/form-dialog/FormDialog";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { toast } from "@/ui/toast/toast";
import { paraNumero } from "../../shared/schemas/campos";
import { useCreatePanSpec, useUpdatePanSpec } from "../hooks/usePanSpecs";
import { FORMATOS, panSpecSchema, type PanSpecFormData } from "../schemas/panSpecSchema";
import type { PanSpec, PanSpecInput } from "../types/panSpec";

const texto = (valor: number | null | undefined) => (valor === null || valor === undefined ? "" : String(valor));

/** Só as medidas do formato escolhido seguem preenchidas; as demais vão nulas. */
function paraInput(dados: PanSpecFormData): PanSpecInput {
  const redonda = dados.shape === "round";
  const retangular = dados.shape === "rectangular";
  const quadrada = dados.shape === "square";
  return {
    name: dados.name,
    shape: dados.shape,
    diameterCm: redonda ? paraNumero(dados.diameterCm) : null,
    lengthCm: retangular ? paraNumero(dados.lengthCm) : null,
    widthCm: retangular ? paraNumero(dados.widthCm) : null,
    sideCm: quadrada ? paraNumero(dados.sideCm) : null,
    heightCm: paraNumero(dados.heightCm),
    servings: dados.servings.trim() === "" ? null : paraNumero(dados.servings),
    active: dados.active,
  };
}

export interface FormaDialogProps {
  /** Forma em edição; ausente = nova. */
  forma?: PanSpec;
  onClose: () => void;
}

/**
 * Modal de cadastro de forma: nome, formato, medidas do formato, altura e porções. A forma
 * só ativa depois de ter preço (`priced`): até lá o alternador "Ativa" fica travado.
 */
export function FormaDialog({ forma, onClose }: FormaDialogProps) {
  const criando = forma === undefined;
  const criar = useCreatePanSpec();
  const editar = useUpdatePanSpec();

  const form = useForm<PanSpecFormData>({
    resolver: zodResolver(panSpecSchema),
    defaultValues: {
      name: forma?.name ?? "",
      shape: forma?.shape ?? "round",
      diameterCm: texto(forma?.diameterCm),
      lengthCm: texto(forma?.lengthCm),
      widthCm: texto(forma?.widthCm),
      sideCm: texto(forma?.sideCm),
      heightCm: texto(forma?.heightCm),
      servings: texto(forma?.servings),
      active: forma?.active ?? false,
    },
  });
  const formato = useWatch({ control: form.control, name: "shape" });

  async function salvar(dados: PanSpecFormData) {
    const input = paraInput(dados);
    try {
      if (criando) await criar.mutateAsync(input);
      else await editar.mutateAsync({ id: forma.id, input });
      toast.success(criando ? "Forma criada." : "Forma atualizada.");
      onClose();
    } catch {
      // O toast global de erro já informou a falha; o diálogo continua aberto.
    }
  }

  const titulo = criando ? "Nova forma" : "Editar forma";
  const semPreco = !forma?.priced;

  return (
    <FormDialog
      open
      onOpenChange={(aberto) => {
        if (!aberto) onClose();
      }}
      titulo={titulo}
      descricaoModal="Formato, medidas e capacidade da forma. O preço é definido em Preços e acréscimos."
      confirmacaoDescarte={{
        titulo: "Descartar as alterações?",
        descricao: "Os dados preenchidos neste formulário serão perdidos.",
      }}
      isDirty={form.formState.isDirty}
      isSubmitting={form.formState.isSubmitting}
    >
      <Formulario form={form} label={titulo} className="mt-4" onSubmit={salvar}>
        <Formulario.Input name="name" label="Nome" required autoComplete="off" placeholder="Ex.: Redondo 20 cm" />
        <Formulario.Select name="shape" label="Formato" options={FORMATOS} />

        {formato === "round" && (
          <Formulario.Input
            name="diameterCm"
            label="Diâmetro (cm)"
            required
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
          />
        )}
        {formato === "rectangular" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Formulario.Input
              name="lengthCm"
              label="Comprimento (cm)"
              required
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
            />
            <Formulario.Input
              name="widthCm"
              label="Largura (cm)"
              required
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
            />
          </div>
        )}
        {formato === "square" && (
          <Formulario.Input
            name="sideCm"
            label="Lado (cm)"
            required
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Formulario.Input
            name="heightCm"
            label="Altura (cm)"
            required
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
          />
          <Formulario.Input
            name="servings"
            label="Porções estimadas"
            type="number"
            step="1"
            min="1"
            inputMode="numeric"
          />
        </div>

        <Formulario.Toggle
          name="active"
          label="Ativa"
          onLabel="Sim"
          offLabel="Não"
          disabled={semPreco}
          descricao={semPreco ? "Defina o preço em Preços e acréscimos para poder ativar." : undefined}
        />
        <FormDialog.Actions submitLabel="Salvar" />
      </Formulario>
    </FormDialog>
  );
}
