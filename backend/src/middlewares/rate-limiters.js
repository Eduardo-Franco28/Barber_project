import rateLimit from 'express-rate-limit';

function buildLimiter(options) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
    ...options,
  });
}

// Só conta tentativas que falharam: quem erra a senha 5x em 15min é bloqueado,
// login legítimo não consome o limite.
export const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
});

export const registerLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

export const refreshLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
});

// Troca de senha exige a senha atual — limite modesto contra tentativa e erro.
export const passwordChangeLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
});
