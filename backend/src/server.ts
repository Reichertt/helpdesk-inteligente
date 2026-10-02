import { criarApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { retomarTriagensPendentes } from './services/triagemProcessador';

const servidor = criarApp().listen(env.PORT, () => {
  logger.info({ porta: env.PORT, provedorIA: env.AI_PROVIDER }, 'API do HelpDesk iniciada');
  retomarTriagensPendentes().catch((err) => logger.error({ err }, 'falha ao retomar triagens pendentes'));
});

async function encerrar(sinal: string) {
  logger.info({ sinal }, 'encerrando a API');
  servidor.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => void encerrar('SIGTERM'));
process.on('SIGINT', () => void encerrar('SIGINT'));
