import { Hourglass } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { ApiError } from "@/services/http/errors";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { toast } from "@/ui/toast/toast";
import { NovaSenhaForm } from "../components/NovaSenhaForm";
import { useAuth } from "../hooks/useAuth";
import { useDefinirSenha } from "../hooks/useDefinirSenha";

/** Status em que a API diz que o link não existe mais (a validação do token é só dela, ao enviar a senha). */
const STATUS_LINK_INVALIDO = [404, 410];

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
          Este link não é mais válido. Peça um novo link à administração do ateliê.
        </p>
      </div>
      <Link to="/login" className={cn(buttonVariants({ variant: "neutral" }), "w-full")}>
        Voltar ao login
      </Link>
    </div>
  );
}

/**
 * Primeiro acesso pelo link. O formulário aparece direto: o `reset_password_token`
 * não é validado antes, só a API o valida quando a senha é enviada.
 */
function PorLink({ token }: { token: string }) {
  const navigate = useNavigate();
  const definir = useDefinirSenha();

  if (
    definir.error instanceof ApiError &&
    definir.error.status !== null &&
    STATUS_LINK_INVALIDO.includes(definir.error.status)
  ) {
    return <LinkExpirado />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1 text-center">
        <h1 className="text-headline-md text-on-surface">Bem-vindo(a) ao Cakeflow!</h1>
        <p className="text-body-md text-tertiary">Crie sua senha para ativar o seu acesso.</p>
      </header>
      <NovaSenhaForm
        enviando={definir.isPending}
        erro={definir.error?.message}
        onSubmit={({ password, passwordConfirmation }) =>
          definir.mutate(
            { token, password, passwordConfirmation },
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

/** A senha só é definida pelo link enviado (`?reset_password_token=...`); sem ele não há o que fazer aqui. */
export function DefinirSenhaPage() {
  const [params] = useSearchParams();
  const { usuario } = useAuth();
  const token = params.get("reset_password_token");

  if (token) return <PorLink token={token} />;
  return <Navigate to={usuario ? "/" : "/login"} replace />;
}
