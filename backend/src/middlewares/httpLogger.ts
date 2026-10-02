import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';

// Reaproveita o x-correlation-id recebido (ou gera um) e devolve no header da resposta.
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const recebido = req.headers['x-correlation-id'];
    const id = typeof recebido === 'string' && recebido.length <= 100 ? recebido : randomUUID();
    res.setHeader('x-correlation-id', id);
    return id;
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
});
