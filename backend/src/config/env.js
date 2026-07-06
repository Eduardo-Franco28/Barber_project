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

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  // Aceita uma ou várias origens separadas por vírgula (ex.: domínio do
  // Vercel + previews). Usado pelo CORS com credentials.
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseSecretKey: required('SUPABASE_SECRET_KEY'),
  jwtSecret: required('JWT_SECRET'),
  jwtAccessTtlMin: Number(process.env.JWT_ACCESS_TTL_MIN ?? 15),
  jwtRefreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7),
  // SameSite do cookie de sessão. Front e back em domínios diferentes
  // (Vercel + Render) exigem 'none' (+ Secure) para o cookie viajar. Com
  // domínio próprio (front e api no mesmo site) pode voltar para 'lax'.
  cookieSameSite: process.env.COOKIE_SAMESITE ?? (isProd ? 'none' : 'lax'),
  // Fuso da barbearia: business_hours/fixed_appointments são hora local deste
  // fuso; appointments ficam em UTC no banco.
  barbershopTimezone: process.env.BARBERSHOP_TIMEZONE ?? 'America/Sao_Paulo',
  // Caminho relativo é resolvido a partir da pasta backend/.
  excelFilePath: path.resolve(backendRoot, process.env.EXCEL_FILE_PATH ?? 'data/agenda.xlsx'),
  // Espelho em disco da planilha. Desligue em hospedagem com disco efêmero
  // (Render): o download sob demanda continua funcionando.
  excelMirrorEnabled: process.env.EXCEL_MIRROR_ENABLED !== 'false',
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
