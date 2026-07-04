import env from '../config/env.js';
import * as servicesRepository from '../repositories/services.repository.js';

export async function getHealth() {
  const health = {
    status: 'ok',
    environment: env.nodeEnv,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: 'ok',
  };

  try {
    await servicesRepository.countAll();
  } catch (err) {
    console.error('Health check: banco indisponível —', err.message);
    health.status = 'degraded';
    health.database = 'error';
  }

  return health;
}
