// Onboarding: cria uma barbearia + o dono. É assim que VOCÊ cadastra uma
// barbearia nova quando vende.
//
// Uso:
//   node scripts/create-barbershop.js "Nome da Barbearia" "slug" "Nome do Dono" email senha telefone
// Ex.:
//   node scripts/create-barbershop.js "Barbearia do Zé" "barbearia-do-ze" "Zé" ze@email.com Senha123 11999998888
//
// O <slug> vira o link público: /b/<slug>
import * as barbershopsService from '../src/services/barbershops.service.js';

const [shopName, slug, ownerName, ownerEmail, ownerPassword, ownerPhone] = process.argv.slice(2);

if (!shopName || !slug || !ownerName || !ownerEmail || !ownerPassword || !ownerPhone) {
  console.error(
    'Uso: node scripts/create-barbershop.js "Nome da Barbearia" "slug" "Nome do Dono" email senha telefone'
  );
  process.exit(1);
}
if (ownerPassword.length < 6) {
  console.error('A senha deve ter pelo menos 6 caracteres.');
  process.exit(1);
}
const phoneDigits = ownerPhone.replace(/\D/g, '');
if (phoneDigits.length < 10 || phoneDigits.length > 13) {
  console.error('Telefone inválido — use DDD + número.');
  process.exit(1);
}

try {
  const { barbershop, owner } = await barbershopsService.createWithOwner({
    shopName,
    slug,
    ownerName,
    ownerEmail,
    ownerPassword,
    ownerPhone,
  });
  console.log(`Barbearia criada: ${barbershop.name}`);
  console.log(`Link público: /b/${barbershop.slug}`);
  console.log(`Dono (owner): ${owner.name} <${owner.email}>`);
  console.log('O dono já pode entrar pelo link da barbearia e cadastrar seus barbeiros/serviços.');
} catch (err) {
  console.error('Falha ao criar a barbearia:', err.message);
  process.exit(1);
}
