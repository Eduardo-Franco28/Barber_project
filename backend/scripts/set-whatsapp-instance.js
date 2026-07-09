// Define/atualiza a INSTÂNCIA de WhatsApp (número da Evolution) de uma
// barbearia que já existe. Use quando conectar o WhatsApp da barbearia depois
// de já ter criado ela.
//
// Uso:
//   node scripts/set-whatsapp-instance.js "slug-da-barbearia" "nome-da-instancia"
// Ex.:
//   node scripts/set-whatsapp-instance.js "barbearia-do-ze" "barbearia-do-ze"
//
// O "nome-da-instancia" é o nome que você deu à instância no manager da
// Evolution (recomendado: o mesmo slug da barbearia, pra não confundir).
import * as barbershopsRepository from '../src/repositories/barbershops.repository.js';

const [slug, instance] = process.argv.slice(2);

if (!slug || !instance) {
  console.error('Uso: node scripts/set-whatsapp-instance.js "slug-da-barbearia" "nome-da-instancia"');
  process.exit(1);
}

try {
  const barbershop = await barbershopsRepository.findBySlug(slug);
  if (!barbershop) {
    console.error(`Barbearia não encontrada para o slug "${slug}".`);
    process.exit(1);
  }
  const updated = await barbershopsRepository.setWhatsappInstance(barbershop.id, instance.trim());
  console.log(`Instância de WhatsApp definida: ${updated.name} → "${updated.whatsapp_instance}"`);
  console.log('As notificações dessa barbearia passam a sair por esse número.');
} catch (err) {
  console.error('Falha ao definir a instância:', err.message);
  process.exit(1);
}
