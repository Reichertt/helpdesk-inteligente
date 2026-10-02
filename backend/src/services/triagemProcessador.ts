import { StatusTriagem } from '@prisma/client';
import { env } from '../config/env';
import { obterProvedorIA } from '../ai';
import { mascararDadosPessoais } from '../ai/mascaramento';
import { parsearRespostaTriagem } from '../ai/parser';
import { executarComRetry, FalhaAposTentativas } from '../ai/retry';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

const emProcessamento = new Set<number>();

// Processamento em background no próprio processo: a requisição de criação responde
// sem esperar a IA. Triagens que ficarem PENDENTE (ex.: restart da API) são retomadas no boot.
export function agendarTriagem(triagemId: number, correlationId?: string) {
  setImmediate(() => {
    processarTriagem(triagemId, correlationId).catch((err) =>
      logger.error({ err, triagemId }, 'falha inesperada ao processar triagem'),
    );
  });
}

async function finalizarComFalha(triagemId: number, erro: string, dados: Record<string, unknown>) {
  await prisma.triagemIA.updateMany({
    where: { id: triagemId, status: StatusTriagem.PENDENTE },
    data: { ...dados, status: StatusTriagem.FALHOU, erro },
  });
}

export async function processarTriagem(triagemId: number, correlationId?: string) {
  if (emProcessamento.has(triagemId)) return;
  emProcessamento.add(triagemId);

  try {
    const triagem = await prisma.triagemIA.findUnique({
      where: { id: triagemId },
      include: { chamado: { select: { titulo: true, descricao: true } } },
    });
    if (!triagem || triagem.status !== StatusTriagem.PENDENTE) return;

    const categorias = await prisma.categoria.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } });
    const provedor = obterProvedorIA();
    const log = logger.child({ triagemId, chamadoId: triagem.chamadoId, provedor: provedor.nome, correlationId });
    const inicio = Date.now();

    // Nome e e-mail do solicitante nunca são enviados; título e descrição vão mascarados.
    const entrada = {
      titulo: mascararDadosPessoais(triagem.chamado.titulo),
      descricao: mascararDadosPessoais(triagem.chamado.descricao),
      categorias: categorias.map((c) => c.nome),
    };

    let resposta;
    try {
      resposta = await executarComRetry((signal) => provedor.gerarTriagem(entrada, signal), {
        timeoutMs: env.AI_TIMEOUT_MS,
        maxRetries: env.AI_MAX_RETRIES,
      });
      
    } catch (erro) {
      const tentativas = erro instanceof FalhaAposTentativas ? erro.tentativas : 1;
      const motivo = erro instanceof Error ? erro.message : 'Erro desconhecido';
      const latenciaMs = Date.now() - inicio;
      await finalizarComFalha(triagemId, `Falha ao chamar o provedor de IA: ${motivo}`, { tentativas, latenciaMs });
      log.warn({ sucesso: false, latenciaMs, tentativas, motivo }, 'chamada à IA falhou');
      return;
    }

    const { resultado, tentativas } = resposta;
    const latenciaMs = Date.now() - inicio;
    const metricas = {
      modelo: resultado.modelo,
      tentativas,
      latenciaMs,
      tokensEntrada: resultado.tokensEntrada ?? null,
      tokensSaida: resultado.tokensSaida ?? null,
    };

    const parse = parsearRespostaTriagem(resultado.conteudo, categorias);
    if (!parse.ok) {
      await finalizarComFalha(triagemId, parse.erro, metricas);
      log.warn({ sucesso: false, ...metricas, motivo: parse.erro }, 'resposta da IA rejeitada na validação');
      return;
    }

    await prisma.triagemIA.updateMany({
      where: { id: triagemId, status: StatusTriagem.PENDENTE },
      data: {
        ...metricas,
        status: StatusTriagem.CONCLUIDA,
        categoriaSugeridaId: parse.dados.categoriaId,
        prioridadeSugerida: parse.dados.prioridade,
        resumo: parse.dados.resumo,
        respostaSugerida: parse.dados.respostaSugerida,
        confianca: parse.dados.confianca,
        erro: null,
      },
    });
    log.info({ sucesso: true, ...metricas }, 'triagem por IA concluída');
  } finally {
    emProcessamento.delete(triagemId);
  }
}

export async function retomarTriagensPendentes() {
  const pendentes = await prisma.triagemIA.findMany({
    where: { status: StatusTriagem.PENDENTE },
    select: { id: true },
  });
  pendentes.forEach(({ id }) => agendarTriagem(id));
  if (pendentes.length) logger.info({ quantidade: pendentes.length }, 'retomando triagens pendentes');
}
