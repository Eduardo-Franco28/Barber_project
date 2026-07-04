import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// .env sempre resolvido em backend/.env, independente do diretório de execução.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const backendRoot = fileURLToPath(new URL('../../', import.meta.url));

const missing = [];

function required(name) {
  const value = process.env[name];
  if (!value) {
    missing.push(name);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  supabaseUrl: required('SUPABASE_URL'),
  supabaseSecretKey: required('SUPABASE_SECRET_KEY'),
  jwtSecret: required('JWT_SECRET'),
  jwtAccessTtlMin: Number(process.env.JWT_ACCESS_TTL_MIN ?? 15),
  jwtRefreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7),
  // Fuso da barbearia: business_hours/fixed_appointments são hora local deste
  // fuso; appointments ficam em UTC no banco.
  barbershopTimezone: process.env.BARBERSHOP_TIMEZONE ?? 'America/Sao_Paulo',
  // Caminho relativo é resolvido a partir da pasta backend/.
  excelFilePath: path.resolve(backendRoot, process.env.EXCEL_FILE_PATH ?? 'data/agenda.xlsx'),
  // Evolution API (WhatsApp) — as três são opcionais: sem elas o envio roda
  // em modo simulado (mensagens no log do servidor).
  evolutionApiUrl: (process.env.EVOLUTION_API_URL ?? '').replace(/\/+$/, '') || undefined,
  evolutionApiKey: process.env.EVOLUTION_API_KEY || undefined,
  evolutionInstance: process.env.EVOLUTION_INSTANCE || undefined,
};

if (missing.length > 0) {
  console.error(
    `Configuração ausente: ${missing.join(', ')}.\n` +
      'Copie backend/.env.example para backend/.env e preencha os valores ' +
      '(painel do Supabase → Settings → API).'
  );
  process.exit(1);
}

export default env;
