import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation } from "react-router";
import { ApiError } from "@/services/http/errors";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { Formulario } from "@/ui/components/formulario/Formulario";
import { useAuth } from "../hooks/useAuth";
import { useLogin } from "../hooks/useLogin";
import { loginSchema, type LoginFormData } from "../schemas/authSchemas";

interface EstadoDeNavegacao {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { usuario } = useAuth();
  const location = useLocation();
  const entrar = useLogin();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Já autenticado (inclusive logo após o login): sai da tela de login.
  if (usuario) {
    const origem = (location.state as EstadoDeNavegacao | null)?.from?.pathname ?? "/";
    return <Navigate to={usuario.mustChangePassword ? "/definir-senha" : origem} replace />;
  }

  const erro = entrar.error;
  const mensagemDeErro = erro
    ? erro instanceof ApiError && erro.status === 401
      ? "E-mail ou senha inválidos."
      : erro.message
    : null;

  return (
    <div className="space-y-6">
      <header className="space-y-1 text-center">
        <h1 className="text-headline-md text-on-surface">Entrar</h1>
        <p className="text-body-md text-tertiary">Acesse o painel de produção da sua confeitaria.</p>
      </header>

      <Formulario form={form} label="Entrar" onSubmit={(dados) => entrar.mutate(dados)}>
        <Formulario.Input
          name="email"
          label="E-mail"
          type="email"
          autoComplete="username"
          placeholder="nome@cakeflow.com.br"
          required
        />
        <Formulario.Password
          name="password"
          label="Senha"
          autoComplete="current-password"
          placeholder="Digite sua senha de acesso"
          required
        />
        {mensagemDeErro && <Alert tone="danger">{mensagemDeErro}</Alert>}
        <Button type="submit" loading={entrar.isPending} icon={<LogIn size={16} />} className="w-full">
          Entrar
        </Button>
      </Formulario>

      <p className="text-center text-body-sm text-tertiary">
        Acesso apenas para usuários convidados pela administração.
      </p>
    </div>
  );
}
