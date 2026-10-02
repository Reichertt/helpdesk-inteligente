import { Prisma, StatusChamado } from '@prisma/client';
import { obterProvedorIA } from '../ai';
import { PROMPT_VERSAO } from '../ai/prompt';
import { conflict, notFound, unprocessable } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { UsuarioAutenticado } from '../middlewares/auth';
import type { CriarChamadoInput, FiltrosChamados } from '../validators/chamadoValidators';
import { calcularResolvidoEm, ehEstadoFinal, transicoesPermitidas, validarTransicao } from './regrasStatus';
import { agendarTriagem } from './triagemProcessador';

const includeDetalhe = {
  categoria: true,
  comentarios: { orderBy: { criadoEm: 'asc' } },
  historico: { orderBy: { alteradoEm: 'asc' } },
  triagens: {
    orderBy: { criadoEm: 'desc' },
    take: 1,
    include: { categoriaSugerida: { select: { id: true, nome: true } } },
  },
} satisfies Prisma.ChamadoInclude;

export async function buscarChamado(id: number) {
  const chamado = await prisma.chamado.findUnique({ where: { id }, include: includeDetalhe });
  if (!chamado) throw notFound(`Chamado ${id} não encontrado.`);

  const { triagens, ...dados } = chamado;
  return { ...dados, triagem: triagens[0] ?? null, transicoesPermitidas: transicoesPermitidas(chamado) };
}

export async function listarChamados(filtros: FiltrosChamados) {
  const { pagina, tamanhoPagina, ordenarPor, direcao, busca, dataInicio, dataFim } = filtros;

  const where: Prisma.ChamadoWhereInput = {
    status: filtros.status,
    prioridade: filtros.prioridade,
    categoriaId: filtros.categoriaId,
  };
  if (dataInicio || dataFim) {
    // dataFim é inclusiva: considera o dia inteiro informado.
    const fimExclusivo = dataFim ? new Date(dataFim.getTime() + 24 * 60 * 60 * 1000) : undefined;
    where.criadoEm = { gte: dataInicio, lt: fimExclusivo };
  }
  if (busca) {
    where.OR = [
      { titulo: { contains: busca, mode: 'insensitive' } },
      { descricao: { contains: busca, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.ChamadoOrderByWithRelationInput[] =
    ordenarPor === 'prioridade' ? [{ prioridade: direcao }, { criadoEm: 'desc' }] : [{ criadoEm: direcao }, { id: direcao }];

  const [itens, total] = await prisma.$transaction([
    prisma.chamado.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * tamanhoPagina,
      take: tamanhoPagina,
      select: {
        id: true,
        titulo: true,
        solicitanteNome: true,
        prioridade: true,
        status: true,
        criadoEm: true,
        atualizadoEm: true,
        categoria: { select: { id: true, nome: true } },
        triagens: { orderBy: { criadoEm: 'desc' }, take: 1, select: { status: true } },
      },
    }),
    prisma.chamado.count({ where }),
  ]);

  return {
    itens: itens.map(({ triagens, ...c }) => ({ ...c, statusTriagem: triagens[0]?.status ?? null })),
    pagina,
    tamanhoPagina,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / tamanhoPagina)),
  };
}

export async function criarChamado(dados: CriarChamadoInput, usuario: UsuarioAutenticado, correlationId?: string) {
  if (dados.categoriaId) {
    const categoria = await prisma.categoria.findUnique({ where: { id: dados.categoriaId } });
    if (!categoria) throw unprocessable('A categoria informada não existe.');
  }

  const triagem = await prisma.$transaction(async (tx) => {
    const chamado = await tx.chamado.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        solicitanteNome: dados.solicitanteNome,
        solicitanteEmail: dados.solicitanteEmail,
        categoriaId: dados.categoriaId ?? null,
        prioridade: dados.prioridade,
        historico: { create: { statusAnterior: null, statusNovo: StatusChamado.ABERTO, alteradoPor: usuario.nome } },
      },
    });
    return tx.triagemIA.create({
      data: { chamadoId: chamado.id, modelo: obterProvedorIA().nome, promptVersao: PROMPT_VERSAO },
    });
  });

  agendarTriagem(triagem.id, correlationId);
  return buscarChamado(triagem.chamadoId);
}

export async function mudarStatus(id: number, destino: StatusChamado, usuario: UsuarioAutenticado) {
  const chamado = await prisma.chamado.findUnique({ where: { id }, select: { status: true, prioridade: true } });
  if (!chamado) throw notFound(`Chamado ${id} não encontrado.`);

  validarTransicao(chamado, destino);

  const agora = new Date();
  const resolvidoEm = calcularResolvidoEm(chamado.status, destino, agora);

  await prisma.$transaction(async (tx) => {
    // Atualização condicionada ao status lido: evita que duas mudanças simultâneas passem pela validação.
    const { count } = await tx.chamado.updateMany({
      where: { id, status: chamado.status },
      data: { status: destino, ...(resolvidoEm !== undefined && { resolvidoEm }) },
    });
    if (count === 0) throw conflict('O chamado foi alterado por outra pessoa. Recarregue e tente novamente.');

    await tx.historicoStatus.create({
      data: { chamadoId: id, statusAnterior: chamado.status, statusNovo: destino, alteradoPor: usuario.nome, alteradoEm: agora },
    });
  });

  return buscarChamado(id);
}

export async function adicionarComentario(id: number, texto: string, usuario: UsuarioAutenticado) {
  const chamado = await prisma.chamado.findUnique({ where: { id }, select: { status: true } });
  if (!chamado) throw notFound(`Chamado ${id} não encontrado.`);
  if (ehEstadoFinal(chamado.status)) {
    throw conflict(`O chamado está ${chamado.status} e não aceita novos comentários.`);
  }

  return prisma.comentario.create({ data: { chamadoId: id, texto, autor: usuario.nome } });
}

export async function garantirChamadoAtivo(id: number) {
  const chamado = await prisma.chamado.findUnique({ where: { id }, select: { status: true } });
  if (!chamado) throw notFound(`Chamado ${id} não encontrado.`);
  if (ehEstadoFinal(chamado.status)) {
    throw conflict(`O chamado está ${chamado.status}; a triagem não pode mais ser alterada.`);
  }
}
