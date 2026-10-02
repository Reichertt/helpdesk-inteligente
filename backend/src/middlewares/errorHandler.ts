import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

// Respostas de erro no formato Problem Details (RFC 9457).
function enviarProblema(
  req: Request,
  res: Response,
  status: number,
  title: string,
  detail?: string,
  errors?: Record<string, string[]>,
) {
  res
    .status(status)
    .type('application/problem+json')
    .json({ type: 'about:blank', title, status, detail, instance: req.originalUrl, correlationId: req.id, errors });
}

function errosDoZod(error: ZodError) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join('.') || '_';
    (errors[campo] ??= []).push(issue.message);
  }
  return errors;
}

export const notFoundHandler: RequestHandler = (req, res) => {
  enviarProblema(req, res, 404, 'Rota não encontrada', `A rota ${req.method} ${req.path} não existe.`);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return enviarProblema(req, res, 400, 'Dados inválidos', 'Um ou mais campos são inválidos.', errosDoZod(err));
  }
  if (err instanceof AppError) {
    return enviarProblema(req, res, err.status, err.title, err.detail, err.errors);
  }
  if (err?.type === 'entity.parse.failed') {
    return enviarProblema(req, res, 400, 'JSON inválido', 'O corpo da requisição não é um JSON válido.');
  }
  req.log?.error({ err }, 'erro não tratado');
  return enviarProblema(req, res, 500, 'Erro interno', 'Ocorreu um erro inesperado. Tente novamente.');
};
