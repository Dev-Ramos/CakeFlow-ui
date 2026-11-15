import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert } from "@/ui/components/Alert";
import { Button } from "@/ui/components/Button";
import { Formulario } from "@/ui/components/formulario/Formulario";
import {
  definirSenhaSchema,
  SENHA_TAMANHO_MINIMO,
  type DefinirSenhaFormData,
} from "../schemas/authSchemas";

export interface NovaSenhaFormProps {
  onSubmit: (password: string) => void;
  enviando: boolean;
  /** Mensagem de erro do servidor, exibida acima do botão. */
  erro?: string | null;
}

/** Formulário de nova senha + confirmação, compartilhado pelo convite e pela troca obrigatória. */
export function NovaSenhaForm({ onSubmit, enviando, erro }: NovaSenhaFormProps) {
  const form = useForm<DefinirSenhaFormData>({
    resolver: zodResolver(definirSenhaSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  return (
    <Formulario form={form} label="Definir senha" onSubmit={(dados) => onSubmit(dados.password)}>
      <Formulario.Password
        name="password"
        label="Nova senha"
        required
        autoComplete="new-password"
        descricao={`Use pelo menos ${SENHA_TAMANHO_MINIMO} caracteres.`}
      />
      <Formulario.Password
        name="confirmPassword"
        label="Confirmar senha"
        required
        autoComplete="new-password"
      />
      {erro && <Alert tone="danger">{erro}</Alert>}
      <Button type="submit" loading={enviando} icon={<KeyRound size={16} />} className="w-full">
        Definir senha
      </Button>
    </Formulario>
  );
}
