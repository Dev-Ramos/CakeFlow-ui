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

  const primeiroNome = convite.data.name.split(" ")[0];

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
        onSubmit={(password) =>
          definir.mutate(
            { token, password },
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

/** A senha só é definida pelo link de convite (`?token=...`); sem ele não há o que fazer aqui. */
export function DefinirSenhaPage() {
  const [params] = useSearchParams();
  const { usuario } = useAuth();
  const token = params.get("token");

  if (token) return <PorConvite token={token} />;
  return <Navigate to={usuario ? "/" : "/login"} replace />;
}
