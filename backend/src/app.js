import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error-handler.js';

const app = express();

app.disable('x-powered-by');

// Atrás do proxy da hospedagem (Render): habilita req.secure e o IP real
// (X-Forwarded-For) para cookies Secure e rate limiting corretos.
if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
