-- 0005_whatsapp_instance.sql
-- WhatsApp por barbearia: cada barbearia envia as notificações pelo PRÓPRIO
-- número, que na Evolution API é uma "instância" própria. Assim o volume e o
-- risco de bloqueio ficam isolados por barbearia (uma banida não afeta as
-- outras), e cada loja aparece pro cliente com a identidade dela.
--
-- Sem valor definido aqui, o envio cai no EVOLUTION_INSTANCE do .env (modo
-- single-shop/dev) ou no modo simulado (mensagem só no log).

alter table barbershops add column if not exists whatsapp_instance text;
