-- Bryan Barbearia — RLS: trava a API pública do Supabase
-- Alvo: Postgres 15+ (Supabase). Aplicar no SQL Editor (ver db/README.md).
--
-- Arquitetura: o front NUNCA fala com o Supabase — todo acesso passa pelo
-- backend Express, que usa a chave secreta (service_role, que bypassa RLS)
-- e faz a autorização por papel em middleware. Portanto a postura aqui é
-- negar TUDO para os papéis públicos do PostgREST (anon/authenticated):
-- RLS ligado sem nenhuma policy + revogação dos privilégios. Dupla trava:
-- mesmo uma policy permissiva criada por engano no futuro não abriria nada,
-- porque o privilégio de tabela nem existe.
-- Se um dia o front falar direto com o Supabase, escrever as policies aqui.

begin;

-- 1) RLS ligado em todas as tabelas (sem policies = nega tudo para quem não
--    bypassa RLS; dono da tabela e service_role continuam plenos).
alter table users                enable row level security;
alter table services             enable row level security;
alter table appointments         enable row level security;
alter table appointment_services enable row level security;
alter table fixed_appointments   enable row level security;
alter table blocked_times        enable row level security;
alter table business_hours       enable row level security;
alter table settings             enable row level security;

-- 2) Revoga os privilégios que o Supabase concede por padrão aos papéis
--    públicos — inclusive para tabelas criadas no futuro (default privileges).
revoke all privileges on all tables    in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
revoke all privileges on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

commit;

-- Verificação (o resultado aparece no SQL Editor): espera-se rls_ligado =
-- true e privilegios_publicos_restantes = 0 em todas as 8 linhas.
select
  t.tablename,
  t.rowsecurity as rls_ligado,
  count(g.privilege_type) as privilegios_publicos_restantes
from pg_tables t
left join information_schema.role_table_grants g
  on g.table_schema = t.schemaname
  and g.table_name = t.tablename
  and g.grantee in ('anon', 'authenticated')
where t.schemaname = 'public'
group by t.tablename, t.rowsecurity
order by t.tablename;
