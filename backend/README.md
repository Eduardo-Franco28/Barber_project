# Bryan Barbearia — API

API REST do app de agendamento (Node.js + Express).

## Rodar em desenvolvimento

```powershell
npm install
npm run dev
```

Antes de rodar, copie `.env.example` para `.env` e preencha `SUPABASE_URL` e
`SUPABASE_SECRET_KEY` (painel do Supabase → Settings → API). Sem isso o
servidor não sobe (fail-fast, com mensagem indicando o que falta).

O servidor sobe em `http://localhost:3000`. Health check: `GET /health` —
inclui o estado da conexão com o banco (`"database": "ok" | "error"`).

## Auth

- `POST /auth/register` — cria conta de **cliente** (cadastro público nunca cria barbeiro)
- `POST /auth/login` / `POST /auth/logout`
- `POST /auth/refresh` — renova a sessão
- `GET /auth/me` — usuário logado
- `PATCH /auth/me` — atualiza nome e WhatsApp
- `PATCH /auth/password` — troca de senha (exige a senha atual)

Tokens JWT em cookies httpOnly (access 15min, refresh 7 dias). A conta do
barbeiro é criada uma única vez via:

```powershell
node scripts/seed-barber.js "Nome" email senha telefone
```

## Serviços

- `GET /services` — autenticado; cliente vê só os ativos, barbeiro vê todos
- `POST /services` — só barbeiro
- `PATCH /services/:id` — só barbeiro (editar campos; desativar com `active: false`)

Sem DELETE: serviço já usado em agendamento não pode sumir do histórico —
desative com `active: false`. `duration_minutes: null` = usa o intervalo
padrão do barbeiro (`settings.default_slot_minutes`).

## Disponibilidade e agendamentos

- `GET /availability?date=AAAA-MM-DD&service_ids=uuid1,uuid2` — autenticado.
  Slots livres do dia (hora local da barbearia), já descontando agendamentos,
  fixos e bloqueios. Duração = soma dos serviços (sem duração → intervalo
  padrão do barbeiro).
- `POST /appointments` — só cliente. Body: `{ service_ids, date, time }`
  (hora local). Revalida a disponibilidade no servidor; horário ocupado → 409.
- `GET /appointments` — cliente vê os próprios; barbeiro vê a agenda dele
  (`?from=&to=`, default: hoje + 7 dias) com nome/telefone do cliente.
- `POST /appointments/:id/cancel` — cliente cancela o próprio até 2h antes;
  barbeiro cancela os seus quando precisar.

Regras (constantes em `services/availability.service.js` e
`appointments.service.js`): grade no passo do intervalo padrão; antecedência
mínima de 30min; horizonte de 60 dias; fuso via `BARBERSHOP_TIMEZONE`.

## Painel do barbeiro (todas as rotas só para `barber`)

- `GET/POST /fixed-appointments`, `DELETE /fixed-appointments/:id` — fixos semanais
- `GET/POST /blocked-times`, `DELETE /blocked-times/:id` — bloqueios (datas/horas locais no POST)
- `GET /business-hours`, `PUT /business-hours` — semana inteira de uma vez (7 dias)
- `GET /settings`, `PATCH /settings` — intervalo padrão (10–240 min)
- `POST /appointments/:id/done` — marca atendimento como concluído
- `GET /spreadsheet` — baixa a planilha `.xlsx` gerada na hora (sempre atual)

## Planilha Excel (espelho da agenda)

Gerada automaticamente em `data/agenda.xlsx` (mude com `EXCEL_FILE_PATH` no
`.env` — aceita caminho absoluto, ex. pasta do OneDrive). Uma aba por semana
(atual + 8), dias nas colunas, grade de horários nas linhas, célula = nome do
cliente; fixos aparecem como clientes, bloqueios em cinza itálico. O arquivo
é **regenerado inteiro do banco** a cada mudança (agendar, cancelar, fixos,
bloqueios, horários, intervalo) e no boot — nunca dessincroniza. Se estiver
aberto no Excel na hora da escrita, a atualização falha com log e é refeita
na próxima mudança. O espelho em disco pode ser desligado com
`EXCEL_MIRROR_ENABLED=false` (hospedagem com disco efêmero).

O barbeiro também baixa a planilha sempre atual pelo app via `GET /spreadsheet`
(gerada em memória na hora, sem depender do arquivo em disco). Deploy: ver
`DEPLOY.md` na raiz.

## Notificações WhatsApp (Evolution API)

Dois momentos: **na confirmação** do agendamento (cliente e barbeiro) e um
**lembrete ~2h antes** (job que varre a agenda a cada 5min). Sem as variáveis
`EVOLUTION_*` no `.env`, roda em **modo simulado**: as mensagens vão para o
log do servidor e nada é enviado — dá para desenvolver sem servidor Evolution.
Preenchendo o `.env`, passa a enviar de verdade (nenhuma mudança de código).

O lembrete precisa da migration `db/migrations/0003_reminders.sql` aplicada
(coluna `reminder_sent_at`). Sem ela, a confirmação funciona e o job só loga
um aviso pedindo para aplicar a migration.

## Estrutura (routes → controllers → services → repositories)

```
src/
├── server.js        # ponto de entrada
├── app.js           # montagem do Express (helmet, CORS, JSON, rotas, erros)
├── config/          # leitura de variáveis de ambiente
├── routes/          # endpoints → apontam para controllers
├── controllers/     # só request/response, sem regra de negócio
├── services/        # regra de negócio
├── repositories/    # acesso a dados (Supabase)
└── middlewares/     # 404 e tratamento central de erros (auth entra na etapa 4)
```
