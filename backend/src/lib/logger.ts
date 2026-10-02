import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', '*.senha', '*.email', '*.solicitanteEmail', '*.solicitanteNome'],
    censor: '[oculto]',
  },
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});
