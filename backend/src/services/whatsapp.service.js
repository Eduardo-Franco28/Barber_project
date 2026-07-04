import env from '../config/env.js';

// Sem as três variáveis EVOLUTION_* no .env, roda em MODO SIMULADO: a
// mensagem vai para o log do servidor e nada é enviado. Preenchendo o .env,
// passa a chamar a Evolution API de verdade — nenhuma mudança de código.
const configured = Boolean(env.evolutionApiUrl && env.evolutionApiKey && env.evolutionInstance);

// Telefones são guardados só com dígitos (10-11 = DDD+número) → prefixa o 55.
function toInternational(phoneDigits) {
  const digits = String(phoneDigits).replace(/\D/g, '');
  return digits.length <= 11 ? `55${digits}` : digits;
}

export function isConfigured() {
  return configured;
}

export async function sendMessage(phoneDigits, text) {
  const number = toInternational(phoneDigits);

  if (!configured) {
    console.log(`[WhatsApp simulado] para ${number}: ${text}`);
    return;
  }

  const response = await fetch(
    `${env.evolutionApiUrl}/message/sendText/${env.evolutionInstance}`,
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
