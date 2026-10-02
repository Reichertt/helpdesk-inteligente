import type { Request, Response } from 'express';
import { obterResumo } from '../services/dashboardService';

export async function resumo(_req: Request, res: Response) {
  res.json(await obterResumo());
}
