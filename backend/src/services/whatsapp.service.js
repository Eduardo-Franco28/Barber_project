import env from '../config/env.js';

// O SERVIDOR da Evolution é um só (URL + chave no .env), mas cada barbearia
// envia pela PRÓPRIA instância (o número dela) — passada por chamada. Sem
// instância (nem no argumento, nem o EVOLUTION_INSTANCE do .env) ou sem
// URL/chave, roda em MODO SIMULADO: a mensagem vai só para o log.
const serverConfigured = Boolean(env.evolutionApiUrl && env.evolutionApiKey);

// Telefones são guardados só com dígitos (10-11 = DDD+número) → prefixa o 55.
function toInternational(phoneDigits) {
  const digits = String(phoneDigits).replace(/\D/g, '');
  return digits.length <= 11 ? `55${digits}` : digits;
}

export function isConfigured() {
  return serverConfigured;
}

// instance: nome da instância da barbearia na Evolution (o número dela). Se
// não vier, usa o EVOLUTION_INSTANCE do .env (modo single-shop/dev).
export async function sendMessage(phoneDigits, text, instance) {
  const number = toInternational(phoneDigits);
  const activeInstance = instance || env.evolutionInstance;

  if (!serverConfigured || !activeInstance) {
    console.log(`[WhatsApp simulado] (${activeInstance ?? 'sem instância'}) para ${number}: ${text}`);
    return;
  }

  const response = await fetch(
    `${env.evolutionApiUrl}/message/sendText/${activeInstance}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: env.evolutionApiKey },
      body: JSON.stringify({ number, text }),
    }
  );

  if (!response.ok) {
    throw new Error(`Evolution API respondeu ${response.status}`);
  }
}
