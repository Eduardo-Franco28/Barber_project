// Adiciona um barbeiro a uma barbearia que já existe.
//
// Uso:
//   node scripts/add-barber.js "slug-da-barbearia" "Nome do Barbeiro" email senha telefone
// Ex.:
//   node scripts/add-barber.js "barbearia-do-ze" "Carlos" carlos@email.com Senha123 11999997777
//
// Depois, o barbeiro entra no link /b/<slug> com esse e-mail e senha e cadastra
// os próprios serviços pelo painel.
import * as barbershopsService from '../src/services/barbershops.service.js';

const [slug, name, email, password, phone] = process.argv.slice(2);

if (!slug || !name || !email || !password || !phone) {
  console.error(
    'Uso: node scripts/add-barber.js "slug-da-barbearia" "Nome do Barbeiro" email senha telefone'
  );
  process.exit(1);
}
if (password.length < 6) {
  console.error('A senha deve ter pelo menos 6 caracteres.');
  process.exit(1);
}
const phoneDigits = phone.replace(/\D/g, '');
if (phoneDigits.length < 10 || phoneDigits.length > 13) {
  console.error('Telefone inválido — use DDD + número.');
  process.exit(1);
}

try {
  const { barbershop, barber } = await barbershopsService.addBarber({
    slug,
    name,
    email,
    password,
    phone,
  });
  console.log(`Barbeiro adicionado: ${barber.name} <${barber.email}>`);
  console.log(`Barbearia: ${barbershop.name} (link: /b/${barbershop.slug})`);
  console.log('Ele já pode entrar por esse link e cadastrar os próprios serviços.');
} catch (err) {
  console.error('Falha ao adicionar o barbeiro:', err.message);
  process.exit(1);
}
