# CLAUDE.md — Bryan Barbearia (app de agendamento)

> Este arquivo é lido automaticamente pelo Claude Code a cada sessão. Mantenha-o
> atualizado conforme as decisões forem tomadas.

---

## Sobre o projeto

Software **web** de agendamento para uma barbearia.

**Problema:** hoje o barbeiro controla os atendimentos numa planilha de Excel
manual, o que torna difícil para os clientes marcarem horário e para ele
organizar a agenda.

**Solução:** um sistema onde o cliente marca o próprio horário escolhendo um
ou mais serviços, e o barbeiro gerencia agenda, serviços e bloqueios —
mantendo a compatibilidade com o fluxo antigo via exportação para Excel.

**Escopo inicial (MVP):** um único barbeiro (o dono). Modelar os dados de forma
que suportar múltiplos barbeiros no futuro não exija reescrita, mas **não**
implementar multi-barbeiro agora.

---

## Stack

- **Front-end:** React (SPA)
- **Back-end:** Node.js + Express (API REST)
- **Banco de dados:** Supabase (Postgres gerenciado — escolhido para não pagar
  hospedagem de banco). A conexão com o Supabase será integrada numa fase
  futura; até lá, o back-end deve abstrair o acesso a dados atrás de uma camada
  de repositório para facilitar a troca.
- **Auth:** JWT

---

## Arquitetura

- API REST em Express, separada por camadas: `routes → controllers → services →
  repositories`. A regra de negócio fica nos services; os controllers só lidam
  com request/response.
- Toda a autorização (checagem de papel) é feita **no back-end** via middleware.
  O front esconde/mostra telas por conveniência, mas **nunca** é a fonte de
  verdade de permissão.
- Camada de repositório isola o acesso ao Supabase, para que a troca da
  implementação de dados não afete os services.

---

## Modelo de dados

> Confirmado em 2026-07-02 — schema em `backend/db/migrations/0001_initial_schema.sql`.

- **users** — `id`, `name`, `email` (único), `phone` (WhatsApp, para
  notificações), `password_hash`, `role` (`barber` | `client`), `created_at`
- **services** — `id`, `name`, `duration_minutes`, `price`, `active`,
  `created_at`
- **appointments** — `id`, `client_id` (FK users), `barber_id` (FK users —
  no MVP sempre o dono; já pronto para multi-barbeiro), `start_at`, `end_at`,
  `status` (`scheduled` | `done` | `canceled`), `created_at`
  - Um agendamento pode ter **um ou mais serviços** (ex: corte + barba no
    mesmo horário). A duração total do agendamento é a soma da duração dos
    serviços escolhidos.
- **appointment_services** — tabela de junção: `id`, `appointment_id` (FK
  appointments), `service_id` (FK services). Permite N serviços por
  agendamento.
- **fixed_appointments** — atendimentos recorrentes do barbeiro, para
  reservar slots que se repetem: `id`, `barber_id` (FK users), `client_name`
  (texto livre — cliente fixo pode não ter conta no app), `weekday`
  (0=domingo … 6=sábado), `start_time`, `duration_minutes`, `active`,
  `created_at`
- **blocked_times** — bloqueios de agenda: `id`, `barber_id` (FK users),
  `start_at`, `end_at`, `reason`
- **business_hours** — configuração do horário de funcionamento, definida pelo
  barbeiro (ex: por dia da semana, `open_time` / `close_time`, ou `closed` se
  não atende naquele dia). Usada junto com `services.duration_minutes` para
  calcular os slots disponíveis.
- **settings** — tabela própria, uma linha por barbeiro (`barber_id` como
  PK): intervalo padrão entre horários (`default_slot_minutes`, default 50),
  configurável pelo barbeiro. Serve como fallback quando o serviço não tem
  duração própria definida.

`duration_minutes` de cada serviço define o tamanho do slot que ele ocupa. Se
o cliente escolher **mais de um serviço** no mesmo agendamento, a duração
total é a **soma** das durações (ex: Corte 50min + Barba 30min = 80min
bloqueados na agenda). O intervalo **padrão** entre horários é de **50
minutos**, configurável pelo barbeiro (`default_slot_minutes` em `settings`)
e usado como fallback para serviços sem duração própria definida. A
disponibilidade de um horário é calculada a partir de: `business_hours` +
appointments (com a duração somada dos seus serviços) + fixed_appointments +
blocked_times.

**Mudanças de configuração (horário de funcionamento / intervalo padrão) só
afetam agendamentos futuros ainda não marcados** — agendamentos já
confirmados permanecem como estavam no momento da marcação.

---

## Funcionalidades por papel

### Barbeiro (`barber`)
- Dashboard informativo (visão geral dos atendimentos)
- Ver seus atendimentos (agenda)
- Adicionar / editar / desativar serviços
- Cadastrar atendimentos fixos (recorrentes)
- Cadastrar horários bloqueados
- Configurar **horário de funcionamento** (dias e horários que atende)
- Configurar o **intervalo padrão entre horários** (default 50min, podendo
  variar por serviço)
- Exportar/sincronizar a agenda para uma planilha Excel no padrão antigo

### Cliente (`client`)
- Marcar horário escolhendo **um ou mais serviços** disponíveis (duração do
  agendamento = soma dos serviços escolhidos)
- Ver/cancelar os próprios agendamentos

### Ambos
- Login e cadastro
- Tela de perfil: logout, alterar nome, alterar senha

---

## Segurança (requisitos obrigatórios)

Segurança é prioridade explícita do projeto. Tratar estes itens como
requisitos, não como "nice to have":

**Autenticação**
- Senhas com hash usando **bcrypt** (cost ≥ 12) ou **argon2**. Nunca armazenar
  ou logar senha em texto puro.
- JWT com expiração curta no access token. Avaliar refresh token para renovar
  sessão sem novo login.
- Preferir armazenar o token em **cookie httpOnly + Secure + SameSite** em vez
  de `localStorage`, para reduzir superfície de XSS. Se usar `localStorage`,
  documentar o trade-off.
- Segredo do JWT em variável de ambiente, **nunca** hardcoded no código.

**Autorização**
- RBAC (`barber` / `client`) validado em middleware no back-end, em toda rota
  protegida. O cliente nunca acessa endpoints do barbeiro, e cada usuário só
  acessa os próprios dados.

**Dados e entrada**
- Validar e sanitizar toda entrada no back-end (ex: `zod` ou `express-validator`).
  Nunca confiar no front.
- Usar sempre queries parametrizadas / o client oficial do Supabase — nunca
  concatenar SQL com string.
- Ativar **Row Level Security (RLS)** no Supabase e escrever policies por papel.
  RLS é a última linha de defesa mesmo se a API tiver bug.
- Nunca retornar `password_hash` nem campos sensíveis nas respostas da API.

**Infra / transporte**
- HTTPS obrigatório em produção.
- CORS restrito à origem do front (sem `*` em produção).
- Rate limiting nas rotas de auth (login/cadastro) contra força bruta.
- Secrets (JWT, chaves do Supabase) apenas em `.env`, com `.env` no
  `.gitignore`. Fornecer um `.env.example` sem valores reais.
- Headers de segurança via `helmet`.

**Boas práticas gerais**
- Mensagens de erro de login genéricas ("credenciais inválidas"), sem revelar
  se o e-mail existe.
- Não vazar stack trace nem detalhes internos em respostas de erro.

---

## Integração com Excel

- A planilha é **atualizada automaticamente a cada novo agendamento** (não é
  exportação manual sob demanda) — ao criar/cancelar um agendamento, a
  planilha reflete a mudança em seguida.
- **Formato da planilha (padrão antigo do barbeiro):** layout simples —
  **dias da semana nas colunas** (topo), e cada **célula = um horário**,
  contendo o nome do cliente agendado naquele slot. Basicamente uma grade
  dia × horário.
  - Estrutura sugerida: coluna A = horário (linhas fixas, ex: 08:00, 08:30,
    09:00...), colunas seguintes = um dia da semana cada, célula preenchida
    com o nome do cliente (ou vazia se livre).
  - Célula mostra **apenas o nome do cliente** (sem o serviço junto).
- Usar `exceljs` no back-end para ler/escrever o arquivo, atualizando a célula
  correspondente ao horário/dia do agendamento a cada mudança.
- Objetivo: o barbeiro pode continuar olhando a planilha no formato que já
  conhece, mesmo usando o app por baixo.

---

## Notificações via WhatsApp

- Lembrete de agendamento enviado tanto para o **cliente** quanto para o
  **barbeiro**, em dois momentos:
  1. **Na confirmação** — assim que o agendamento é criado.
  2. **~2 horas antes** do horário marcado — lembrete de proximidade.
     Isso exige um job agendado (ex: `node-cron` ou fila com verificação
     periódica) que varre os agendamentos e dispara a mensagem quando faltar
     ~2h para o horário.
- **Provedor: Evolution API** (open source, self-hosted) — é a opção de
  **menor custo**, já que você paga só o servidor onde ela roda (na faixa de
  R$50–200/mês) em vez de pagar por mensagem enviada.
  - **Trade-off a ter em mente:** Evolution API não é a API oficial da Meta —
    ela conecta como se fosse um WhatsApp Web automatizado. Isso significa
    risco (baixo, mas real) de o número ser bloqueado pelo WhatsApp se enviar
    volume alto ou mensagens muito repetidas/rápidas. Para o volume de uma
    barbearia (poucas dezenas de lembretes por dia), o risco é baixo, mas vale
    usar um número dedicado (não o pessoal do barbeiro) e não meta.
  - Alternativa caso o risco de bloqueio pese: **Z-API** (também brasileira,
    preço baixo, mas cobra por uso) — mais estável que self-host, ainda mais
    barata que Twilio/API oficial da Meta.
- Mensagem deve ser simples e direta: dia, horário e serviço (para o cliente),
  e dia, horário, cliente e serviço (para o barbeiro).
- Número de WhatsApp do cliente precisa ser coletado no cadastro (campo
  adicional em `users`).

---

## Design system

**Estilo:** barbearia minimalista/moderna — preto e branco puro, tipografia
sans-serif geométrica, muito espaço em branco, visual clean, quase editorial.
Não é o estilo "old school" de barbearia (sem textura vintage, sem serifa,
sem elementos tipo navalha/listras retrô).

- **Cores:** apenas preto (`#000000` ou próximo) e branco (`#FFFFFF`), sem
  paleta colorida de apoio. Tons de cinza permitidos como intermediários
  (bordas, texto secundário, estados disabled), mas a identidade é P&B puro.
- **Tema claro/escuro (2026-07-04):** a mesma identidade P&B em dois modos,
  via `data-theme` no `<html>` + tokens semânticos em `tokens.css`
  (`--bg/--surface/--text/--border/--accent`…). O modo escuro é o P&B
  invertido (fundo quase-preto, ação quase-branca), não uma paleta nova.
  Alternância por um botão no topo (sol/lua), respeitando `prefers-color-scheme`
  no primeiro acesso e persistindo a escolha em `localStorage` (script
  anti-flash no `index.html`).
- **Tipografia:** confirmada (2026-07-03): **Space Grotesk** (títulos/marca)
  + **Inter** (texto/UI), via Google Fonts. Hierarquia bem marcada por peso e
  tamanho, não por cor.
- **Espaçamento:** generoso, "respirando" — evitar densidade de informação.
  Preferir menos elementos por tela, bem espaçados, a muitos elementos
  apertados.
- **Contraste funcional:** usar preto sólido sobre branco (ou vice-versa) para
  guiar a ação principal de cada tela — ex: botão de "Marcar horário" em
  preto sólido, se destacando do resto que fica mais neutro/outline.
- **Componentes:** cards e botões com cantos retos ou levemente arredondados
  (não usar border-radius exagerado, isso foge do tom editorial/clean).
  Bordas finas em vez de sombras pesadas, quando precisar separar elementos.
- **Evitar:** gradientes, cores de destaque (nada de azul/verde "de sistema"),
  ícones coloridos, excesso de sombra/blur, qualquer coisa que pareça
  "template genérico de agendamento".

---

## Convenções de código

- Código limpo e pronto para produção, sem gambiarra temporária sem comentário.
- Front-end com design system consistente definido cedo (cores, tipografia,
  componentes de card/botão reutilizáveis) antes de sair espalhando estilo.
- Nomes de variáveis e commits em português ou inglês — **escolher um e manter**
  (sugestão: código em inglês, textos de UI em português).
- Componentes React pequenos e focados; lógica de dados fora do JSX.
- Tratar estados de erro renderizando no próprio JSX (mensagem visível), não em
  `alert()`.

---

## Como trabalhar comigo (Claude Code)

- Ao pedir uma feature, referencie o papel (barbeiro/cliente) e a tela.
- Preferir avançar uma fatia funcional por vez (um endpoint + a tela que o
  consome) em vez de tudo de uma vez.
- Ao mexer em auth ou permissões, revisar a seção de Segurança acima antes de
  implementar.
- Quando eu inventar algo genérico que não bate com o design system, me corrija
  que eu ajusto sem reexplicar tudo.

---

## Decisões já confirmadas

- Nome do app: **Bryan Barbearia**.
- Conta é **obrigatória** para o cliente agendar (sem agendamento anônimo).
- Planilha é atualizada **automaticamente** a cada agendamento (não é exportação
  manual). Formato: dias nas colunas, horários nas linhas, célula = **apenas o
  nome do cliente**.
- Intervalo entre horários: **50 minutos por padrão**, mas configurável pelo
  barbeiro e por serviço.
- Horário de funcionamento: configurável pelo barbeiro (entidade
  `business_hours`), não é fixo no código.
- Mudanças de horário de funcionamento / intervalo padrão **só afetam
  agendamentos futuros ainda não marcados** — agendamentos já confirmados não
  mudam retroativamente.
- Um agendamento pode ter **mais de um serviço** (ex: corte + barba), com
  duração total = soma das durações dos serviços escolhidos.
- Notificação de WhatsApp para cliente e barbeiro, em dois momentos: na
  confirmação do agendamento e ~2h antes do horário. Provedor: **Evolution API**
  (menor custo — ver seção de Notificações para o trade-off de risco).
- Modelo de dados confirmado (2026-07-02): `barber_id` desde já em
  appointments, fixed_appointments, blocked_times, business_hours e settings
  (multi-barbeiro futuro sem reescrita); `fixed_appointments` guarda o nome
  do cliente em texto livre; `settings` tem uma linha por barbeiro; `weekday`
  usa 0=domingo … 6=sábado (convenção do JS); constraint de exclusão no banco
  impede double-booking do mesmo barbeiro (última linha de defesa).
- Auth implementada (2026-07-03): argon2id para hash de senha; zod para
  validação de entrada; access token JWT de 15min + refresh de 7 dias, ambos
  em cookie httpOnly SameSite=Lax (Secure em produção), refresh restrito ao
  path `/auth`; refresh **stateless** — sem revogação server-side no MVP
  (trade-off aceito; logout limpa os cookies); cadastro público sempre cria
  `client`, barbeiro criado por `backend/scripts/seed-barber.js` (que também
  cria settings e horário padrão seg–sáb 09–19); rate limit: login 5
  falhas/15min, cadastro 10/h, refresh 60/15min.
- RLS ativado (2026-07-03, migration 0002): estratégia **deny-all** — RLS
  ligado em todas as tabelas SEM policies + privilégios de
  `anon`/`authenticated` revogados (inclusive default privileges para tabelas
  futuras). Como o front nunca fala direto com o Supabase e o backend usa a
  chave secreta (bypassa RLS) com RBAC em middleware, policies por papel no
  PostgREST não se aplicam — se um dia o front acessar o Supabase direto,
  escrevê-las na 0002.
- CRUD de serviços (2026-07-03): `GET /services` autenticado — cliente vê só
  ativos, barbeiro vê todos (inclusive desativados); criar/editar/desativar
  só barbeiro; **sem DELETE** — serviço usado não pode sumir do histórico,
  desativa com `active: false`; campos da API em snake_case (mesmo formato
  das linhas do banco).
- Disponibilidade/agendamentos (2026-07-03): fuso fixo da barbearia via
  `BARBERSHOP_TIMEZONE` (default America/Sao_Paulo; horários de funcionamento
  e fixos são hora local, appointments ficam em UTC); slots numa **grade** no
  passo do `default_slot_minutes` a partir da abertura (mesmas linhas da
  planilha); antecedência mínima p/ marcar: 30min; horizonte: 60 dias;
  cliente cancela até **2h antes**, barbeiro cancela sem restrição; só
  cliente marca pelo app (barbeiro usa fixos/bloqueios); POST revalida a
  disponibilidade no servidor e a constraint de exclusão cobre a corrida
  (23P01 → 409); sem transação no PostgREST — agendamento órfão é desfeito
  por compensação se o vínculo de serviços falhar.
- Front-end (2026-07-03): Vite + React 19 + react-router, **JavaScript** (sem
  TS, mesmo padrão do backend); CSS puro com tokens em
  `frontend/src/styles/` (sem Tailwind/lib de UI); fontes Space Grotesk +
  Inter; **erros de formulário em preto** (faixa com borda esquerda grossa) —
  sem vermelho, fiel ao P&B; sessão restaurada no boot via GET /auth/me com
  renovação automática no 401 (fetch com credentials include); rotas: /login,
  /agendar (client), /painel (barber), redirect por papel na raiz.
- Painel do barbeiro (2026-07-03): endpoints barber-only para fixos
  (GET/POST/DELETE — sem edição: remove e recria), bloqueios
  (GET/POST/DELETE; POST recebe data/hora locais e converte p/ UTC),
  horário de funcionamento (PUT da semana inteira, upsert nos 7 dias; dia sem
  linha = fechado) e settings (PATCH, 10–240min); `POST /appointments/:id/done`
  marca concluído (só o próprio barbeiro, sem restrição de horário);
  confirmações destrutivas na UI em dois cliques no próprio botão (sem
  window.confirm); painel em 4 abas: Agenda (dia a dia + contadores hoje/7
  dias), Serviços, Fixos & bloqueios, Horários.
- Perfil (2026-07-03): `PATCH /auth/me` atualiza nome **e WhatsApp** (o
  telefone alimenta as notificações da etapa 11); `PATCH /auth/password`
  exige a senha atual (verificação argon2; erro 400 — não 401 — para não
  parecer sessão expirada; rate limit 10/15min); com refresh stateless,
  trocar a senha NÃO derruba sessões já abertas (trade-off da etapa 4);
  rota /perfil para ambos os papéis, link "Perfil" no topo.
- Planilha Excel (2026-07-04): estratégia **espelho** — o arquivo inteiro é
  regenerado do banco (semana atual + 8 abas, seg→dom nas colunas, grade do
  intervalo padrão nas linhas) a cada mudança de agenda e no boot, em vez de
  editar célula a célula; escrita assíncrona com debounce de 500ms fora do
  caminho da resposta HTTP (arquivo aberto no Excel = falha logada, refeita
  na próxima mudança); caminho via `EXCEL_FILE_PATH` (default
  `backend/data/agenda.xlsx`, ignorado no git); fixos aparecem com o nome do
  cliente, bloqueios em cinza itálico com o motivo, cancelado some da célula;
  `done` continua exibido (o atendimento aconteceu).
- Redesign + tema claro/escuro (2026-07-04): visual elevado mantendo o P&B
  editorial — superfícies com profundidade sutil (bg off-white / cards
  brancos no claro; quase-preto / cards levemente elevados no escuro),
  tipografia mais forte, números tabulares (horários/preços/estatísticas),
  micro-interações (hover/press nos botões e slots), topbar fixa. Sistema de
  temas por `data-theme` + tokens semânticos; toggle sol/lua no topo (e no
  canto do login), `prefers-color-scheme` no 1º acesso, persistido em
  localStorage, script anti-flash no index.html. `color-scheme` por tema faz
  os controles nativos (date/time/checkbox) adotarem o modo. Verificado no
  navegador nos dois temas (login, agenda do cliente, painel do barbeiro).
- Otimização mobile (2026-07-04): mobile é o **principal meio de uso**.
  Refinos em `@media (max-width: 640px)`: formulários do painel empilham (1
  campo por linha) com botão full-width; barra de confirmação do agendamento
  empilha (resumo em cima, CTA full-width); abas do painel sangram até as
  bordas (`--page-x`) e rolam lateralmente (4 abas > tela); horário de
  funcionamento com o dia numa linha e "09:00 às 19:00" abaixo; estatísticas
  dividem a linha igualmente; alvos de toque maiores. Proteções contra
  vazamento horizontal (min-width:0 em itens flex de texto). Sem rolagem
  horizontal da página de 320px pra cima; verificado no navegador em 375px e
  320px, console limpo.
- Notificações WhatsApp (2026-07-04): Evolution API com **modo simulado** por
  padrão — sem `EVOLUTION_API_URL/API_KEY/INSTANCE` no `.env`, as mensagens
  vão para o log e nada é enviado (dá para desenvolver sem servidor); ativar é
  só preencher o `.env`, sem mudar código; confirmação (cliente + barbeiro)
  disparada na criação do agendamento como **fire-and-forget** (nunca derruba
  a request); lembrete ~2h antes via job `setInterval` de 5min (sem dep
  externa de cron), que **marca `reminder_sent_at` antes de enviar** (no
  máximo um lembrete por agendamento, mesmo se o envio falhar) e pula
  agendamentos criados já dentro da janela de 2h; telefones ganham prefixo 55;
  precisa da migration 0003 (coluna `reminder_sent_at`) — sem ela a
  confirmação funciona e o job só loga aviso.
- Download da planilha + deploy (2026-07-06): `GET /spreadsheet` (barber-only)
  gera o xlsx **em memória na hora** (`excel.service.generateBuffer`) e envia
  como download — sempre a versão atual; "atualizar" = baixar de novo (um
  arquivo salvo é uma foto; a agenda do app é a versão ao vivo). Botão "Baixar
  planilha" na aba Agenda (fetch com credentials + refresh no 401 → blob). O
  espelho em disco virou opcional (`EXCEL_MIRROR_ENABLED`, desligar no Render).
  Prontidão p/ Vercel(front)+Render(back): CORS multi-origem por env, cookie
  `SameSite=None`+Secure em produção (`COOKIE_SAMESITE` p/ sobrescrever),
  `trust proxy` em prod; `frontend/vercel.json` (rewrite SPA); guia em
  `DEPLOY.md`. Caveats documentados: Render free dorme (lembrete ~2h pode
  pular), e cookie de terceiros pode falhar no Safari/iOS → recomendado
  domínio próprio (api. + app.) para cookie same-site.
