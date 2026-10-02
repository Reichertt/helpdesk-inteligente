import { StatusTriagem } from '@prisma/client';
import { obterProvedorIA } from '../ai';
import { PROMPT_VERSAO } from '../ai/prompt';
import { conflict, notFound } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { UsuarioAutenticado } from '../middlewares/auth';
import { buscarChamado, garantirChamadoAtivo } from './chamadoService';
import { agendarTriagem } from './triagemProcessador';

export async function refazerTriagem(chamadoId: number, correlationId?: string) {
  await garantirChamadoAtivo(chamadoId);

  const pendente = await prisma.triagemIA.findFirst({ where: { chamadoId, status: StatusTriagem.PENDENTE } });
  if (pendente) throw conflict('Já existe uma triagem em processamento para este chamado.');

  const triagem = await prisma.triagemIA.create({
    data: { chamadoId, modelo: obterProvedorIA().nome, promptVersao: PROMPT_VERSAO },
  });
  agendarTriagem(triagem.id, correlationId);
  return buscarChamado(chamadoId);
}

export async function decidirTriagem(
  chamadoId: number,
  decisao: typeof StatusTriagem.ACEITA | typeof StatusTriagem.REJEITADA,
  usuario: UsuarioAutenticado,
) {
  await garantirChamadoAtivo(chamadoId);

  const triagem = await prisma.triagemIA.findFirst({ where: { chamadoId }, orderBy: { criadoEm: 'desc' } });
  if (!triagem) throw notFound('Este chamado ainda não possui triagem.');
  if (triagem.status !== StatusTriagem.CONCLUIDA) {
    throw conflict(`A triagem está ${triagem.status}; só é possível decidir sobre triagens concluídas.`);
  }

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.triagemIA.updateMany({
      where: { id: triagem.id, status: StatusTriagem.CONCLUIDA },
      data: { status: decisao, decididoPor: usuario.nome, decididoEm: new Date() },
    });
    if (count === 0) throw conflict('A triagem já foi decidida por outra pessoa.');

    if (decisao === StatusTriagem.ACEITA) {
      await tx.chamado.update({
        where: { id: chamadoId },
        data: { categoriaId: triagem.categoriaSugeridaId, prioridade: triagem.prioridadeSugerida! },
      });
    }
  });

  return buscarChamado(chamadoId);
}
