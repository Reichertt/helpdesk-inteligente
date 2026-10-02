import { Prioridade, StatusChamado } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface TempoCategoria {
  categoria_id: number;
  categoria: string;
  horas_media: number;
  resolvidos: number;
}

interface ResumoTriagem {
  aceitas: number;
  rejeitadas: number;
  falhas: number;
  pendentes_decisao: number;
  tokens_entrada: number;
  tokens_saida: number;
}

interface QualidadeCategoria {
  categoria: string;
  aceitas: number;
  rejeitadas: number;
}

function taxa(aceitas: number, rejeitadas: number) {
  const decididas = aceitas + rejeitadas;
  return decididas === 0 ? null : Number((aceitas / decididas).toFixed(4));
}

// Todas as métricas são calculadas no banco (GROUP BY / AVG / FILTER), nunca carregando os chamados em memória.
export async function obterResumo() {
  const [porStatus, porPrioridade, tempos, [triagem], qualidade] = await Promise.all([
    prisma.chamado.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.chamado.groupBy({ by: ['prioridade'], _count: { _all: true } }),
    prisma.$queryRaw<TempoCategoria[]>`
      SELECT c.id AS categoria_id,
             c.nome AS categoria,
             ROUND((AVG(EXTRACT(EPOCH FROM (ch.resolvido_em - ch.criado_em))) / 3600)::numeric, 1)::float8 AS horas_media,
             COUNT(*)::int AS resolvidos
        FROM chamados ch
        JOIN categorias c ON c.id = ch.categoria_id
       WHERE ch.resolvido_em IS NOT NULL
       GROUP BY c.id, c.nome
       ORDER BY c.nome`,
    prisma.$queryRaw<ResumoTriagem[]>`
      SELECT COUNT(*) FILTER (WHERE status = 'ACEITA')::int     AS aceitas,
             COUNT(*) FILTER (WHERE status = 'REJEITADA')::int  AS rejeitadas,
             COUNT(*) FILTER (WHERE status = 'FALHOU')::int     AS falhas,
             COUNT(*) FILTER (WHERE status = 'CONCLUIDA')::int  AS pendentes_decisao,
             COALESCE(SUM(tokens_entrada), 0)::int              AS tokens_entrada,
             COALESCE(SUM(tokens_saida), 0)::int                AS tokens_saida
        FROM triagens_ia`,
    prisma.$queryRaw<QualidadeCategoria[]>`
      SELECT c.nome AS categoria,
             COUNT(*) FILTER (WHERE t.status = 'ACEITA')::int    AS aceitas,
             COUNT(*) FILTER (WHERE t.status = 'REJEITADA')::int AS rejeitadas
        FROM triagens_ia t
        JOIN categorias c ON c.id = t.categoria_sugerida_id
       WHERE t.status IN ('ACEITA', 'REJEITADA')
       GROUP BY c.nome
       ORDER BY c.nome`,
  ]);

  const contagemStatus = Object.values(StatusChamado).map((status) => ({
    status,
    total: porStatus.find((s) => s.status === status)?._count._all ?? 0,
  }));
  const contagemPrioridade = Object.values(Prioridade).map((prioridade) => ({
    prioridade,
    total: porPrioridade.find((p) => p.prioridade === prioridade)?._count._all ?? 0,
  }));

  const totalResolvidos = tempos.reduce((soma, t) => soma + t.resolvidos, 0);
  const mediaGeral =
    totalResolvidos === 0
      ? null
      : Number((tempos.reduce((soma, t) => soma + t.horas_media * t.resolvidos, 0) / totalResolvidos).toFixed(1));

  return {
    totalChamados: contagemStatus.reduce((soma, s) => soma + s.total, 0),
    porStatus: contagemStatus,
    porPrioridade: contagemPrioridade,
    tempoMedioResolucaoHoras: {
      geral: mediaGeral,
      porCategoria: tempos.map((t) => ({
        categoriaId: t.categoria_id,
        categoria: t.categoria,
        horas: t.horas_media,
        resolvidos: t.resolvidos,
      })),
    },
    triagemIA: {
      aceitas: triagem.aceitas,
      rejeitadas: triagem.rejeitadas,
      falhas: triagem.falhas,
      aguardandoDecisao: triagem.pendentes_decisao,
      taxaAceitacao: taxa(triagem.aceitas, triagem.rejeitadas),
      tokensConsumidos: { entrada: triagem.tokens_entrada, saida: triagem.tokens_saida },
      qualidadePorCategoria: qualidade.map((q) => ({ ...q, taxaAceitacao: taxa(q.aceitas, q.rejeitadas) })),
    },
  };
}
