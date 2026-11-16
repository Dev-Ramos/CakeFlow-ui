import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Card } from "@/ui/components/Card";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { DadosPessoais } from "../components/DadosPessoais";
import { FotoDePerfil } from "../components/FotoDePerfil";
import { TrocarSenha } from "../components/TrocarSenha";

/** Minha conta: foto de perfil, dados pessoais e troca de senha da pessoa logada. */
export function MinhaContaPage() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <PageShell>
      <PageHeader title="Minha conta" description="Sua foto, seus dados e a senha do seu acesso." />

      <Card>
        <FotoDePerfil usuario={usuario} />
      </Card>

      <DadosPessoais usuario={usuario} />
      <TrocarSenha />
    </PageShell>
  );
}
