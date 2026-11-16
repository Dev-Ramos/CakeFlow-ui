import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { ApiError } from "@/services/http/errors";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { LoadingState } from "@/ui/components/LoadingState";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { ResumoDeValores } from "@/ui/components/ResumoDeValores";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { useDebounce } from "@/ui/lib/useDebounce";
import { toast } from "@/ui/toast/toast";
import { BoloForm } from "../components/BoloForm";
import { ORDERS_KEY, useCreateOrder, useOrder, usePricePreview, useUpdateOrder } from "../hooks/useOrders";
import { linhasDoPricing } from "../lib/linhasDoPricing";
import { BOLO_NOVO, paraInput, paraPreview, valoresIniciais } from "../lib/pedidoForm";
import { bloqueiosDoBolo, STATUS_NAO_EDITAVEIS } from "../lib/status";
import { orderSchema, type OrderFormData } from "../schemas/orderSchema";
import type { Order } from "../types/order";

const LISTA = "/pedidos";

const TIPOS = [
  { value: "delivery", label: "Entrega" },
  { value: "pickup", label: "Retirada" },
];

function PedidoForm({ pedido }: { pedido?: Order }) {
  const editando = pedido !== undefined;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const criar = useCreateOrder();
  const editar = useUpdateOrder();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: valoresIniciais(pedido),
  });
  const bolos = useFieldArray({ control: form.control, name: "items" });

  // Lidos na renderização de propósito: o RHF só rastreia o estado lido aqui.
  const { isDirty, isSubmitting } = form.formState;
  const tipo = useWatch({ control: form.control, name: "fulfillmentType" });

  // Depois que o forno começou, bolos não entram nem saem (B.7).
  const producaoIniciada = pedido?.items.some((bolo) => bloqueiosDoBolo(bolo).estrutura) ?? false;

  // Valores ao vivo. O debounce é sobre o texto, pois um objeto novo a cada render dispararia sem parar.
  const verValores = can("orders.view_prices");
  const observados = useWatch({ control: form.control, name: "items" });
  const entradaEmTexto = useDebounce(JSON.stringify(paraPreview(tipo, observados)));
  const entrada = JSON.parse(entradaEmTexto) as ReturnType<typeof paraPreview>;
  const calculo = usePricePreview(
    entrada ?? { fulfillmentType: "pickup", items: [] },
    verValores && entrada !== null,
  );

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
    navigate(editando ? `${LISTA}/${pedido.id}` : LISTA);
  }

  async function salvar(dados: OrderFormData) {
    try {
      const input = await paraInput(dados);
      const salvo = editando
        ? await editar.mutateAsync({ id: pedido.id, input, lockVersion: pedido.lockVersion })
        : await criar.mutateAsync(input);
      toast.success(editando ? "Pedido atualizado." : `Pedido ${salvo.code} criado.`);
      navigate(`${LISTA}/${salvo.id}`);
    } catch (erro) {
      // O toast global já mostrou o motivo (ex.: ficha técnica ausente, valor não configurado).
      if (erro instanceof ApiError && erro.apiCode === "stale_order") {
        // Outra pessoa alterou o pedido: recarrega; a versão nova reinicia o formulário.
        toast.warning(
          "O pedido foi alterado por outra pessoa. Recarregamos os dados: confira e salve de novo.",
        );
        await queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      }
    }
  }

  const titulo = editando ? `Editar ${pedido.code}` : "Novo pedido";

  return (
    <PageShell>
      <PageHeader title={titulo} description="Cliente, entrega e os bolos do pedido." />

      <Formulario form={form} label={titulo} onSubmit={salvar} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-headline-sm text-on-surface">Cliente</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Formulario.Input name="customerName" label="Nome" required autoComplete="off" />
            <Formulario.Input
              name="customerPhone"
              label="Telefone"
              required
              type="tel"
              inputMode="tel"
              placeholder="(11) 98888-1111"
              autoComplete="off"
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-headline-sm text-on-surface">Entrega</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Formulario.Select name="fulfillmentType" label="Tipo" options={TIPOS} />
            <Formulario.Input
              name="productionDate"
              label="Data de produção"
              type="date"
              required
              disabled={producaoIniciada}
              descricao={producaoIniciada ? "A produção já começou." : undefined}
            />
            <Formulario.Input
              name="deliveryAt"
              label={tipo === "delivery" ? "Entrega" : "Retirada"}
              type="datetime-local"
              required
            />
          </div>
          {tipo === "delivery" && (
            <div className="grid gap-4 sm:grid-cols-6">
              <Formulario.Input name="street" label="Rua" required className="sm:col-span-4" />
              <Formulario.Input name="number" label="Número" required className="sm:col-span-2" />
              <Formulario.Input name="complement" label="Complemento" className="sm:col-span-2" />
              <Formulario.Input name="neighborhood" label="Bairro" required className="sm:col-span-2" />
              <Formulario.Input name="city" label="Cidade" required className="sm:col-span-2" />
              <Formulario.Input
                name="reference"
                label="Ponto de referência"
                required
                className="sm:col-span-6"
              />
            </div>
          )}
        </Card>

        {bolos.fields.map((campo, indice) => (
          <BoloForm
            key={campo.id}
            indice={indice}
            salvo={pedido?.items.find((bolo) => bolo.id === campo.itemId)}
            podeRemover={bolos.fields.length > 1 && !producaoIniciada}
            onRemover={() => bolos.remove(indice)}
          />
        ))}
        {form.formState.errors.items?.message && (
          <Alert tone="danger">{form.formState.errors.items.message}</Alert>
        )}
        <Button
          variant="secondary"
          icon={<Plus size={16} />}
          disabled={producaoIniciada}
          onClick={() => bolos.append(BOLO_NOVO)}
        >
          Adicionar bolo
        </Button>

        <Card className="space-y-4">
          <Formulario.Textarea name="notes" label="Observações do pedido" rows={3} />
        </Card>

        {verValores && (
          <Card className="space-y-3">
            <h2 className="text-headline-sm text-on-surface">Valores</h2>
            {calculo.isError && (
              <Alert tone="warning" title="Não foi possível calcular os valores.">
                {calculo.error.message}
              </Alert>
            )}
            {entrada === null ? (
              <p className="text-body-md text-tertiary">
                Escolha a forma e ao menos um recheio de cada andar para ver os valores.
              </p>
            ) : (
              calculo.data && <ResumoDeValores linhas={linhasDoPricing(calculo.data)} />
            )}
            {editando && (
              <p className="text-body-sm text-tertiary">
                Só mudanças em formas, massas, camadas, recheios, blindagem ou entrega recalculam o valor do
                pedido.
              </p>
            )}
          </Card>
        )}

        <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
          <Button variant="neutral" onClick={() => void cancelar()}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editando ? "Salvar alterações" : "Criar pedido"}
          </Button>
        </div>
      </Formulario>
    </PageShell>
  );
}

/** Novo pedido (`/pedidos/novo`) e edição (`/pedidos/:id/editar`). */
export function PedidoFormPage() {
  const { id } = useParams();
  const pedidoId = id === undefined ? undefined : Number(id);
  const pedido = useOrder(pedidoId);

  if (pedidoId !== undefined) {
    if (pedido.isPending) return <LoadingState title="Carregando o pedido" className="py-16" />;
    if (pedido.isError) {
      return (
        <PageShell>
          <Alert tone="danger" title="Não foi possível carregar o pedido.">
            {pedido.error.message}
          </Alert>
          <Link to={LISTA} className={cn(buttonVariants({ variant: "neutral" }))}>
            Voltar para os pedidos
          </Link>
        </PageShell>
      );
    }
    if (STATUS_NAO_EDITAVEIS.includes(pedido.data.status)) {
      return (
        <PageShell>
          <Alert tone="warning" title="Este pedido não pode mais ser editado.">
            Pedidos concluídos, cancelados ou com cancelamento em análise ficam somente para consulta.
          </Alert>
          <Link to={`${LISTA}/${pedidoId}`} className={cn(buttonVariants({ variant: "neutral" }))}>
            Ver o pedido
          </Link>
        </PageShell>
      );
    }
  }

  // `lockVersion` na chave: ao recarregar depois de um 409 (`stale_order`) o formulário reinicia com a versão nova.
  return (
    <PedidoForm
      key={pedido.data ? `${pedido.data.id}-${pedido.data.lockVersion}` : "novo"}
      pedido={pedido.data}
    />
  );
}
