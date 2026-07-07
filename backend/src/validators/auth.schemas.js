import { z } from 'zod';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailField = z
  .string({ error: 'Informe seu e-mail.' })
  .trim()
  .toLowerCase()
  .max(254, 'E-mail muito longo.')
  .refine((value) => EMAIL_REGEX.test(value), 'E-mail inválido — ex.: nome@email.com');

const passwordField = z
  .string({ error: 'Crie uma senha.' })
  .min(6, 'A senha precisa de pelo menos 6 caracteres.')
  .max(128, 'A senha é muito longa (máx. 128).');

const nameField = z
  .string({ error: 'Informe seu nome.' })
  .trim()
  .min(2, 'Digite seu nome (mín. 2 letras).')
  .max(120, 'Nome muito longo.');

const phoneField = z
  .string({ error: 'Informe seu WhatsApp.' })
  .transform((value) => value.replace(/\D/g, ''))
  .refine(
    (digits) => digits.length >= 10 && digits.length <= 13,
    'WhatsApp inválido — use DDD + número, ex.: 11999998888'
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
