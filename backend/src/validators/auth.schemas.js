import { z } from 'zod';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailField = z
  .string({ error: 'E-mail é obrigatório.' })
  .trim()
  .toLowerCase()
  .max(254, 'E-mail muito longo.')
  .refine((value) => EMAIL_REGEX.test(value), 'E-mail inválido.');

const passwordField = z
  .string({ error: 'Senha é obrigatória.' })
  .min(8, 'Senha deve ter pelo menos 8 caracteres.')
  .max(128, 'Senha muito longa.');

const nameField = z
  .string({ error: 'Nome é obrigatório.' })
  .trim()
  .min(2, 'Nome muito curto.')
  .max(120, 'Nome muito longo.');

const phoneField = z
  .string({ error: 'Telefone é obrigatório.' })
  .transform((value) => value.replace(/\D/g, ''))
  .refine(
    (digits) => digits.length >= 10 && digits.length <= 13,
    'Telefone inválido — use DDD + número (WhatsApp).'
  );

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: 'Senha é obrigatória.' }).min(1, 'Senha é obrigatória.'),
});

export const updateProfileSchema = z.object({
  name: nameField,
  phone: phoneField,
});

export const changePasswordSchema = z.object({
  current_password: z
    .string({ error: 'Senha atual é obrigatória.' })
    .min(1, 'Senha atual é obrigatória.'),
  new_password: passwordField,
});
