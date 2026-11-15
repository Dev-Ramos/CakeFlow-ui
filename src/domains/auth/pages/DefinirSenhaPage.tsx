import { Hourglass } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { ApiError } from "@/services/http/errors";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { LoadingState } from "@/ui/components/LoadingState";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { toast } from "@/ui/toast/toast";
import { NovaSenhaForm } from "../components/NovaSenhaForm";
import { useAuth } from "../hooks/useAuth";
import { useConvite } from "../hooks/useConvite";
import { useDefinirSenha } from "../hooks/useDefinirSenha";

/** Status que indicam convite inválido/expirado (e não uma falha de rede ou do servidor). */
const STATUS_CONVITE_INVALIDO = [400, 401, 403, 404, 410];

function LinkExpirado() {
  return (
    <div className="space-y-4 text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-error"
      >
        <Hourglass size={24} />
      </span>
      <div className="space-y-1">
        <h1 className="text-headline-md text-on-surface">Link expirado</h1>
        <p className="text-body-md text-tertiary">
          Este convite não é mais válido. Peça um novo link à administração do ateliê.
        </p>
      </div>
      <Link to="/login" className={cn(buttonVariants({ variant: "neutral" }), "w-full")}>
        Voltar ao login
      </Link>
    </div>
  );
}

/** Primeiro acesso por link de convite: valida o token e define a senha. */
function PorConvite({ token }: { token: string }) {
  const navigate = useNavigate();
  const convite = useConvite(token);
  const definir = useDefinirSenha();

  if (convite.isPending) {
    return <LoadingState title="Validando convite" />;
  }

  if (convite.isError) {
    const erro = convite.error;
    if (erro instanceof ApiError && erro.status !== null && STATUS_CONVITE_INVALIDO.includes(erro.status)) {
      return <LinkExpirado />;
    }
    return (
      <div className="space-y-4">
        <Alert tone="danger">Não foi possível validar o convite. {erro.message}</Alert>
        <Button variant="neutral" className="w-full" onClick={() => void convite.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const primeiroNome = convite.data.nome.split(" ")[0];

  return (
    <div className="space-y-6">
      <header className="space-y-1 text-center">
        <h1 className="text-headline-md text-on-surface">Bem-vindo(a) ao Cakeflow, {primeiroNome}!</h1>
        <p className="text-body-md text-tertiary">
          Crie sua senha para ativar o acesso de {convite.data.email}.
        </p>
      </header>
      <NovaSenhaForm
        enviando={definir.isPending}
        erro={definir.error?.message}
        onSubmit={(senha) =>
          definir.mutate(
            { token, senha },
            {
              onSuccess: () => {
                toast.success("Senha definida. Entre com a sua nova senha.");
                navigate("/login", { replace: true });
              },
            },
          )
        }
      />
    </div>
  );
}

/** Troca obrigatória: usuário já autenticado, mas marcado para definir a senha. */
function TrocaObrigatoria() {
  const { logout, atualizarUsuario } = useAuth();
  const definir = useDefinirSenha();

  return (
    <div className="space-y-6">
      <header className="space-y-1 text-center">
        <h1 className="text-headline-md text-on-surface">Defina sua nova senha</h1>
        <p className="text-body-md text-tertiary">
          Por segurança, crie uma senha pessoal antes de continuar.
        </p>
      </header>
      <NovaSenhaForm
        enviando={definir.isPending}
        erro={definir.error?.message}
        onSubmit={(senha) =>
          definir.mutate(
            { senha },
            {
              // Ao atualizar o usuário a página redireciona para o início sozinha.
              onSuccess: async () => {
                await atualizarUsuario();
                toast.success("Senha definida com sucesso.");
              },
            },
          )
        }
      />
      <Button variant="ghost" className="w-full" onClick={logout}>
        Sair
      </Button>
    </div>
  );
}

export function DefinirSenhaPage() {
  const [params] = useSearchParams();
  const { usuario } = useAuth();
  const token = params.get("token");

  if (token) return <PorConvite token={token} />;
  if (usuario?.precisaDefinirSenha) return <TrocaObrigatoria />;
  return <Navigate to={usuario ? "/" : "/login"} replace />;
}
