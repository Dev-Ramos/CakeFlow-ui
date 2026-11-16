import { Card } from "@/ui/components/Card";
import { Field } from "@/ui/components/Field";
import { Input } from "@/ui/components/Input";

import type { ValoresGlobaisTexto } from "../lib/valoresGlobais";

const CAMPOS: Array<{
  chave: keyof ValoresGlobaisTexto;
  rotulo: string;
  dica: string;
}> = [
  {
    chave: "tierComplexity",
    rotulo: "Complexidade de andares",
    dica: "Uma vez por pedido que tenha algum bolo com mais de um andar.",
  },
  {
    chave: "reinforcement",
    rotulo: "Blindagem",
    dica: "Por bolo que leva blindagem.",
  },
  {
    chave: "deliveryFee",
    rotulo: "Taxa de entrega",
    dica: "Fixa, uma vez por pedido de entrega.",
  },
];

interface Props {
  valores: ValoresGlobaisTexto;
  erro?: string;
  onChange: (valores: ValoresGlobaisTexto) => void;
  somenteLeitura: boolean;
}

export function ValoresGlobais({ valores, erro, onChange, somenteLeitura }: Props) {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-headline-sm text-on-surface">Outros valores</h2>
        <p className="text-body-md text-tertiary">
          Valores que valem para o pedido todo. Em branco = não configurado.
        </p>
      </div>
      {erro && <p className="text-body-sm text-danger-text">{erro}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {CAMPOS.map(({ chave, rotulo, dica }) => (
          <Field key={chave} id={`global-${chave}`} label={`${rotulo} (R$)`} hint={dica}>
            <Input
              id={`global-${chave}`}
              inputMode="decimal"
              value={valores[chave]}
              disabled={somenteLeitura}
              onChange={(event) => onChange({ ...valores, [chave]: event.target.value })}
            />
          </Field>
        ))}
      </div>
    </Card>
  );
}
