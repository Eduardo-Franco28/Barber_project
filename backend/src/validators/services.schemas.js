import { z } from 'zod';

const nameField = z
  .string({ error: 'Nome do serviço é obrigatório.' })
  .trim()
  .min(2, 'Nome muito curto.')
  .max(80, 'Nome muito longo.');

// null (ou ausente na criação) = serviço sem duração própria → o slot usa
// settings.default_slot_minutes como fallback (regra do CLAUDE.md).
const durationField = z
  .number({ error: 'Duração deve ser um número (minutos).' })
  .int('Duração deve ser um número inteiro de minutos.')
  .positive('Duração deve ser maior que zero.')
  .max(480, 'Duração máxima: 480 minutos.')
  .nullable();

const priceField = z
  .number({ error: 'Preço deve ser um número.' })
  .nonnegative('Preço não pode ser negativo.')
  .max(99999.99, 'Preço muito alto.');

const activeField = z.boolean({ error: 'Ativo deve ser true ou false.' });

export const createServiceSchema = z.object({
  name: nameField,
  duration_minutes: durationField.optional(),
  price: priceField,
});

export const updateServiceSchema = z
  .object({
    name: nameField.optional(),
    duration_minutes: durationField.optional(),
    price: priceField.optional(),
    active: activeField.optional(),
  })
  .refine((fields) => Object.keys(fields).length > 0, 'Informe ao menos um campo para atualizar.');
