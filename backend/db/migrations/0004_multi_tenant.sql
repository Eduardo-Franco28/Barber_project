-- Bryan Barbearia — multi-barbearia (multi-tenant) + vários barbeiros por loja
-- Migration 0004. Transforma o sistema de "uma barbearia / um barbeiro" em
-- "várias barbearias, cada uma com vários barbeiros", preservando os dados
-- atuais (que viram a PRIMEIRA barbearia).
--
-- ATENÇÃO: aplicar SEMPRE junto com o deploy do backend do v2 — como as novas
-- colunas são NOT NULL, o backend antigo (que não preenche barbershop_id)
-- pararia de escrever. Migração + código novo vão juntos na virada.

begin;

-- ── 1) Barbearias (o tenant) ─────────────────────────────────────────────
create table barbershops (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null, -- usado no link público: /b/<slug>
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index barbershops_slug_unique_idx on barbershops (lower(slug));

-- RLS (mesma postura deny-all da 0002: só o backend, com a chave secreta, acessa)
alter table barbershops enable row level security;
revoke all privileges on barbershops from anon, authenticated;

-- ── 2) A primeira barbearia (a que já existe hoje) ───────────────────────
insert into barbershops (name, slug) values ('Barbearia', 'barbearia-1');

-- ── 3) Colunas de tenant (nullable primeiro; backfill; depois NOT NULL) ──
-- Serviços eram GLOBAIS; agora pertencem a um barbeiro (serviço por barbeiro).
alter table users              add column barbershop_id uuid references barbershops (id) on delete cascade;
alter table services           add column barbershop_id uuid references barbershops (id) on delete cascade;
alter table services           add column barber_id     uuid references users (id) on delete cascade;
alter table appointments       add column barbershop_id uuid references barbershops (id) on delete cascade;
alter table fixed_appointments add column barbershop_id uuid references barbershops (id) on delete cascade;
alter table blocked_times      add column barbershop_id uuid references barbershops (id) on delete cascade;
alter table business_hours     add column barbershop_id uuid references barbershops (id) on delete cascade;
alter table settings           add column barbershop_id uuid references barbershops (id) on delete cascade;

-- ── 4) Papéis: já libera 'owner' ANTES do backfill (que usa esse papel) ──
alter table users drop constraint users_role_check;
alter table users add constraint users_role_check check (role in ('owner', 'barber', 'client'));

-- ── 5) Backfill: tudo que existe entra na primeira barbearia ─────────────
do $$
declare
  shop uuid;
  owner_id uuid;
begin
  select id into shop from barbershops order by created_at limit 1;
  select id into owner_id from users where role = 'barber' order by created_at limit 1;

  update users set barbershop_id = shop;
  -- serviços globais passam a ser do dono (barbeiro mais antigo)
  update services set barbershop_id = shop, barber_id = owner_id;
  update appointments set barbershop_id = shop;
  update fixed_appointments set barbershop_id = shop;
  update blocked_times set barbershop_id = shop;
  update business_hours set barbershop_id = shop;
  update settings set barbershop_id = shop;

  -- o barbeiro dono ganha o papel de 'owner' (atende e gerencia a barbearia)
  if owner_id is not null then
    update users set role = 'owner' where id = owner_id;
  end if;
end $$;

-- ── 6) E-mail único POR BARBEARIA (a mesma pessoa pode ter conta em duas) ─
drop index users_email_unique_idx;
create unique index users_email_unique_idx on users (barbershop_id, lower(email));

-- ── 7) Agora as colunas de tenant são obrigatórias ───────────────────────
alter table users              alter column barbershop_id set not null;
alter table services           alter column barbershop_id set not null;
alter table services           alter column barber_id     set not null;
alter table appointments       alter column barbershop_id set not null;
alter table fixed_appointments alter column barbershop_id set not null;
alter table blocked_times      alter column barbershop_id set not null;
alter table business_hours     alter column barbershop_id set not null;
alter table settings           alter column barbershop_id set not null;

-- ── 8) Índices para filtrar por barbearia/barbeiro rapidamente ───────────
create index users_barbershop_idx        on users (barbershop_id);
create index services_barbershop_idx     on services (barbershop_id);
create index services_barber_idx         on services (barber_id);
create index appointments_barbershop_idx on appointments (barbershop_id);
create index fixed_appts_barbershop_idx  on fixed_appointments (barbershop_id);
create index blocked_barbershop_idx      on blocked_times (barbershop_id);
create index business_hours_barbershop_idx on business_hours (barbershop_id);

commit;

-- Verificação rápida (aparece no SQL Editor): 1 barbearia, nenhum órfão.
select
  (select count(*) from barbershops)                                    as barbearias,
  (select count(*) from users where barbershop_id is null)              as users_orfaos,
  (select count(*) from services where barbershop_id is null or barber_id is null) as services_orfaos,
  (select count(*) from users where role = 'owner')                     as donos;
