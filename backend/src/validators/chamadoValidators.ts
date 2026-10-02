import { Prioridade, StatusChamado } from '@prisma/client';
import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number({ invalid_type_error: 'O id deve ser numérico.' }).int().positive('O id deve ser positivo.'),
});

export const criarChamadoSchema = z.object({
  titulo: z.string({ required_error: 'Informe o título.' }).trim().min(5, 'O título deve ter ao menos 5 caracteres.').max(150, 'O título deve ter no máximo 150 caracteres.'),
  descricao: z.string({ required_error: 'Informe a descrição.' }).trim().min(10, 'A descrição deve ter ao menos 10 caracteres.').max(5000, 'A descrição deve ter no máximo 5000 caracteres.'),
  solicitanteNome: z.string({ required_error: 'Informe o nome do solicitante.' }).trim().min(2, 'O nome deve ter ao menos 2 caracteres.').max(120),
  solicitanteEmail: z.string({ required_error: 'Informe o e-mail do solicitante.' }).trim().toLowerCase().email('Informe um e-mail válido.').max(160),
  categoriaId: z.coerce.number().int().positive().nullish(),
  prioridade: z.nativeEnum(Prioridade, { errorMap: () => ({ message: 'Prioridade inválida.' }) }).optional(),
});

const textoOpcional = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v ? v : undefined));

export const filtrosChamadosSchema = z
  .object({
    status: z.nativeEnum(StatusChamado).optional(),
    prioridade: z.nativeEnum(Prioridade).optional(),
    categoriaId: z.coerce.number().int().positive().optional(),
    busca: textoOpcional,
    dataInicio: z.coerce.date().optional(),
    dataFim: z.coerce.date().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    tamanhoPagina: z.coerce.number().int().min(1).max(100).default(10),
    ordenarPor: z.enum(['criadoEm', 'prioridade']).default('criadoEm'),
    direcao: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine((f) => !f.dataInicio || !f.dataFim || f.dataInicio <= f.dataFim, {
    message: 'A data inicial deve ser anterior ou igual à data final.',
    path: ['dataFim'],
  });

export const mudarStatusSchema = z.object({
  status: z.nativeEnum(StatusChamado, { errorMap: () => ({ message: 'Status inválido.' }) }),
});

export const comentarioSchema = z.object({
  texto: z.string({ required_error: 'Escreva o comentário.' }).trim().min(1, 'Escreva o comentário.').max(2000, 'O comentário deve ter no máximo 2000 caracteres.'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});

export type CriarChamadoInput = z.infer<typeof criarChamadoSchema>;
export type FiltrosChamados = z.infer<typeof filtrosChamadosSchema>;
