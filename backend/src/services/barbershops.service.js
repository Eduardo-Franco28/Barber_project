import argon2 from 'argon2';

import * as barbershopsRepository from '../repositories/barbershops.repository.js';
import * as businessHoursRepository from '../repositories/business-hours.repository.js';
import * as settingsRepository from '../repositories/settings.repository.js';
import * as usersRepository from '../repositories/users.repository.js';
import { AppError } from '../utils/app-error.js';
import { isValidSlug, slugify } from '../utils/slug.js';

// Horário padrão do dono: seg–sáb 09–19, domingo fechado. Ele ajusta depois.
function defaultWeek(barbershopId, barberId) {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    weekday === 0
      ? { barbershop_id: barbershopId, barber_id: barberId, weekday, closed: true, open_time: null, close_time: null }
      : { barbershop_id: barbershopId, barber_id: barberId, weekday, closed: false, open_time: '09:00', close_time: '19:00' }
  );
}

// Cria uma barbearia + o dono (papel 'owner') + config e horário padrão do
// dono. Usado no onboarding — VOCÊ cria quando vende (decisão de 2026-07-06).
export async function createWithOwner({
  shopName,
  slug,
  ownerName,
  ownerEmail,
  ownerPassword,
  ownerPhone,
}) {
  const cleanSlug = slug ? slugify(slug) : slugify(shopName);
  if (!isValidSlug(cleanSlug)) {
    throw new AppError(400, 'Link (slug) inválido — use letras, números e hífens.');
  }

  const barbershop = await barbershopsRepository.create({
    name: shopName.trim(),
    slug: cleanSlug,
  });

  const passwordHash = await argon2.hash(ownerPassword);
  const owner = await usersRepository.create({
    barbershopId: barbershop.id,
    name: ownerName.trim(),
    email: ownerEmail.trim().toLowerCase(),
    phone: String(ownerPhone).replace(/\D/g, ''),
    passwordHash,
    role: 'owner',
  });

  await settingsRepository.createDefaults(barbershop.id, owner.id);
  await businessHoursRepository.upsertMany(defaultWeek(barbershop.id, owner.id));

  return { barbershop, owner };
}

// Adiciona um barbeiro (role 'barber') a uma barbearia existente (pelo slug),
// já com config e horário padrão. O barbeiro depois entra e cadastra os
// próprios serviços pelo painel.
export async function addBarber({ slug, name, email, password, phone }) {
  const barbershop = await barbershopsRepository.findBySlug(slug);
  if (!barbershop) {
    throw new AppError(404, 'Barbearia não encontrada (confira o slug/link).');
  }

  const passwordHash = await argon2.hash(password);
  const barber = await usersRepository.create({
    barbershopId: barbershop.id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: String(phone).replace(/\D/g, ''),
    passwordHash,
    role: 'barber',
  });

  await settingsRepository.createDefaults(barbershop.id, barber.id);
  await businessHoursRepository.upsertMany(defaultWeek(barbershop.id, barber.id));

  return { barbershop, barber };
}
