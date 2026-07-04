-- Bryan Barbearia — schema inicial
-- Alvo: Postgres 15+ (Supabase). Aplicação: SQL Editor do Supabase (ver db/README.md).
-- MVP tem um único barbeiro, mas todas as tabelas de agenda carregam barber_id
-- desde já para suportar múltiplos barbeiros no futuro sem reescrita
-- (decisão confirmada em 2026-07-02).

begin;

create extension if not exists btree_gist;

-- ── users ────────────────────────────────────────────────────────────────
create table users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text not null, -- WhatsApp, usado nas notificações (etapa 11)
  password_hash text not null,
  role          text not null default 'client' check (role in ('barber', 'client')),
  created_at    timestamptz not null default now()
);

-- Unicidade case-insensitive: o app normaliza para minúsculas; o índice garante.
create unique index users_email_unique_idx on users (lower(email));

-- ── services ─────────────────────────────────────────────────────────────
create table services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  -- null → usa settings.default_slot_minutes como fallback (regra do CLAUDE.md)
  duration_minutes integer check (duration_minutes > 0),
  price            numeric(10, 2) not null check (price >= 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ── appointments ─────────────────────────────────────────────────────────
-- end_at é gravado na criação (soma das durações dos serviços escolhidos);
-- mudanças posteriores de serviço/configuração não alteram agendamentos já
-- marcados (regra do CLAUDE.md).
create table appointments (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references users (id) on delete restrict,
  barber_id  uuid not null references users (id) on delete restrict,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  status     text not null default 'scheduled'
             check (status in ('scheduled', 'done', 'canceled')),
  created_at timestamptz not null default now(),

  check (end_at > start_at),

  -- Última linha de defesa contra double-booking: dois agendamentos
  -- 'scheduled' do mesmo barbeiro não podem se sobrepor no tempo.
  -- A validação principal de disponibilidade fica no service (etapa 7).
  constraint appointments_no_overlap exclude using gist (
    barber_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status = 'scheduled')
);

create index appointments_barber_start_idx on appointments (barber_id, start_at);
create index appointments_client_start_idx on appointments (client_id, start_at);

-- ── appointment_services (N serviços por agendamento) ────────────────────
create table appointment_services (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id) on delete cascade,
  service_id     uuid not null references services (id) on delete restrict,

  unique (appointment_id, service_id)
);

create index appointment_services_service_idx on appointment_services (service_id);

-- ── fixed_appointments (recorrentes: dia da semana + horário) ────────────
-- Cliente fixo pode não ter conta no app → nome em texto livre.
-- weekday: 0 = domingo … 6 = sábado (mesma convenção do Date.getDay() do JS).
create table fixed_appointments (
  id               uuid primary key default gen_random_uuid(),
  barber_id        uuid not null references users (id) on delete restrict,
  client_name      text not null,
  weekday          smallint not null check (weekday between 0 and 6),
  start_time       time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create index fixed_appointments_barber_weekday_idx
  on fixed_appointments (barber_id, weekday);

-- ── blocked_times ────────────────────────────────────────────────────────
create table blocked_times (
  id         uuid primary key default gen_random_uuid(),
  barber_id  uuid not null references users (id) on delete restrict,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),

  check (end_at > start_at)
);

create index blocked_times_barber_start_idx on blocked_times (barber_id, start_at);

-- ── business_hours (funcionamento por dia da semana) ─────────────────────
-- weekday: 0 = domingo … 6 = sábado. Horários na hora local da barbearia.
create table business_hours (
  id         uuid primary key default gen_random_uuid(),
  barber_id  uuid not null references users (id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  closed     boolean not null default false,
  open_time  time,
  close_time time,

  unique (barber_id, weekday),

  -- dia fechado dispensa horários; dia aberto exige janela válida
  check (closed or (open_time is not null and close_time is not null and close_time > open_time))
);

-- ── settings (configuração por barbeiro; uma linha por barbeiro) ─────────
create table settings (
  barber_id            uuid primary key references users (id) on delete cascade,
  default_slot_minutes integer not null default 50 check (default_slot_minutes > 0),
  updated_at           timestamptz not null default now()
);

commit;
