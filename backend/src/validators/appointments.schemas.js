import { z } from 'zod';

import { isUuid } from '../utils/uuid.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

const dateField = z
  .string({ error: 'Data é obrigatória.' })
  .regex(DATE_REGEX, 'Data no formato AAAA-MM-DD.');

function uniqueServiceIds(ids) {
  return new Set(ids).size === ids.length;
}

// GET /availability?date=AAAA-MM-DD&service_ids=uuid1,uuid2
export const availabilityQuerySchema = z.object({
  date: dateField,
  service_ids: z
    .string({ error: 'Informe os serviços (service_ids).' })
    .transform((value) => value.split(',').map((id) => id.trim()).filter(Boolean))
    .refine((ids) => ids.length >= 1 && ids.length <= 5, 'Escolha de 1 a 5 serviços.')
    .refine((ids) => ids.every(isUuid), 'service_ids contém um id inválido.')
    .refine(uniqueServiceIds, 'Há serviços repetidos.'),
});

export const createAppointmentSchema = z.object({
  date: dateField,
  time: z
    .string({ error: 'Horário é obrigatório.' })
    .regex(TIME_REGEX, 'Horário no formato HH:MM.'),
  service_ids: z
    .array(z.string().refine(isUuid, 'service_ids contém um id inválido.'), {
      error: 'service_ids deve ser uma lista de serviços.',
    })
    .min(1, 'Escolha ao menos um serviço.')
    .max(5, 'Máximo de 5 serviços por agendamento.')
    .refine(uniqueServiceIds, 'Há serviços repetidos.'),
});

// GET /appointments?from=&to= (período usado só na visão do barbeiro)
export const listAppointmentsQuerySchema = z.object({
  from: dateField.optional(),
  to: z.string().regex(DATE_REGEX, 'Data no formato AAAA-MM-DD.').optional(),
});
