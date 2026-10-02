import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function listar(_req: Request, res: Response) {
  res.json(await prisma.categoria.findMany({ orderBy: { nome: 'asc' } }));
}
