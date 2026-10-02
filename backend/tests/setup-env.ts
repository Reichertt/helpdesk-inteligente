import { inject } from 'vitest';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'segredo-usado-apenas-nos-testes';
process.env.AI_PROVIDER = 'fake';
process.env.AI_MAX_RETRIES = '0';
process.env.AI_TIMEOUT_MS = '2000';

const urlDoContainer = inject('databaseUrl');
process.env.DATABASE_URL = urlDoContainer ?? 'postgresql://nao-usado:nao-usado@localhost:5432/unit';
