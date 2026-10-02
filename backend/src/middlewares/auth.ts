import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { PerfilUsuario } from '@prisma/client';
import { env } from '../config/env';
import { forbidden, unauthorized } from '../lib/errors';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

export function gerarToken(usuario: UsuarioAutenticado) {
  return jwt.sign({ nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }, env.JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export const autenticar: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
    req.usuario = { id: Number(payload.sub), nome: payload.nome, email: payload.email, perfil: payload.perfil };
  } catch {
    throw unauthorized('Sessão inválida ou expirada. Faça login novamente.');
  }
  next();
};

export const exigirPerfil =
  (...perfis: PerfilUsuario[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) throw forbidden();
    next();
  };

export function usuarioDaRequisicao(req: { usuario?: UsuarioAutenticado }): UsuarioAutenticado {
  if (!req.usuario) throw unauthorized();
  return req.usuario;
}
