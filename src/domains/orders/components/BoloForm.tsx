import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { cakeTypesApi } from "@/domains/catalog/cake-types/api/cakeTypesApi";
import { useBatterTypeOptions } from "@/domains/catalog/batter-types/hooks/useBatterTypes";
import { useFillingOptions } from "@/domains/catalog/fillings/hooks/useFillings";
import { usePanSpecOptions } from "@/domains/catalog/pan-specs/hooks/usePanSpecs";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { CampoDeBusca, CampoDeBuscaMulti } from "@/ui/components/formulario/CamposDeBusca";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { useCakeTypeOptions } from "../hooks/useOrders";
import { ANDAR_NOVO } from "../lib/pedidoForm";
import { bloqueiosDoBolo } from "../lib/status";
import { MAX_ANDARES, MAX_CAMADAS, TIPOS_DE_DECORACAO, type OrderFormData } from "../schemas/orderSchema";
import type { OrderItem } from "../types/order";
import { CampoDeImagens } from "./CampoDeImagens";

const CAMADAS = Array.from({ length: MAX_CAMADAS }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} ${i === 0 ? "camada" : "camadas"}`,
}));

interface Props {
  indice: number;
  /** Bolo já salvo (edição): define o que está travado. Ausente = bolo novo, tudo livre. */
  salvo?: OrderItem;
  /** Pode tirar este bolo do pedido (há mais de um e a produção ainda não começou). */
  podeRemover: boolean;
  onRemover: () => void;
}

/** Cartão de um bolo do pedido: modelo, decoração, andares (forma, massa, camadas, recheios). */
export function BoloForm({ indice, salvo, podeRemover, onRemover }: Props) {
  const { watch, setValue, getValues } = useFormContext<OrderFormData>();
  const prefixo = `items.${indice}` as const;
  const andares = useFieldArray<OrderFormData>({ name: `${prefixo}.tiers` });
  const comDecoracao = watch(`${prefixo}.hasDecoration`);
  const imagemAtual = watch(`${prefixo}.referenceImageUrl`);
  const bloqueio = bloqueiosDoBolo(salvo);

  /**
   * Escolheu um tipo de bolo: a API não copia os padrões, então o formulário os traz (se o
   * usuário puder ler o tipo). Só preenche o que ainda está em branco, sem apagar o que ele digitou.
   */
  async function aplicarPadroes(valor: number | string | null) {
    if (typeof valor !== "number") return;
    try {
      const tipo = await cakeTypesApi.get(valor);
      setValue(`${prefixo}.hasDecoration`, tipo.requiresDecoration || getValues(`${prefixo}.hasDecoration`));
      setValue(
        `${prefixo}.hasReinforcement`,
        tipo.requiresReinforcement || getValues(`${prefixo}.hasReinforcement`),
      );
      const primeiro = getValues(`${prefixo}.tiers.0`);
      if (primeiro.panSpecId === "" && tipo.defaultPanSpec) {
        setValue(`${prefixo}.tiers.0.panSpecId`, tipo.defaultPanSpec.id);
      }
      if (primeiro.batterTypeId === "" && tipo.defaultBatterType) {
        setValue(`${prefixo}.tiers.0.batterTypeId`, tipo.defaultBatterType.id);
      }
      if (primeiro.fillingIds.length === 0 && tipo.defaultFillings.length > 0) {
        setValue(
          `${prefixo}.tiers.0.fillingIds`,
          tipo.defaultFillings.slice(0, 2).map((r) => r.id),
        );
      }
    } catch {
      // Sem permissão ou sem rede: o usuário preenche à mão.
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-headline-sm text-on-surface">Bolo {indice + 1}</h2>
        {podeRemover && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remover bolo ${indice + 1}`}
            icon={<Trash2 size={18} />}
            onClick={onRemover}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoDeBusca
          name={`${prefixo}.cakeTypeId`}
          label="Modelo (tipo de bolo)"
          usarOpcoes={useCakeTypeOptions}
          selecionada={salvo?.cakeType ? { value: salvo.cakeType.id, label: salvo.cakeType.name } : undefined}
          allowEmpty
          placeholder="Personalizado"
          disabled={bloqueio.decoracao}
          onChange={(valor) => void aplicarPadroes(valor)}
        />
        <Formulario.Input name={`${prefixo}.title`} label="Título" required autoComplete="off" />
        <Formulario.Input
          name={`${prefixo}.colors`}
          label="Cores"
          autoComplete="off"
          disabled={bloqueio.decoracao}
        />
        <Formulario.Input
          name={`${prefixo}.dedicationText`}
          label="Dedicatória"
          autoComplete="off"
          disabled={bloqueio.decoracao}
        />
      </div>

      <div className="space-y-2">
        <CampoDeImagens
          name={`${prefixo}.referenceImageFile`}
          label="Imagem de referência"
          urlsAtuais={imagemAtual && !watch(`${prefixo}.removeReferenceImage`) ? [imagemAtual] : []}
          disabled={bloqueio.decoracao}
        />
        {imagemAtual && (
          <Formulario.Checkbox
            name={`${prefixo}.removeReferenceImage`}
            label="Remover a imagem atual"
            disabled={bloqueio.decoracao}
          />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-6">
          <Formulario.Checkbox
            name={`${prefixo}.hasDecoration`}
            label="Com decoração"
            disabled={bloqueio.decoracao}
          />
          <Formulario.Checkbox
            name={`${prefixo}.hasReinforcement`}
            label="Com blindagem"
            disabled={bloqueio.estrutura}
          />
        </div>
        {comDecoracao && (
          <div className="space-y-4 rounded-lg border border-outline-variant p-3">
            <Formulario.ComboboxMulti
              name={`${prefixo}.decorationKinds`}
              label="Tipos de decoração"
              required
              options={TIPOS_DE_DECORACAO.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              placeholder="Selecione"
              disabled={bloqueio.decoracao}
            />
            <Formulario.Textarea
              name={`${prefixo}.decorationDetails`}
              label="Detalhes da decoração"
              rows={2}
              disabled={bloqueio.decoracao}
            />
            <CampoDeImagens
              name={`${prefixo}.decorationFiles`}
              label="Imagens da decoração"
              multiple
              urlsAtuais={watch(`${prefixo}.decorationImageUrls`)}
              disabled={bloqueio.decoracao}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-title-md text-on-surface">Andares</h3>
          <p className="text-body-sm text-tertiary">
            O primeiro é a base. O andar de cima não pode ser maior que o de baixo. Até {MAX_ANDARES} andares.
          </p>
        </div>
        {andares.fields.map((campo, i) => {
          // O andar salvo só dá o rótulo da escolha; se o índice não casar com o valor, o Combobox ignora.
          const andarSalvo = salvo?.tiers[i];
          return (
            <div key={campo.id} className="space-y-3 rounded-lg border border-outline-variant p-3">
              <div className="flex items-center justify-between">
                <span className="text-label-md text-on-surface">
                  Andar {i + 1}
                  {i === 0 ? " (base)" : ""}
                </span>
                {andares.fields.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover andar ${i + 1} do bolo ${indice + 1}`}
                    icon={<Trash2 size={16} />}
                    disabled={bloqueio.estrutura}
                    onClick={() => andares.remove(i)}
                  />
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <CampoDeBusca
                  name={`${prefixo}.tiers.${i}.panSpecId`}
                  label={`Forma do andar ${i + 1}`}
                  usarOpcoes={usePanSpecOptions}
                  selecionada={
                    andarSalvo && {
                      value: andarSalvo.panSpec.id,
                      label: andarSalvo.panSpec.name,
                    }
                  }
                  required
                  disabled={bloqueio.estrutura}
                />
                <CampoDeBusca
                  name={`${prefixo}.tiers.${i}.batterTypeId`}
                  label={`Massa do andar ${i + 1}`}
                  usarOpcoes={useBatterTypeOptions}
                  selecionada={
                    andarSalvo && {
                      value: andarSalvo.batterType.id,
                      label: andarSalvo.batterType.name,
                    }
                  }
                  required
                  disabled={bloqueio.estrutura}
                />
                <Formulario.Select
                  name={`${prefixo}.tiers.${i}.layersCount`}
                  label={`Camadas do andar ${i + 1}`}
                  options={CAMADAS}
                  disabled={bloqueio.estrutura}
                />
              </div>
              <CampoDeBuscaMulti
                name={`${prefixo}.tiers.${i}.fillingIds`}
                label={`Recheios do andar ${i + 1}`}
                usarOpcoes={useFillingOptions}
                selecionadas={andarSalvo?.fillings.map((r) => ({
                  value: r.id,
                  label: r.name,
                }))}
                descricao="1 camada: até 2 recheios. 2 ou 3 camadas: até 3."
                disabled={bloqueio.recheios}
              />
            </div>
          );
        })}
        <Button
          variant="secondary"
          icon={<Plus size={16} />}
          disabled={bloqueio.estrutura || andares.fields.length >= MAX_ANDARES}
          onClick={() => andares.append(ANDAR_NOVO)}
        >
          Adicionar andar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Formulario.Textarea name={`${prefixo}.allergiesNotes`} label="Alergias" rows={2} />
        <Formulario.Textarea name={`${prefixo}.notes`} label="Observações do bolo" rows={2} />
      </div>
    </Card>
  );
}
