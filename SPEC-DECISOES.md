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
  - Definir senha: `PUT /password` com `{ user: { reset_password_token, password, password_confirmation } }`. O token do link (`/reset-password?reset_password_token=...`) **não é validado antes**: o formulário aparece direto e só a API o valida ao receber a senha (erro vem no próprio formulário; 404/410 mostram "Link expirado").
  - Permissões no formato `recurso.acao` (ex.: `users.create`, `roles.index`). O front mapeia `last_name` → `lastName`; `Usuario = {id, name, lastName, email, roles, permissions}`.
- **Persistência e F5:** token (`cakeflow.accessToken`) e cópia do usuário com as permissões (`cakeflow.user`) ficam no **localStorage**. Ao carregar: se há token, a aplicação usa a cópia para aparecer na hora (sem tela de carregamento) e revalida em seguida pelo `GET /me`, que confirma que o acesso segue ativo e atualiza dados e permissões (sobrescrevendo a cópia). Sem cópia válida (ou em formato antigo), mostra "Carregando o ateliê" até o `/me` responder.
  - `/me` com 401/403 → encerra a sessão (limpa token, usuário e cache). Falha de rede/500 com cópia salva → mantém a sessão e avisa por toast.
  - Logout em uma aba encerra as demais (evento `storage`). Uma resposta tardia do `/me` não reabre uma sessão já encerrada.
  - **Risco aceito:** localStorage é legível por scripts da página (XSS). Trocar por cookie HttpOnly, se o backend oferecer, mexe só em `storage/tokenStorage.ts` e `storage/usuarioStorage.ts`.
- **Permissões:** `useAuth().can("users.create")` só controla a UI (esconder/mostrar ações). A autorização real é do servidor.
- **Primeiro acesso:** apenas pelo link enviado (`/reset-password?reset_password_token=...`): mostra o formulário, envia a senha e volta ao login. Não há redirecionamento de senha pendente depois do login.
- **401:** o interceptor aciona o handler registrado pelo `AuthProvider` (encerra a sessão, limpa o cache e avisa por toast). Login, `/me`, convite e definir senha passam `skipUnauthorizedHandler` e tratam a falha por conta própria.
- **Convenção:** nomes de campos que trafegam na API são sempre em inglês; textos de tela, rótulos e mensagens em português.
- **Regra de senha** no front: mínimo de 8 caracteres e confirmação igual (o servidor é a validação definitiva).
- **Sem tela no design:** "Esqueci minha senha" não foi implementado.

## Paginação das listagens

- **Contrato da API:** `{ data: [...], meta: { page, limit, count, pages } }` (`count` = total de registros, `pages` = total de páginas). Tipos e utilitários em `services/http/pagination.ts` (`Paginated<T>`, `PageMeta`, `PageParams`, `mapPaginated`, `buscarTodas`).
- **`page` e `limit` opcionais:** os hooks de listagem (`useUsers`, `useRoles`) recebem `{ page?, limit? }`. Sem eles, vale a paginação padrão da API. A chave de cache inclui os parâmetros e a lista anterior fica na tela até a nova chegar (`keepPreviousData`).
- **Componentes de UI** (usam os mesmos nomes do `meta`):
  - `Pagination` — rodapé de tabela no padrão do design (feito para ir **dentro do `Card`** da tabela): resumo "Mostrando **a** a **b** de **N** {rotulo}" à esquerda; "Exibir [N por página]", Anterior, páginas numeradas (a atual em destaque, com reticências quando há muitas) e Próxima à direita. Props `page`, `limit`, `count`, `pages?`, `onPageChange`, `onLimitChange?`, `limits?`, `rotulo?`. O seletor de limite só aparece com `onLimitChange`. Se `pages` não vier, é calculado de `count` e `limit`. No celular só a página atual aparece e o seletor de limite some.
  - `LimitSelect` — seletor de itens por página, usável dentro do `Pagination` ou sozinho.

## Valores de seletores: texto no DOM, número na API

- A API manda ids numéricos e o DOM (`<option>`, Radix, rádio) só trabalha com texto. Todos os seletores (`Select`, `Combobox`, `ComboboxMulti`, `LimitSelect`, `Formulario.Select`/`SelectMulti`/`RadioBox`/`Combobox`/`ComboboxMulti`) aceitam `value: string | number` nas opções e **devolvem o valor no tipo original da opção**: passou número, recebe número. Os componentes de `ui/` são genéricos em `V` (`ComboboxOption<V>`, `SelectOption<V>`...).
- Resultado: o formulário guarda e envia o id como número, sem `String()`/`Number()` espalhados (ex.: `roleIds: number[]` no schema, direto para `role_ids`). Helpers em `ui/lib/valorDeOpcao.ts` (`paraTexto`, `mesmoValor`, `deTexto`). As comparações são por texto: `3` e `"3"` casam.
- Select nativo e rádio do `Formulario` passaram a ser controlados (`useController`), pois o RHF não converte texto em número nem marca opção numérica por conta própria. Efeito: o campo não recebe mais o foco automático ao falhar a validação (o `ref` do RHF não é repassado).
- Opção "vazia" continua `value: ""` (texto), e um Combobox limpo guarda `""`.

## Comboboxes com busca no servidor

- **Rota de options:** os seletores buscam em `GET /<recurso>/options?q=<termo>`. Para cargos: `rolesApi.options` / `useRoleOptions(termo)` (`GET /roles/options`). **Formato confirmado:** `{ data: [{ value, label, hint }] }` (`hint` pode ser `null`; a lista pura também é aceita), já no formato dos comboboxes; o parâmetro de busca é `q`. Só `rolesApi.options` conhece esse formato.
- **`onSearch` ligado = busca server-side:** `Combobox`/`ComboboxMulti` (e `Formulario.Combobox*`) deixam de filtrar `options` localmente; quem usa troca as opções. Sem `onSearch`, o filtro local continua. É chamado com `""` ao abrir e ao fechar.
- **Debounce:** `ui/lib/useDebounce.ts` (`useDebounce(valor, 300)`). Padrão: `onSearch={setBusca}`, `const termo = useDebounce(busca)`, `useRoleOptions(termo)`. A lista anterior fica visível enquanto a nova carrega (`keepPreviousData`).
- **Rótulo da opção escolhida:** o componente lembra as opções já clicadas, para o trigger/chip não perder o rótulo quando a busca tira a opção da lista. Para o que já vem escolhido (edição), passe `selectedOption` / `selectedOptions` (ex.: `user.roles`).

## Usuários e cargos (`domains/user-management`)

- **API** (campos em inglês, snake_case no JSON; o front converte para camelCase): `/users` e `/roles` com CRUD completo (index, show, create, update, destroy).
  - Usuário: `{ id, name, last_name, email, roles: [{id, name}], created_at }`. Envio: `{ user: { name, last_name, email, role_ids } }` no create e no update.
  - Cargo: `{ id, name, description, permissions: [{id, key, description}] }`. Envio: `{ role: { name, description, permission_ids } }`.
  - Os corpos são sempre aninhados em `user`/`role` (o Rails exige `params.expect(...)`); a atualização usa `PATCH`.
- **Telas:** `/administracao/usuarios` (lista paginada pela API, com ordenação só da página atual; convidar e editar em diálogo; excluir com confirmação), `/administracao/cargos` (lista) e `/administracao/cargos/novo` e `/:id` (formulário com matriz de permissões por recurso e "Todos"). Não há exclusão do próprio usuário na interface.
- **Permissões na interface:** o item Administração da sidebar (e cada filho), as rotas (`RequirePermission`) e os botões (Convidar, Editar, Excluir, Novo cargo) respeitam `can(...)`. As rotas exigem `users.index`, `roles.index`, `roles.create` e `roles.update`.
- **`cn()` e o tailwind-merge:** o `tailwind-merge` não conhece os tamanhos de fonte do design (`text-body-md`, `text-label-md`...) e os descartava quando vinham junto de uma cor. `ui/lib/cn.ts` agora os declara (e as sombras `warm/lift/modal`); ao criar um token novo de fonte ou sombra, acrescente-o lá. O estilo de campo somente leitura usa o atributo `readonly` (e não `:read-only`, que também pegava os gatilhos de Select, Combobox e DatePicker).
- **Exceção de fronteira:** `RequirePermission` (em `domains/auth/components`) é o único componente de outro domínio que os domínios podem importar, pois é infraestrutura de autenticação.
- **Erros da API:** `ApiError` agora lê `error`, `message`, `detail` e `errors` (lista ou por campo, estilo Rails).
- **Limitações conhecidas:**
  - O formulário de cargo lê o catálogo de `GET /permissions` (`usePermissions`), agrupado por recurso: `[{ resource, permissions: [{ id, value }] }]`. `resource` é o título do card e `value` o rótulo de cada caixa (exibidos como vêm da API, sem tradução no front). Ao editar, só as permissões do cargo aberto (`role.permissions`) vêm marcadas; o envio é `permission_ids` com os ids marcados. Aceita também a resposta embrulhada em `{ data }`. Cada recurso é um dropdown recolhível (começa fechado; o contador `marcadas/total` e o "Todos" ficam no cabeçalho). O `Checkbox` preenche em `primary` ao marcar; os ícones vêm das variáveis `--checkbox-check`/`--checkbox-dash` de `index.css` (não usar `bg-[url(...)]` em `cn()`: o tailwind-merge o confunde com cor e descarta o `bg-primary`).
  - A lista de usuários não tem busca nem filtro por cargo: com paginação no servidor, filtrar só a página atual enganaria. Voltam quando a API aceitar parâmetros de filtro (ex.: `q`, `role_id`).
  - A ordenação por coluna vale só para a página exibida.
  - O convite não mostra "convite pendente"/"senha definida": a API não devolve esse estado.

## Pendências

- Backend: expor o header `Authorization` via `Access-Control-Expose-Headers` (sem isso o navegador não deixa o front ler o token). Não há refresh token: ao expirar, o usuário entra de novo.
- Ícones: manter lucide ou carregar Material Symbols (nomes do designer: `skillet`, `cake`...).
- Componentes do designer ainda não criados: card de bolo, ticket de produção, telemetria do forno, timer badge, modal de confirmação com caixa de impacto, estados de feedback (carregando/erro). São de domínio ou de composição; criar junto dos domínios.
- Cartão do ateliê no rodapé da sidebar (o usuário e o botão Sair já estão na topbar).
- Filtros da listagem de usuários na API (busca por nome/e-mail e por cargo) para reativar a barra de filtros.
- `Tabs` não aparece como componente no design; criar se surgir necessidade (`Alert` já existe).
- Nome definitivo do domínio de exemplo (`user_management` → pasta `user-management`).
