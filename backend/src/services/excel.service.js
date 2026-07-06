import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import ExcelJS from 'exceljs';
import { DateTime } from 'luxon';

import env from '../config/env.js';
import * as appointmentsRepository from '../repositories/appointments.repository.js';
import * as blockedTimesRepository from '../repositories/blocked-times.repository.js';
import * as businessHoursRepository from '../repositories/business-hours.repository.js';
import * as fixedAppointmentsRepository from '../repositories/fixed-appointments.repository.js';
import * as settingsRepository from '../repositories/settings.repository.js';
import * as usersRepository from '../repositories/users.repository.js';

// A planilha é um ESPELHO do banco: a cada mudança regeneramos o arquivo
// inteiro (semana atual + WEEKS_AHEAD), em vez de editar célula a célula —
// impossível dessincronizar. Formato do padrão antigo do barbeiro: uma aba
// por semana, dias nas colunas, horários (grade do intervalo padrão) nas
// linhas, célula = só o nome do cliente.
const WEEKS_AHEAD = 8;
const FALLBACK_SLOT_MINUTES = 50;
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const GRAY_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
};

let queue = Promise.resolve();
let timer = null;

// Dispara a regeneração do ESPELHO EM DISCO com debounce, fora do caminho da
// resposta HTTP. Útil localmente (aponte EXCEL_FILE_PATH para uma pasta do
// OneDrive/Dropbox). Em hospedagem com disco efêmero (ex.: Render), desligue
// com EXCEL_MIRROR_ENABLED=false — o download sob demanda não depende disso.
export function scheduleSync() {
  if (!env.excelMirrorEnabled) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    queue = queue
      .then(() => syncNow())
      .catch((err) => {
        console.error(
          'Excel: falha ao atualizar a planilha (se o arquivo estiver aberto no Excel, feche-o) —',
          err.message
        );
      });
  }, 500);
  timer.unref?.();
}

// Monta o workbook inteiro a partir do banco — fonte única da verdade, sempre
// atual no momento da chamada.
async function buildWorkbook() {
  const barber = await usersRepository.findBarber();
  if (!barber) return null;

  const zone = env.barbershopTimezone;
  const windowStart = DateTime.now().setZone(zone).startOf('week'); // segunda
  const windowEnd = windowStart.plus({ weeks: WEEKS_AHEAD + 1 });

  const [settings, hours, allFixed, appointments, blocks] = await Promise.all([
    settingsRepository.findByBarberId(barber.id),
    businessHoursRepository.findAllByBarber(barber.id),
    fixedAppointmentsRepository.findAllByBarber(barber.id),
    appointmentsRepository.findForExcel(
      barber.id,
      windowStart.toUTC().toISO(),
      windowEnd.toUTC().toISO()
    ),
    blockedTimesRepository.findOverlapping(
      barber.id,
      windowStart.toUTC().toISO(),
      windowEnd.toUTC().toISO()
    ),
  ]);

  const stepMinutes = settings?.default_slot_minutes ?? FALLBACK_SLOT_MINUTES;
  const hoursByWeekday = new Map(hours.map((h) => [h.weekday, h]));
  const fixed = allFixed.filter((f) => f.active);

  const appointmentRanges = appointments.map((a) => ({
    start: DateTime.fromISO(a.start_at).toMillis(),
    end: DateTime.fromISO(a.end_at).toMillis(),
    name: a.client?.name ?? '(cliente)',
  }));
  const blockRanges = blocks.map((b) => ({
    start: DateTime.fromISO(b.start_at).toMillis(),
    end: DateTime.fromISO(b.end_at).toMillis(),
    label: b.reason || 'Bloqueado',
  }));

  const workbook = new ExcelJS.Workbook();
  for (let week = 0; week <= WEEKS_AHEAD; week++) {
    buildWeekSheet(workbook, {
      weekStart: windowStart.plus({ weeks: week }),
      stepMinutes,
      hoursByWeekday,
      fixed,
      appointmentRanges,
      blockRanges,
    });
  }

  return workbook;
}

// Gera o arquivo EM MEMÓRIA (para o download sob demanda — sempre atual, sem
// depender de disco). Retorna null se ainda não há barbeiro configurado.
export async function generateBuffer() {
  const workbook = await buildWorkbook();
  if (!workbook) return null;
  return workbook.xlsx.writeBuffer();
}

// Escreve o espelho em disco (só quando EXCEL_MIRROR_ENABLED).
export async function syncNow() {
  const workbook = await buildWorkbook();
  if (!workbook) return;
  await mkdir(path.dirname(env.excelFilePath), { recursive: true });
  await workbook.xlsx.writeFile(env.excelFilePath);
}

function atTime(day, timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  return day.set({ hour, minute, second: 0, millisecond: 0 });
}

function overlaps(range, startMs, endMs) {
  return startMs < range.end && range.start < endMs;
}

function buildWeekSheet(
  workbook,
  { weekStart, stepMinutes, hoursByWeekday, fixed, appointmentRanges, blockRanges }
) {
  const name = `${weekStart.toFormat('dd-MM')} a ${weekStart.plus({ days: 6 }).toFormat('dd-MM')}`;
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  });

  const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const day = weekStart.plus({ days: offset });
    const config = hoursByWeekday.get(day.weekday % 7);
    return { day, config, closed: !config || config.closed };
  });

  // Linhas da grade: união dos horários de todos os dias abertos da semana.
  const labels = new Set();
  for (const { day, config, closed } of days) {
    if (closed) continue;
    const close = atTime(day, config.close_time);
    for (let t = atTime(day, config.open_time); t < close; t = t.plus({ minutes: stepMinutes })) {
      labels.add(t.toFormat('HH:mm'));
    }
  }
  const gridTimes = [...labels].sort();

  sheet.getColumn(1).width = 9;
  for (let col = 2; col <= 8; col++) sheet.getColumn(col).width = 20;

  const header = sheet.getRow(1);
  header.getCell(1).value = 'Horário';
  days.forEach(({ day }, index) => {
    header.getCell(index + 2).value = `${DAY_LABELS[index]} ${day.toFormat('dd/MM')}`;
  });
  header.eachCell((cell) => {
    cell.font = { bold: true };
    cell.border = { bottom: { style: 'medium' } };
    cell.alignment = { horizontal: 'center' };
  });

  if (gridTimes.length === 0) {
    sheet.getCell(2, 1).value = 'Sem expediente configurado';
    return;
  }

  gridTimes.forEach((label, rowIndex) => {
    const row = sheet.getRow(rowIndex + 2);
    const timeCell = row.getCell(1);
    timeCell.value = label;
    timeCell.font = { bold: true };
    timeCell.border = THIN_BORDER;
    timeCell.alignment = { horizontal: 'center' };

    days.forEach(({ day, config, closed }, dayIndex) => {
      const cell = row.getCell(dayIndex + 2);
      cell.border = THIN_BORDER;

      if (closed) {
        cell.fill = GRAY_FILL;
        if (rowIndex === 0) {
          cell.value = 'Fechado';
          cell.font = { italic: true, color: { argb: 'FF9B9B9B' } };
        }
        return;
      }

      const slotStart = atTime(day, label);
      const slotEnd = slotStart.plus({ minutes: stepMinutes });
      const open = atTime(day, config.open_time);
      const close = atTime(day, config.close_time);
      if (slotStart < open || slotStart >= close) {
        cell.fill = GRAY_FILL; // fora do expediente deste dia
        return;
      }

      const startMs = slotStart.toMillis();
      const endMs = slotEnd.toMillis();

      const appointment = appointmentRanges.find((r) => overlaps(r, startMs, endMs));
      if (appointment) {
        cell.value = appointment.name;
        return;
      }

      const weekday = day.weekday % 7;
      const fixedMatch = fixed.find((f) => {
        if (f.weekday !== weekday) return false;
        const fixedStart = atTime(day, f.start_time);
        const fixedEnd = fixedStart.plus({ minutes: f.duration_minutes });
        return overlaps({ start: fixedStart.toMillis(), end: fixedEnd.toMillis() }, startMs, endMs);
      });
      if (fixedMatch) {
        cell.value = fixedMatch.client_name;
        return;
      }

      const block = blockRanges.find((r) => overlaps(r, startMs, endMs));
      if (block) {
        cell.value = block.label;
        cell.font = { italic: true, color: { argb: 'FF9B9B9B' } };
        cell.fill = GRAY_FILL;
      }
    });
  });
}
