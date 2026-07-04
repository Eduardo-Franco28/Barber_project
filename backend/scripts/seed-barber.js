// Cria a conta do barbeiro (dono) — o cadastro público só cria clientes.
// Uso:  node scripts/seed-barber.js "Nome" email senha telefone
// Ex.:  node scripts/seed-barber.js "Bryan" bryan@exemplo.com "SenhaForte123" "11999998888"
// Também cria a configuração (intervalo padrão 50min) e um horário de
// funcionamento inicial (seg–sáb 09:00–19:00, domingo fechado) — tudo
// editável depois pelo app.
import argon2 from 'argon2';

import { supabase } from '../src/config/supabase.js';

const [name, email, password, phone] = process.argv.slice(2);

if (!name || !email || !password || !phone) {
  console.error('Uso: node scripts/seed-barber.js "Nome" email senha telefone');
  process.exit(1);
}
if (password.length < 8) {
  console.error('A senha deve ter pelo menos 8 caracteres.');
  process.exit(1);
}

const cleanEmail = email.trim().toLowerCase();
const cleanPhone = phone.replace(/\D/g, '');
if (cleanPhone.length < 10 || cleanPhone.length > 13) {
  console.error('Telefone inválido — use DDD + número (WhatsApp).');
  process.exit(1);
}

const { data: existing, error: findError } = await supabase
  .from('users')
  .select('id')
  .eq('role', 'barber')
  .limit(1);

if (findError) {
  console.error('Falha ao consultar usuários:', findError.message);
  process.exit(1);
}
if (existing.length > 0) {
  console.error('Já existe um barbeiro cadastrado — nada a fazer.');
  process.exit(1);
}

const passwordHash = await argon2.hash(password);

const { data: barber, error: createError } = await supabase
  .from('users')
  .insert({
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    password_hash: passwordHash,
    role: 'barber',
  })
  .select('id, name, email')
  .single();

if (createError) {
  console.error('Falha ao criar barbeiro:', createError.message);
  process.exit(1);
}

const { error: settingsError } = await supabase
  .from('settings')
  .insert({ barber_id: barber.id });

// Linhas homogêneas (mesmas chaves em todas): no insert em lote do PostgREST,
// chave ausente numa linha vira NULL explícito e ignora o default do banco.
const businessHoursRows = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
  weekday === 0
    ? { barber_id: barber.id, weekday, closed: true, open_time: null, close_time: null }
    : { barber_id: barber.id, weekday, closed: false, open_time: '09:00', close_time: '19:00' }
);
const { error: hoursError } = await supabase.from('business_hours').insert(businessHoursRows);

if (settingsError || hoursError) {
  console.error(
    'Barbeiro criado, mas houve falha na configuração inicial:',
    settingsError?.message ?? hoursError?.message
  );
  process.exit(1);
}

console.log(`Barbeiro criado: ${barber.name} <${barber.email}>`);
console.log('Configuração criada: intervalo padrão 50min; seg–sáb 09:00–19:00, domingo fechado.');
console.log('Ajuste horários e intervalo depois pelo próprio app.');
