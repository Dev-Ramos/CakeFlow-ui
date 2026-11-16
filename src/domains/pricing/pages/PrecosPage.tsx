import { useState } from "react";
import { Save } from "lucide-react";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { centavosParaTexto, textoParaCentavos } from "@/ui/lib/dinheiro";
import { toast } from "@/ui/toast/toast";
import { Simulador } from "../components/Simulador";
import { TabelaDePrecos } from "../components/TabelaDePrecos";
import { ValoresGlobais } from "../components/ValoresGlobais";
import { textoDosValores, type ValoresGlobaisTexto } from "../lib/valoresGlobais";
import {
  useFillingPrices,
  useInvalidarPrecos,
  usePanSpecPrices,
  usePricingSettings,
  useSetFillingPrice,
  useSetPanSpecPrice,
  useUpdatePricingSettings,
} from "../hooks/usePricing";
import type { PriceRow, PricingSettings } from "../types/pricing";

const LIMITE = 10;
const INVALIDO = "Informe um valor em reais (0 ou mais).";

type PorId = Record<number, string>;

/** Salvou ou falhou: o texto do erro vem da API. */
function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Não foi possível salvar.";
}

export function PrecosPage() {
  const { can } = useAuth();
  const podeEditar = can("pricing.update");

  const [pageFormas, setPageFormas] = useState(1);
  const [pageRecheios, setPageRecheios] = useState(1);
  const formas = usePanSpecPrices({ page: pageFormas, limit: LIMITE });
  const recheios = useFillingPrices({ page: pageRecheios, limit: LIMITE });
  const configuracoes = usePricingSettings();

  // Valores digitados e ainda não salvos: só entram aqui os que diferem do que a API devolveu.
  const [edicoesFormas, setEdicoesFormas] = useState<PorId>({});
  const [edicoesRecheios, setEdicoesRecheios] = useState<PorId>({});
  const [globaisEditados, setGlobaisEditados] = useState<ValoresGlobaisTexto | null>(null);
  const [errosFormas, setErrosFormas] = useState<PorId>({});
  const [errosRecheios, setErrosRecheios] = useState<PorId>({});
  const [erroGlobais, setErroGlobais] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  const definirForma = useSetPanSpecPrice();
  const definirRecheio = useSetFillingPrice();
  const atualizarGlobais = useUpdatePricingSettings();
  const recarregar = useInvalidarPrecos();

  const globais = globaisEditados ?? (configuracoes.data ? textoDosValores(configuracoes.data) : null);
  const pendencias =
    Object.keys(edicoesFormas).length + Object.keys(edicoesRecheios).length + (globaisEditados ? 1 : 0);

  function editar(setEdicoes: (fn: (atual: PorId) => PorId) => void) {
    return (linha: PriceRow, texto: string) =>
      setEdicoes((atual) => {
        const resto = { ...atual };
        delete resto[linha.id];
        return texto === centavosParaTexto(linha.priceCents) ? resto : { ...resto, [linha.id]: texto };
      });
  }

  /** Uma requisição por linha alterada; as que falham ficam na tela com o erro, as demais saem. */
  async function salvarLinhas(
    edicoes: PorId,
    enviar: (id: number, cents: number) => Promise<unknown>,
    setEdicoes: (valor: PorId) => void,
    setErros: (valor: PorId) => void,
  ) {
    const erros: PorId = {};
    const pendentes: PorId = {};
    let salvos = 0;
    await Promise.all(
      Object.entries(edicoes).map(async ([chave, texto]) => {
        const id = Number(chave);
        const cents = textoParaCentavos(texto);
        if (Number.isNaN(cents)) {
          erros[id] = INVALIDO;
          pendentes[id] = texto;
          return;
        }
        try {
          await enviar(id, cents);
          salvos += 1;
        } catch (erro) {
          erros[id] = mensagemDe(erro);
          pendentes[id] = texto;
        }
      }),
    );
    setEdicoes(pendentes);
    setErros(erros);
    return { salvos, falhas: Object.keys(erros).length };
  }

  async function salvarGlobais(): Promise<{ salvos: number; falhas: number }> {
    if (!globaisEditados) return { salvos: 0, falhas: 0 };
    const parcial: Partial<PricingSettings> = {};
    const campos = [
      ["tierComplexity", "tierComplexityCents"],
      ["reinforcement", "reinforcementCents"],
      ["deliveryFee", "deliveryFeeCents"],
    ] as const;
    for (const [texto, chave] of campos) {
      const bruto = globaisEditados[texto].trim();
      const cents = textoParaCentavos(bruto);
      if (bruto !== "" && Number.isNaN(cents)) {
        setErroGlobais(INVALIDO);
        return { salvos: 0, falhas: 1 };
      }
      parcial[chave] = bruto === "" ? null : cents; // em branco limpa o valor
    }
    try {
      await atualizarGlobais.mutateAsync(parcial);
      setGlobaisEditados(null);
      setErroGlobais(undefined);
      return { salvos: 1, falhas: 0 };
    } catch (erro) {
      setErroGlobais(mensagemDe(erro));
      return { salvos: 0, falhas: 1 };
    }
  }

  async function salvar() {
    setSalvando(true);
    try {
      const resultados = await Promise.all([
        salvarLinhas(
          edicoesFormas,
          (id, cents) => definirForma.mutateAsync({ id, cents }),
          setEdicoesFormas,
          setErrosFormas,
        ),
        salvarLinhas(
          edicoesRecheios,
          (id, cents) => definirRecheio.mutateAsync({ id, cents }),
          setEdicoesRecheios,
          setErrosRecheios,
        ),
        salvarGlobais(),
      ]);
      const salvos = resultados.reduce((total, r) => total + r.salvos, 0);
      const falhas = resultados.reduce((total, r) => total + r.falhas, 0);
      await recarregar();
      if (falhas === 0) toast.success("Valores salvos.");
      else if (salvos > 0) toast.warning(`${salvos} salvos; ${falhas} com erro (veja nas linhas).`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Preços e acréscimos"
        description="Os valores usados no cálculo dos pedidos."
        actions={
          podeEditar && (
            <Button
              icon={<Save size={16} />}
              loading={salvando}
              disabled={pendencias === 0}
              onClick={() => void salvar()}
            >
              Salvar valores
            </Button>
          )
        }
      />

      <Alert tone="info">
        Alterar valores não muda pedidos já criados: os valores ficam congelados em cada pedido.
      </Alert>

      <TabelaDePrecos
        titulo="Valor da camada por tamanho"
        descricao="Quanto custa cada camada da forma. A forma só pode ser ativada depois de ter preço."
        rotuloDoValor="Valor da camada"
        item="forma"
        consulta={formas}
        edicoes={edicoesFormas}
        erros={errosFormas}
        onEditar={editar(setEdicoesFormas)}
        somenteLeitura={!podeEditar}
        page={pageFormas}
        onPage={setPageFormas}
      />

      <TabelaDePrecos
        titulo="Acréscimo por recheio"
        descricao="Cobrado uma vez por pedido para cada recheio distinto. Zero também conta como definido."
        rotuloDoValor="Acréscimo"
        item="recheio"
        consulta={recheios}
        edicoes={edicoesRecheios}
        erros={errosRecheios}
        onEditar={editar(setEdicoesRecheios)}
        somenteLeitura={!podeEditar}
        page={pageRecheios}
        onPage={setPageRecheios}
      />

      {globais && (
        <ValoresGlobais
          valores={globais}
          erro={erroGlobais}
          onChange={setGlobaisEditados}
          somenteLeitura={!podeEditar}
        />
      )}
      {configuracoes.isError && (
        <Alert tone="danger" title="Não foi possível carregar os outros valores.">
          {configuracoes.error.message}
        </Alert>
      )}

      <Simulador />
    </PageShell>
  );
}
