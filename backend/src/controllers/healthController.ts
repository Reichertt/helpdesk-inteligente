import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function verificar(req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', banco: 'ok', uptimeSegundos: Math.round(process.uptime()) });
  } catch (err) {
    req.log?.error({ err }, 'health check: banco indisponível');
    res.status(503).json({ status: 'degradado', banco: 'indisponivel' });
  }
}
