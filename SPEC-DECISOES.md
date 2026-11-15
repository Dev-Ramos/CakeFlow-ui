# CakeFlow Frontend — Decisões de alinhamento

Complementa e **prevalece sobre** o SPEC inicial onde houver divergência.

## Ajustes ao SPEC

| Tema | Decisão |
|---|---|
| Pastas | Tudo minúsculo e kebab-case: `api/`, `hooks/`, `components/`, `types/`, `schemas/`, `pages/`. |
| Tailwind | v4 (`@tailwindcss/vite`, tokens em `@theme`, `tw-animate-css`). Sem `tailwind.config.js`. |
| Ícones | **`lucide-react`** (substitui React Icons do SPEC §2.4). |
| Variantes dos componentes | Definidas no arquivo de design system da aplicação (cva). Componentes de `ui/` apenas consomem; não definem estilo próprio. Até o arquivo chegar, usar placeholder neutro com o mesmo contrato. |
| `fold` | Normalização de acentos e caixa (NFD + remoção de diacríticos + lowercase). Implementado agora; documentado após a implementação. |
| Env | Um único `.env` na raiz. `config/env.ts` valida com Zod e é o único ponto que lê `import.meta.env`. `.env.example` versionado. |
| Barrels | Proibidos, exceto a fronteira pública de `ui/chart` e `ui/toast`. |
| Router | React Router v7, modo declarativo, `React.lazy` por rota. |
| Tipos da API | Manuais por domínio (API local, contratos conhecidos). |
| Idioma | Somente pt-BR. Sem lib de i18n. Helpers de moeda (BRL) e data em `ui/lib`. |
| Testes | Vitest (jsdom) + React Testing Library + MSW v2. Sem e2e por ora. |
| DataTable | Modelo de referência será fornecido; decidir (TanStack Table ou não) após recebê-lo. |

## Fronteiras

- Direção das dependências: `app → domains → ui`; `domains → services`. `ui/` e `services/` não importam nada acima.
- Impor via ESLint (`no-restricted-imports`).
- **Domínio ↔ domínio:** permitido consumir `api/` e `hooks/` de outro domínio. Não importar `components/` nem `pages/` de outro domínio.
- Rotas: cada domínio exporta as suas (`domains/<x>/routes.tsx`); `app/routes` só compõe.
- Interceptor 401: `services/http/interceptors.ts` expõe `setUnauthorizedHandler(fn)`, registrado pelo `AuthProvider`. O service não importa React nem `ui`.
- Toast de erro global: configurado no `QueryClient` (`MutationCache.onError`) em `app/`.
- `ApiError` normalizado em `services/http/errors.ts`. Mapeamento de erros de campo para React Hook Form **fora de escopo** por ora.

## Domínios

- `auth` (JWT).
- `user-management` — domínio de exemplo do CRUD completo (listar, criar, editar, excluir).
- Previstos: clientes, produtos/receitas, insumos/estoque, pedidos, produção (sem kanban/drag and drop).

## Componentes de UI (portados do projeto anterior)

- **Estilo centralizado** em `ui/design-system/`: `variants.ts` (cva do `Button` e base dos controles de campo) e `tokens.css` (tokens semânticos). Os componentes só consomem; para aplicar o design system, troque esses dois arquivos.
- **DataTable próprio** (sem TanStack Table): ordenação client-side só da página corrente; filtro, paginação e ordenação reais são do backend.
- **Toast** via Sonner: `toast.success/error/warning/info` (`@/ui/toast/toast`). Mutations exibem toast global de erro; `meta: { silenciarToast: true }` desliga.
- **Confirm** (`useConfirm`) sobre AlertDialog; `FormDialog` depende dele (`ConfirmProvider` na raiz).
- **Formulario** usa `Field` como estrutura única (ids `-hint`/`-erro`); `Formulario.Textarea` foi adicionado.
- Sem barrels: importar direto do arquivo (`@/ui/components/formulario/Formulario`).
- Correções em relação ao original: ids de `aria-describedby` unificados (Combobox/DatePicker apontavam para ids que o `Campo` não gerava); handlers do Checkbox encadeados; nulos sempre por último na ordenação descendente; `Button loading` desabilita mesmo com `disabled={false}`; `FilterBar` usava `col-span-full` em container flex.
- Removido por ser do projeto anterior: busca em caixa alta no Combobox, helper de segundos→horas, tokens de ocupação de armazém, `PaginatedResponse`/`linhasDe` (aguardam o contrato real da API).

## Design system "Artisanal Confectionery Workflow" (aplicado)

Origem: `DESIGN.md`, `COMPONENTES.md` e `tokens.css` do designer. Tudo em `src/ui/design-system/`:

- `tokens.css` — tokens em `@theme` (Tailwind v4): cores M3 (`primary`, `on-surface`, `surface-container-*`, `outline-variant`...), marca (`brand-*`, `ink*`), famílias funcionais (`oven`, `success`, `info`, `danger`), 17 status de produção (`bg-status-{key}`, `text-status-{key}-fg`, `border-status-{key}-bd`), tipografia (`text-headline-*`, `text-body-*`, `text-label-*`), sombras (`shadow-warm/lift/modal`), `scrim`. Fonte Nunito Sans via `index.html`.
- `variants.ts` — `buttonVariants` (primary, secondary, tonal, danger, caramel, ghost, neutral; sizes md/sm/icon), `controlBase`/`controlHeight` (campos 42px) e `badgeVariants`.
- Vocabulário de classes dos componentes migrado para o do designer (`bg-surface-container-lowest`, `text-on-surface`, `border-outline-variant`, `rounded-lg/xl`, `shadow-modal`...). Focos em `primary`; erro em `error`.

Decisões nas divergências do designer (seguimos as **telas** / `COMPONENTES.md`):

| Divergência | Decisão |
|---|---|
| Primária #D6456B × #AD244E | `primary` = #ad244e (token M3, como nas telas). #d6456b fica como `brand-strawberry`. |
| Raios | Escala padrão do Tailwind (lg 8px, xl 12px). |
| Fundo | `background` #fff8f6. |
| Sidebar | 256px (desktop), 72px (tablet), drawer (celular). |
| Botão outline | 2px. |
| Status | 17 estados específicos em tokens. Estados são de domínio: `ui/Badge` só tem tons genéricos; o domínio aplica as cores via `className`. |
| Ícones | Mantido `lucide-react` (decisão anterior). Material Symbols do designer não está carregado. |

Estrutura nova: `ui/components` ganhou `Card`, `Badge`, `Chip`, `PageShell`, `PageHeader`; `app/layouts` ganhou `AppLayout`, `Sidebar`, `Topbar`, `AuthLayout` e `navItems.ts` (módulos do design; rotas ainda caem em "Em construção").

## Autenticação (implementada)

- **Onde mora:** `AuthProvider`, `useAuth` e as telas ficam em `domains/auth/`, não em `app/`. Motivo: domínios não podem importar `app/` (regra de fronteira) e o login precisa atualizar o estado de sessão. `app/` só compõe (`AppProviders`, `ProtectedRoute`, `AppRoutes`). Isso substitui o `AuthProvider` em `app/providers` do SPEC original.
- **Contrato** (isolado em `domains/auth/types/auth.ts` e `api/authApi.ts`; campos em inglês, como a API espera):
  - `POST /login {email, password}` → corpo `{ user: {id, name, last_name, email}, roles: string[], permissions: string[] }`; o **token vem no header `Authorization`** da resposta (aceita `Bearer <token>` ou o token puro). O backend precisa expor esse header via `Access-Control-Expose-Headers` para o navegador conseguir lê-lo.
  - `GET /me` → mesmo formato do login.
  - `GET /convites/:token` → `{ name, email }` (formato ainda não confirmado) e `POST /auth/definir-senha {token, password}`.
  - Permissões no formato `recurso.acao` (ex.: `users.create`, `roles.index`). O front mapeia `last_name` → `lastName`; `Usuario = {id, name, lastName, email, roles, permissions}`.
- **Persistência e F5:** token (`cakeflow.accessToken`) e cópia do usuário com as permissões (`cakeflow.user`) ficam no **localStorage**. Ao carregar: se há token, a aplicação usa a cópia para aparecer na hora (sem tela de carregamento) e revalida em seguida pelo `GET /me`, que confirma que o acesso segue ativo e atualiza dados e permissões (sobrescrevendo a cópia). Sem cópia válida (ou em formato antigo), mostra "Carregando o ateliê" até o `/me` responder.
  - `/me` com 401/403 → encerra a sessão (limpa token, usuário e cache). Falha de rede/500 com cópia salva → mantém a sessão e avisa por toast.
  - Logout em uma aba encerra as demais (evento `storage`). Uma resposta tardia do `/me` não reabre uma sessão já encerrada.
  - **Risco aceito:** localStorage é legível por scripts da página (XSS). Trocar por cookie HttpOnly, se o backend oferecer, mexe só em `storage/tokenStorage.ts` e `storage/usuarioStorage.ts`.
- **Permissões:** `useAuth().can("users.create")` só controla a UI (esconder/mostrar ações). A autorização real é do servidor.
- **Primeiro acesso:** apenas pelo link de convite (`/definir-senha?token=...`): valida o token, define a senha e volta ao login; link inválido/expirado mostra "Link expirado". Não há redirecionamento de senha pendente depois do login.
- **401:** o interceptor aciona o handler registrado pelo `AuthProvider` (encerra a sessão, limpa o cache e avisa por toast). Login, `/me`, convite e definir senha passam `skipUnauthorizedHandler` e tratam a falha por conta própria.
- **Convenção:** nomes de campos que trafegam na API são sempre em inglês; textos de tela, rótulos e mensagens em português.
- **Regra de senha** no front: mínimo de 8 caracteres e confirmação igual (o servidor é a validação definitiva).
- **Sem tela no design:** "Esqueci minha senha" não foi implementado.

## Pendências

- Backend: expor o header `Authorization` via `Access-Control-Expose-Headers` (sem isso o navegador não deixa o front ler o token). Confirmar o formato de `GET /convites/:token` e o caminho `POST /auth/definir-senha`. Não há refresh token: ao expirar, o usuário entra de novo.
- Ícones: manter lucide ou carregar Material Symbols (nomes do designer: `skillet`, `cake`...).
- Componentes do designer ainda não criados: card de bolo, ticket de produção, telemetria do forno, timer badge, modal de confirmação com caixa de impacto, estados de feedback (carregando/erro). São de domínio ou de composição; criar junto dos domínios.
- Cartão do ateliê no rodapé da sidebar (o usuário e o botão Sair já estão na topbar).
- Contrato de paginação da API (shape de listagem paginada).
- `Tabs` não aparece como componente no design; criar se surgir necessidade (`Alert` já existe).
- Nome definitivo do domínio de exemplo (`user_management` → pasta `user-management`).
