import * as settingsRepository from '../repositories/settings.repository.js';
import * as excelService from './excel.service.js';

const DEFAULT_SLOT_MINUTES = 50;

export async function get(barberId) {
  const settings = await settingsRepository.findByBarberId(barberId);
  return settings ?? { barber_id: barberId, default_slot_minutes: DEFAULT_SLOT_MINUTES, updated_at: null };
}

export async function update(barbershopId, barberId, { default_slot_minutes: defaultSlotMinutes }) {
  const saved = await settingsRepository.upsert(barbershopId, barberId, {
    default_slot_minutes: defaultSlotMinutes,
  });
  excelService.scheduleSync(); // a grade de linhas da planilha muda junto
  return saved;
}
