# db/

Schema do banco (Postgres / Supabase).

- `migrations/0001_initial_schema.sql` — schema inicial: todas as tabelas do
  modelo de dados do CLAUDE.md.
- `migrations/0002_rls_lockdown.sql` — liga RLS em todas as tabelas (sem
  policies) e revoga os privilégios dos papéis públicos do Supabase
  (`anon`/`authenticated`), inclusive para tabelas futuras. Resultado: a API
  REST pública do Supabase fica totalmente negada; só o backend (chave
  secreta) acessa o banco.
- `migrations/0003_reminders.sql` — adiciona `appointments.reminder_sent_at`
  (controle do lembrete de WhatsApp ~2h antes). Sem ela, a confirmação
  funciona mas o job de lembrete só loga um aviso.

## Como aplicar no Supabase

1. Crie um projeto em https://supabase.com (plano free) — região `sa-east-1`
   (São Paulo) para menor latência.
2. No painel do projeto: **SQL Editor → New query**, cole o conteúdo do
   arquivo de migration e clique em **Run**.
3. Confira em **Table Editor**: as 8 tabelas devem aparecer (`users`,
   `services`, `appointments`, `appointment_services`, `fixed_appointments`,
   `blocked_times`, `business_hours`, `settings`).

## Convenções

- `weekday`: 0 = domingo … 6 = sábado (mesma convenção do `Date.getDay()` do JS).
- Momentos absolutos (`start_at` / `end_at`) em `timestamptz`; horários
  recorrentes (`business_hours`, `fixed_appointments`) em `time`, na hora
  local da barbearia.
- `services.duration_minutes` pode ser `null` → o slot usa
  `settings.default_slot_minutes` como fallback.
- Row Level Security ativo (0002): deny-all para `anon`/`authenticated`.
  Policies por papel não se aplicam enquanto o front não fala direto com o
  Supabase — a autorização por papel é feita no middleware do backend.
