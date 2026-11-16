import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useFillingOptions } from "@/domains/catalog/fillings/hooks/useFillings";
import { usePanSpecOptions } from "@/domains/catalog/pan-specs/hooks/usePanSpecs";
import { linhasDoPricing } from "@/domains/orders/lib/linhasDoPricing";
import { usePricePreview } from "@/domains/orders/hooks/useOrders";
import type { PricePreviewInput } from "@/domains/orders/types/order";
import { paraPreview } from "@/domains/orders/lib/pedidoForm";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { CampoDeBusca, CampoDeBuscaMulti } from "@/ui/components/formulario/CamposDeBusca";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { ResumoDeValores } from "@/ui/components/ResumoDeValores";
import { useDebounce } from "@/ui/lib/useDebounce";

interface AndarDoSimulador {
  panSpecId: number | "";
  layersCount: number;
  fillingIds: number[];
}

interface SimuladorForm {
  tiers: AndarDoSimulador[];
  hasReinforcement: boolean;
  delivery: boolean;
}

const MAX_ANDARES = 3;
const ANDAR_NOVO: AndarDoSimulador = {
  panSpecId: "",
  layersCount: 1,
  fillingIds: [],
};
const CAMADAS = [1, 2, 3].map((n) => ({
  value: n,
  label: `${n} ${n === 1 ? "camada" : "camadas"}`,
}));

/**
 * Cartão 4: simula um bolo com os valores atuais, sem gravar nada. Usa o mesmo
 * `POST /orders/price_preview` do pedido; a resposta traz o passo a passo.
 */
export function Simulador() {
  const form = useForm<SimuladorForm>({
    defaultValues: {
      tiers: [ANDAR_NOVO],
      hasReinforcement: false,
      delivery: false,
    },
  });
  const andares = useFieldArray({ control: form.control, name: "tiers" });
  const valores = useWatch({ control: form.control });

  // Debounce sobre o texto: um objeto novo a cada render faria o debounce disparar sem parar.
  const entradaEmTexto = useDebounce(
    JSON.stringify(
      paraPreview(valores.delivery ? "delivery" : "pickup", [
        { hasReinforcement: valores.hasReinforcement, tiers: valores.tiers },
      ]),
    ),
  );
  const entrada = JSON.parse(entradaEmTexto) as PricePreviewInput | null;
  const calculo = usePricePreview(entrada ?? { fulfillmentType: "pickup", items: [] }, entrada !== null);

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-headline-sm text-on-surface">Simulador</h2>
        <p className="text-body-md text-tertiary">
          Veja quanto custaria um bolo com os valores atuais. Nada é gravado.
        </p>
      </div>

      <Formulario form={form} label="Simulador de valores" onSubmit={() => undefined}>
        {andares.fields.map((campo, indice) => (
          <div
            key={campo.id}
            className="grid items-start gap-3 rounded-lg border border-outline-variant p-3 sm:grid-cols-[1fr_9rem_1fr_auto]"
          >
            <CampoDeBusca
              name={`tiers.${indice}.panSpecId`}
              label={`Forma do andar ${indice + 1}`}
              usarOpcoes={usePanSpecOptions}
            />
            <Formulario.Select name={`tiers.${indice}.layersCount`} label="Camadas" options={CAMADAS} />
            <CampoDeBuscaMulti
              name={`tiers.${indice}.fillingIds`}
              label={`Recheios do andar ${indice + 1}`}
              usarOpcoes={useFillingOptions}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover andar ${indice + 1}`}
              icon={<Trash2 size={18} />}
              className="sm:mt-[26px]"
              disabled={andares.fields.length === 1}
              onClick={() => andares.remove(indice)}
            />
          </div>
        ))}
        <Button
          variant="secondary"
          icon={<Plus size={16} />}
          disabled={andares.fields.length >= MAX_ANDARES}
          onClick={() => andares.append(ANDAR_NOVO)}
        >
          Adicionar andar
        </Button>
        <div className="flex flex-wrap gap-6">
          <Formulario.Checkbox name="hasReinforcement" label="Com blindagem" />
          <Formulario.Checkbox name="delivery" label="Entrega" />
        </div>
      </Formulario>

      {calculo.isError && (
        <Alert tone="danger" title="Não foi possível calcular.">
          {calculo.error.message}
        </Alert>
      )}
      {entrada === null ? (
        <p className="text-body-md text-tertiary">Escolha a forma e ao menos um recheio de cada andar.</p>
      ) : (
        calculo.data && <ResumoDeValores linhas={linhasDoPricing(calculo.data)} />
      )}
    </Card>
  );
}
