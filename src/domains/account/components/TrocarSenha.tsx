import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/services/http/errors";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { toast } from "@/ui/toast/toast";
import { useTrocarSenha } from "../hooks/useConta";
import {
  SENHA_MINIMA,
  trocarSenhaSchema,
  type TrocarSenhaFormData,
} from "../schemas/contaSchemas";

/** O `code` do erro (corpo da API) decide em qual campo a mensagem aparece. */
const ERROS_POR_CODIGO: Record<string, { campo: keyof TrocarSenhaFormData; mensagem: string }> = {
  invalid_current_password: { campo: "currentPassword", mensagem: "A senha atual está incorreta." },
  same_password: { campo: "password", mensagem: "A nova senha deve ser diferente da atual." },
  blank_password: { campo: "password", mensagem: "Informe a nova senha." },
};

export function TrocarSenha() {
  const trocar = useTrocarSenha();
  const form = useForm<TrocarSenhaFormData>({
    resolver: zodResolver(trocarSenhaSchema),
    defaultValues: { currentPassword: "", password: "", passwordConfirmation: "" },
  });

  async function salvar(dados: TrocarSenhaFormData) {
    try {
      await trocar.mutateAsync(dados);
      form.reset();
      toast.success("Senha alterada. Os outros dispositivos foram desconectados.");
    } catch (erro) {
      const conhecido = erro instanceof ApiError && erro.apiCode ? ERROS_POR_CODIGO[erro.apiCode] : undefined;
      if (conhecido) form.setError(conhecido.campo, { message: conhecido.mensagem });
      // Os demais erros (ex.: `invalid`) aparecem no alerta abaixo, com a mensagem da API.
    }
  }

  const erroGeral =
    trocar.error instanceof ApiError && !(trocar.error.apiCode && ERROS_POR_CODIGO[trocar.error.apiCode])
      ? trocar.error.message
      : undefined;

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-headline-sm text-on-surface">Alterar senha</h2>
        <p className="text-body-sm text-tertiary">
          Ao trocar, você continua conectado aqui e é desconectado dos outros dispositivos.
        </p>
      </div>

      <Formulario form={form} label="Alterar senha" onSubmit={salvar} className="space-y-4">
        <Formulario.Password
          name="currentPassword"
          label="Senha atual"
          required
          autoComplete="current-password"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Formulario.Password
            name="password"
            label="Nova senha"
            required
            autoComplete="new-password"
            descricao={`Use pelo menos ${SENHA_MINIMA} caracteres.`}
          />
          <Formulario.Password
            name="passwordConfirmation"
            label="Confirmar nova senha"
            required
            autoComplete="new-password"
          />
        </div>

        {erroGeral && <Alert tone="danger">{erroGeral}</Alert>}

        <div className="flex justify-end">
          <Button type="submit" icon={<KeyRound size={16} />} loading={trocar.isPending}>
            Alterar senha
          </Button>
        </div>
      </Formulario>
    </Card>
  );
}
