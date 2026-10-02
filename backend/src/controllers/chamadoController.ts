import type { Request, Response } from 'express';
import { StatusTriagem } from '@prisma/client';
import { usuarioDaRequisicao } from '../middlewares/auth';
import * as chamadoService from '../services/chamadoService';
import * as triagemService from '../services/triagemService';
import {
  comentarioSchema,
  criarChamadoSchema,
  filtrosChamadosSchema,
  idParamSchema,
  mudarStatusSchema,
} from '../validators/chamadoValidators';

export async function listar(req: Request, res: Response) {
  res.json(await chamadoService.listarChamados(filtrosChamadosSchema.parse(req.query)));
}

export async function detalhar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await chamadoService.buscarChamado(id));
}

export async function criar(req: Request, res: Response) {
  const dados = criarChamadoSchema.parse(req.body);
  const chamado = await chamadoService.criarChamado(dados, usuarioDaRequisicao(req), String(req.id));
  res.status(201).location(`/api/chamados/${chamado.id}`).json(chamado);
}

export async function mudarStatus(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { status } = mudarStatusSchema.parse(req.body);
  res.json(await chamadoService.mudarStatus(id, status, usuarioDaRequisicao(req)));
}

export async function comentar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { texto } = comentarioSchema.parse(req.body);
  res.status(201).json(await chamadoService.adicionarComentario(id, texto, usuarioDaRequisicao(req)));
}

export async function refazerTriagem(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.status(202).json(await triagemService.refazerTriagem(id, String(req.id)));
}

export async function aceitarTriagem(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await triagemService.decidirTriagem(id, StatusTriagem.ACEITA, usuarioDaRequisicao(req)));
}

export async function rejeitarTriagem(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await triagemService.decidirTriagem(id, StatusTriagem.REJEITADA, usuarioDaRequisicao(req)));
}
