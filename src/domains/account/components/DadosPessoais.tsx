import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Usuario } from "@/domains/auth/types/auth";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { toast } from "@/ui/toast/toast";
import { useAtualizarPerfil } from "../hooks/useConta";
import { perfilSchema, type PerfilFormData } from "../schemas/contaSchemas";

function DadoFixo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-label-md text-tertiary">{rotulo}</dt>
      <dd className="text-body-md text-on-surface">{children}</dd>
    </div>
  );
}

/** Nome e sobrenome editáveis; e-mail e cargos aparecem só para leitura (a API não os edita aqui). */
export function DadosPessoais({ usuario }: { usuario: Usuario }) {
  const atualizar = useAtualizarPerfil();
  const form = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { name: usuario.name, lastName: usuario.lastName },
  });
  // Lido na renderização: o RHF só rastreia o estado que é lido aqui.
  const { isDirty } = form.formState;

  async function salvar(dados: PerfilFormData) {
    try {
      await atualizar.mutateAsync(dados);
      // Nova linha de base: o botão volta a ficar desabilitado até a próxima edição.
      form.reset({ name: dados.name.trim(), lastName: dados.lastName.trim() });
      toast.success("Dados atualizados.");
    } catch {
      // O toast global de erro já informou a falha; o formulário mantém o que foi digitado.
    }
  }

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-headline-sm text-on-surface">Dados pessoais</h2>
        <p className="text-body-sm text-tertiary">
          Seu nome aparece para a equipe. E-mail e cargos são definidos pela administração.
        </p>
      </div>

      <Formulario form={form} label="Dados pessoais" onSubmit={salvar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Formulario.Input name="name" label="Nome" required autoComplete="given-name" />
          <Formulario.Input name="lastName" label="Sobrenome" required autoComplete="family-name" />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <DadoFixo rotulo="E-mail">{usuario.email}</DadoFixo>
          <DadoFixo rotulo="Cargos">
            {usuario.roles.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {usuario.roles.map((cargo) => (
                  <Badge key={cargo} tone="primary">
                    {cargo}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-tertiary">Nenhum cargo</span>
            )}
          </DadoFixo>
        </dl>

        <div className="flex justify-end">
          <Button type="submit" icon={<Save size={16} />} loading={atualizar.isPending} disabled={!isDirty}>
            Salvar alterações
          </Button>
        </div>
      </Formulario>
    </Card>
  );
}
