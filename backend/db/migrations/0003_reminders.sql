-- Bryan Barbearia — lembrete de WhatsApp (~2h antes do horário)
-- Aplicar no SQL Editor do Supabase.
--
-- null = lembrete ainda não enviado. O job do backend preenche ao enviar —
-- ou ao pular, quando o agendamento nasce a menos de 2h do horário (a
-- confirmação recém-enviada já cumpre o papel de lembrete).
alter table appointments add column reminder_sent_at timestamptz;

-- Verificação (aparece no SQL Editor): deve retornar 1 linha.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'appointments'
  and column_name = 'reminder_sent_at';
