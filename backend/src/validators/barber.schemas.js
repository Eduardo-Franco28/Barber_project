import { z } from 'zod';

const TIME_REGEX = /^\d{2}:\d{2}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function timeField(label) {
  return z
    .string({ error: `${label} é obrigatório.` })
    .regex(TIME_REGEX, `${label} no formato HH:MM.`);
}

function dateField(label) {
  return z
    .string({ error: `${label} é obrigatória.` })
    .regex(DATE_REGEX, `${label} no formato AAAA-MM-DD.`);
}

export const createFixedAppointmentSchema = z.object({
  client_name: z
    .string({ error: 'Nome do cliente é obrigatório.' })
    .trim()
    .min(2, 'Nome muito curto.')
    .max(80, 'Nome muito longo.'),
  weekday: z
    .number({ error: 'Dia da semana é obrigatório.' })
    .int('Dia da semana inválido.')
    .min(0, 'Dia da semana inválido.')
    .max(6, 'Dia da semana inválido.'),
  start_time: timeField('Horário'),
  duration_minutes: z
    .number({ error: 'Duração é obrigatória.' })
    .int('Duração em minutos inteiros.')
    .positive('Duração deve ser maior que zero.')
    .max(480, 'Duração máxima: 480 minutos.'),
});

export const createBlockedTimeSchema = z.object({
  start_date: dateField('Data de início'),
  start_time: timeField('Hora de início'),
  end_date: dateField('Data de fim'),
  end_time: timeField('Hora de fim'),
  reason: z.string().trim().max(120, 'Motivo muito longo.').optional(),
});

const businessDaySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    closed: z.boolean({ error: 'closed deve ser true ou false.' }),
    open_time: timeField('Abertura').nullable().optional(),
    close_time: timeField('Fechamento').nullable().optional(),
  })
  .refine(
    (day) => day.closed || (day.open_time && day.close_time),
    'Dia aberto precisa de horário de abertura e fechamento.'
  )
  .refine(
    (day) => day.closed || day.open_time < day.close_time,
    'A abertura deve ser antes do fechamento.'
  );

export const updateBusinessHoursSchema = z.object({
  days: z
    .array(businessDaySchema, { error: 'days deve ser uma lista.' })
    .length(7, 'Envie os 7 dias da semana.')
    .refine(
      (days) => new Set(days.map((d) => d.weekday)).size === 7,
      'Cada dia da semana deve aparecer exatamente uma vez.'
    ),
});

export const updateSettingsSchema = z.object({
  default_slot_minutes: z
    .number({ error: 'Intervalo padrão é obrigatório.' })
    .int('Minutos inteiros.')
    .min(10, 'Intervalo mínimo: 10 minutos.')
    .max(240, 'Intervalo máximo: 240 minutos.'),
});
