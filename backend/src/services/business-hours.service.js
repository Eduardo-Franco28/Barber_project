import * as businessHoursRepository from '../repositories/business-hours.repository.js';
import * as excelService from './excel.service.js';

export async function list(barberId) {
  return businessHoursRepository.findAllByBarber(barberId);
}

// Substitui a semana inteira de uma vez. Só afeta agendamentos futuros ainda
// não marcados — os existentes têm start/end gravados (regra do CLAUDE.md).
export async function update(barbershopId, barberId, days) {
  const rows = days.map((day) => ({
    barbershop_id: barbershopId,
    barber_id: barberId,
    weekday: day.weekday,
    closed: day.closed,
    open_time: day.closed ? null : day.open_time,
    close_time: day.closed ? null : day.close_time,
  }));

  const saved = await businessHoursRepository.upsertMany(rows);
  excelService.scheduleSync(); // a grade de linhas da planilha muda junto
  return saved.sort((a, b) => a.weekday - b.weekday);
}
