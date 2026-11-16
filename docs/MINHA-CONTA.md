# Minha conta (front)

Tela `/minha-conta`: foto de perfil, dados pessoais e troca de senha do **próprio** usuário. Contrato da API: `docs/API-perfil.md` do repositório da API. Código em `src/domains/account`.

## Acesso

- Qualquer usuário autenticado; sem permissão específica (o usuário só edita o próprio perfil).
- Entrada: bloco com avatar e nome na topbar (`Topbar.tsx`), que leva a `/minha-conta`.

## Estrutura

| Arquivo | Papel |
|---|---|
| `api/accountApi.ts` | Chamadas HTTP (única camada que conhece o contrato). |
| `hooks/useConta.ts` | Mutations; no sucesso recarregam o usuário (`GET /me`). |
| `schemas/contaSchemas.ts` | Zod: perfil e troca de senha. |
| `components/FotoDePerfil.tsx` | Escolher, pré-visualizar, salvar, trocar e remover a foto. |
| `components/DadosPessoais.tsx` | Nome e sobrenome (e-mail e cargos só leitura). |
| `components/TrocarSenha.tsx` | Troca de senha com erros por `code`. |
| `pages/MinhaContaPage.tsx` | Compõe as três seções. |
| `ui/components/Avatar.tsx` | Foto circular com iniciais de reserva (usado também na topbar). |

## Fluxos

### Foto

1. O usuário escolhe o arquivo. O front valida **antes de enviar**: `image/jpeg`, `image/png` ou `image/webp`, até **5 MB**. Erro aparece na hora e nada é enviado.
2. A prévia aparece no avatar (`URL.createObjectURL`, liberada com `revokeObjectURL`). Só envia em **Salvar foto**; **Cancelar** descarta.
3. Envio: `PATCH /me` com `FormData` e o arquivo em `user[image]`. **Sem `Content-Type` manual**: o Axios/navegador gera o `multipart/form-data; boundary=...` (por isso a instância `api` não fixa `Content-Type`).
4. Sucesso: o `/me` é recarregado e `Usuario.avatarUrl` passa a ser o novo `image_url` (a URL muda a cada upload; não usar `?v=`).
5. Falha (422): toast com a mensagem da API; a foto anterior continua e a escolha pendente fica na tela para cancelar ou tentar outra.
6. Remover (com confirmação): `PATCH /me` com `{ "user": { "remove_image": "true" } }`.

### Dados pessoais

- Campos `name` e `lastName`, enviados como `user[name]` e `user[last_name]` (JSON). O botão **Salvar alterações** só habilita com alteração; após salvar o formulário volta a ser a nova linha de base.
- E-mail e cargos não são editáveis (a API ignora esses campos).

### Troca de senha

- Campos: senha atual, nova senha (mínimo 6, regra do Devise) e confirmação. Envio: `PATCH /me/password` com `user[current_password|password|password_confirmation]`.
- Sucesso: formulário limpo e aviso de que os **outros dispositivos foram desconectados** (a sessão atual continua válida).
- Erros 422 tratados pelo `code` do corpo (`ApiError.apiCode`):

| `code` | Onde aparece |
|---|---|
| `invalid_current_password` | Campo "Senha atual": "A senha atual está incorreta." |
| `same_password` | Campo "Nova senha": "A nova senha deve ser diferente da atual." |
| `blank_password` | Campo "Nova senha": "Informe a nova senha." |
| `invalid` (e outros) | Alerta no formulário, com a mensagem da API. |

## Modelo do usuário

`Usuario.avatarUrl: string | null`, mapeado de `user.image_url` (`/login` e `/me`). URL relativa é completada com `VITE_API_URL`. A cópia salva no `localStorage` sem o campo continua válida (vira `null`).

## Testes

`pages/MinhaContaPage.test.tsx` cobre: dados e iniciais, prévia + upload multipart (`user[image]`), cancelar, tipo inválido, limite de 5 MB, remover (`remove_image`), edição de nome, validações e cada `code` da troca de senha. No jsdom o corpo é lido bruto (o `formData()` do MSW não aceita o `File` do jsdom).
