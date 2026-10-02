import type { Request, Response } from 'express';
import { usuarioDaRequisicao } from '../middlewares/auth';
import * as authService from '../services/authService';
import { loginSchema } from '../validators/chamadoValidators';

export async function login(req: Request, res: Response) {
  const { email, senha } = loginSchema.parse(req.body);
  res.json(await authService.login(email, senha));
}

export function me(req: Request, res: Response) {
  res.json(usuarioDaRequisicao(req));
}
