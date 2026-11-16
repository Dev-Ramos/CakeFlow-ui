import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { usePanSpecOptions } from "../../pan-specs/hooks/usePanSpecs";
import { paraNumero } from "../../shared/schemas/campos";
import {
  useCreateTechnicalSheet,
  useTechnicalSheet,
  useUpdateTechnicalSheet,
} from "../hooks/useTechnicalSheets";
import {
  technicalSheetSchema,
  UNIDADES_SUGERIDAS,
  type TechnicalSheetFormData,
} from "../schemas/technicalSheetSchema";
import type { TechnicalSheet, TechnicalSheetInput } from "../types/technicalSheet";

const LISTA = "/catalogo/fichas-tecnicas";

const texto = (valor: number | null | undefined) => (valor === null || valor === undefined ? "" : String(valor));

function paraInput(dados: TechnicalSheetFormData): TechnicalSheetInput {
  return {
    panSpecId: Number(dados.panSpecId),
    batterTypeId: Number(dados.batterTypeId),
    batterQuantityG: paraNumero(dados.batterQuantityG),
    bakeTempC: dados.bakeTempC.trim() === "" ? null : paraNumero(dados.bakeTempC),
    bakeTimeMin: dados.bakeTimeMin.trim() === "" ? null : paraNumero(dados.bakeTimeMin),
    notes: dados.notes,
    ingredients: dados.ingredients.map((ingrediente) => ({
      name: ingrediente.name.trim(),
      quantity: paraNumero(ingrediente.quantity),
      unit: ingrediente.unit.trim(),
    })),
  };
}

function FichaForm({ ficha }: { ficha?: TechnicalSheet }) {
  const editando = ficha !== undefined;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const criar = useCreateTechnicalSheet();
  const editar = useUpdateTechnicalSheet();

  const [buscaForma, setBuscaForma] = useState("");
  const [buscaMassa, setBuscaMassa] = useState("");
  const formas = usePanSpecOptions(useDebounce(buscaForma.trim()));
  const massas = useBatterTypeOptions(useDebounce(buscaMassa.trim()));

  const form = useForm<TechnicalSheetFormData>({
    resolver: zodResolver(technicalSheetSchema),
    defaultValues: {
      panSpecId: ficha?.panSpec.id ?? "",
      batterTypeId: ficha?.batterType.id ?? "",
      batterQuantityG: texto(ficha?.batterQuantityG),
      bakeTempC: texto(ficha?.bakeTempC),
      bakeTimeMin: texto(ficha?.bakeTimeMin),
      notes: ficha?.notes ?? "",
      ingredients: (ficha?.ingredients ?? []).map((i) => ({
        name: i.name,
        quantity: String(i.quantity),
        unit: i.unit,
      })),
    },
  });
  const ingredientes = useFieldArray({ control: form.control, name: "ingredients" });

  // Lidos na renderização de propósito: o RHF só rastreia o estado lido aqui.
  const { isDirty, isSubmitting } = form.formState;

  async function cancelar() {
    if (isDirty) {
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

  async function salvar(dados: TechnicalSheetFormData) {
    const input = paraInput(dados);
    try {
      if (editando) await editar.mutateAsync({ id: ficha.id, input });
      else await criar.mutateAsync(input);
      toast.success(editando ? "Ficha técnica atualizada." : "Ficha técnica criada.");
      navigate(LISTA);
    } catch {
      // O toast global de erro já informou a falha (ex.: combinação repetida, item inativo).
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={editando ? `Editar ficha: ${ficha.panSpec.name} com ${ficha.batterType.name}` : "Nova ficha técnica"}
        description="Uma ficha por combinação de forma e massa. Ao salvar, a lista de ingredientes é substituída por inteiro."
      />

      <Card>
        <Formulario form={form} label={editando ? "Editar ficha técnica" : "Nova ficha técnica"} onSubmit={salvar}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Formulario.Combobox
              name="panSpecId"
              label="Forma"
              required
              options={formas.data ?? []}
              selectedOption={ficha ? { value: ficha.panSpec.id, label: ficha.panSpec.name } : undefined}
              onSearch={setBuscaForma}
              loading={formas.isLoading}
              placeholder="Selecione a forma"
              searchPlaceholder="Buscar forma…"
              // A combinação não muda depois de criada: para outra, crie outra ficha.
              disabled={editando}
            />
            <Formulario.Combobox
              name="batterTypeId"
              label="Massa"
              required
              options={massas.data ?? []}
              selectedOption={ficha ? { value: ficha.batterType.id, label: ficha.batterType.name } : undefined}
              onSearch={setBuscaMassa}
              loading={massas.isLoading}
              placeholder="Selecione a massa"
              searchPlaceholder="Buscar massa…"
              disabled={editando}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Formulario.Input
              name="batterQuantityG"
              label="Massa (g)"
              required
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
            />
            <Formulario.Input
              name="bakeTempC"
              label="Temperatura (°C)"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
            />
            <Formulario.Input
              name="bakeTimeMin"
              label="Tempo de forno (min)"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
            />
          </div>

          <Formulario.Textarea name="notes" label="Observações" rows={3} />

          <div className="space-y-3">
            <div>
              <h2 className="text-headline-sm text-on-surface">Ingredientes</h2>
              <p className="text-body-sm text-tertiary">
                Unidades sugeridas: {UNIDADES_SUGERIDAS.join(", ")} (texto livre, até 20 caracteres).
              </p>
            </div>

            <datalist id="unidades-sugeridas">
              {UNIDADES_SUGERIDAS.map((unidade) => (
                <option key={unidade} value={unidade} />
              ))}
            </datalist>

            {ingredientes.fields.length === 0 && (
              <p className="text-body-md text-tertiary">Nenhum ingrediente adicionado.</p>
            )}

            {ingredientes.fields.map((campo, indice) => (
              <div
                key={campo.id}
                className="grid items-start gap-3 rounded-lg border border-outline-variant p-3 sm:grid-cols-[1fr_8rem_8rem_auto]"
              >
                <Formulario.Input
                  name={`ingredients.${indice}.name`}
                  label={`Ingrediente ${indice + 1}`}
                  autoComplete="off"
                />
                <Formulario.Input
                  name={`ingredients.${indice}.quantity`}
                  label={`Quantidade ${indice + 1}`}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                />
                <Formulario.Input
                  name={`ingredients.${indice}.unit`}
                  label={`Unidade ${indice + 1}`}
                  list="unidades-sugeridas"
                  maxLength={20}
                  autoComplete="off"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ingrediente ${indice + 1}`}
                  icon={<Trash2 size={18} />}
                  className="sm:mt-[26px]"
                  onClick={() => ingredientes.remove(indice)}
                />
              </div>
            ))}

            <Button
              variant="secondary"
              icon={<Plus size={16} />}
              onClick={() => ingredientes.append({ name: "", quantity: "", unit: "g" })}
            >
              Adicionar ingrediente
            </Button>
          </div>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <Button variant="neutral" onClick={() => void cancelar()}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editando ? "Salvar" : "Criar ficha"}
            </Button>
          </div>
        </Formulario>
      </Card>
    </PageShell>
  );
}

/** Criar (`/nova`) e editar (`/:id`) uma ficha técnica. */
export function FichaTecnicaFormPage() {
  const { id } = useParams();
  const fichaId = id === undefined ? undefined : Number(id);
  const ficha = useTechnicalSheet(fichaId);

  if (fichaId !== undefined) {
    if (ficha.isPending) return <LoadingState title="Carregando a ficha" className="py-16" />;
    if (ficha.isError) {
      return (
        <PageShell>
          <Alert tone="danger" title="Não foi possível carregar a ficha técnica.">
            {ficha.error.message}
          </Alert>
          <Link to={LISTA} className={cn(buttonVariants({ variant: "neutral" }))}>
            Voltar para as fichas
          </Link>
        </PageShell>
      );
    }
  }

  return <FichaForm key={fichaId ?? "nova"} ficha={ficha.data} />;
}
