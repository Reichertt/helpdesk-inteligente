import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import * as healthController from './controllers/healthController';
import { openApiDocument } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { httpLogger } from './middlewares/httpLogger';
import { routes } from './routes';

export function criarApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      exposedHeaders: ['x-correlation-id', 'location'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(httpLogger);

  app.get('/health', healthController.verificar);
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
