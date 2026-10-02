import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { definirProvedorIA } from '../../src/ai';
import type { ProvedorIA } from '../../src/ai/provedor';
import { criarApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const app = criarApp();
let tokenAtendente: string;
let tokenSolicitante: string;
let ultimaEntradaIA: { titulo: string; descricao: string } | null = null;

function provedorMock(conteudo: string): ProvedorIA {
  return {
    nome: 'mock',
    async gerarTriagem(entrada) {
      ultimaEntradaIA = { titulo: entrada.titulo, descricao: entrada.descricao };
      return { conteudo, modelo: 'mock:v1', tokensEntrada: 120, tokensSaida: 80 };
    },
  };
}

const sugestaoValida = JSON.stringify({
  categoria: 'Financeiro',
  prioridade: 'Crítica',
  resumo: 'Cobrança duplicada no cartão.',
  respostaSugerida: 'Olá! Vamos verificar a cobrança.',
  confianca: 0.9,
});

const novoChamado = {
  titulo: 'Cobrança em duplicidade',
  descricao: 'Fui cobrado duas vezes. Meu telefone é (48) 99812-3456 e meu CPF 123.456.789-09.',
  solicitanteNome: 'Pessoa de Teste',
  solicitanteEmail: 'pessoa.teste@exemplo.com',
};

async function login(email: string, senha: string) {
  const res = await request(app).post('/api/auth/login').send({ email, senha });
  return res.body.token as string;
}

const comoAtendente = (req: request.Test) => req.set('Authorization', `Bearer ${tokenAtendente}`);

async function aguardarTriagem(id: number) {
  for (let i = 0; i < 50; i++) {
    const res = await comoAtendente(request(app).get(`/api/chamados/${id}`));
    if (res.body.triagem?.status !== 'PENDENTE') return res.body;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('triagem não terminou a tempo');
}

async function criarChamado(dados = novoChamado) {
  const res = await comoAtendente(request(app).post('/api/chamados')).send(dados);
  expect(res.status).toBe(201);
  return res.body;
}

beforeAll(async () => {
  tokenAtendente = await login('admin@helpdesk.local', 'admin123');
  tokenSolicitante = await login('solicitante@helpdesk.local', 'solicitante123');
});

beforeEach(() => {
  ultimaEntradaIA = null;
  definirProvedorIA(provedorMock(sugestaoValida));
});

afterAll(async () => {
  definirProvedorIA(null);
  await prisma.$disconnect();
});

describe('infra e autenticação', () => {
  it('GET /health responde ok com o banco', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', banco: 'ok' });
  });

  it('rejeita login com senha errada usando Problem Details', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@helpdesk.local', senha: 'errada' });
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('exige token nas rotas da API', async () => {
    expect((await request(app).get('/api/chamados')).status).toBe(401);
  });
});

describe('POST /api/chamados', () => {
  it('valida campos obrigatórios e formato do e-mail (400)', async () => {
    const res = await comoAtendente(request(app).post('/api/chamados')).send({ ...novoChamado, solicitanteEmail: 'invalido', titulo: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('solicitanteEmail');
    expect(res.body.errors).toHaveProperty('titulo');
  });

  it('cria o chamado, registra histórico e conclui a triagem sem enviar dados pessoais', async () => {
    const criado = await criarChamado();
    expect(criado.status).toBe('ABERTO');
    expect(criado.historico).toHaveLength(1);
    expect(criado.triagem.status).toBe('PENDENTE');

    const detalhe = await aguardarTriagem(criado.id);
    expect(detalhe.triagem).toMatchObject({ status: 'CONCLUIDA', prioridadeSugerida: 'CRITICA', tokensEntrada: 120 });
    expect(detalhe.triagem.categoriaSugerida.nome).toBe('Financeiro');

    expect(ultimaEntradaIA?.descricao).toContain('[TELEFONE]');
    expect(ultimaEntradaIA?.descricao).toContain('[CPF]');
    expect(JSON.stringify(ultimaEntradaIA)).not.toContain(novoChamado.solicitanteEmail);
    expect(JSON.stringify(ultimaEntradaIA)).not.toContain(novoChamado.solicitanteNome);
  });

  it('cria o chamado mesmo quando a IA responde fora do formato, marcando a triagem como FALHOU', async () => {
    definirProvedorIA(provedorMock('{"categoria": "Inexistente"}'));
    const criado = await criarChamado();
    const detalhe = await aguardarTriagem(criado.id);
    expect(detalhe.status).toBe('ABERTO');
    expect(detalhe.triagem.status).toBe('FALHOU');
    expect(detalhe.triagem.erro).toBeTruthy();
  });

  it('cria o chamado mesmo quando o provedor está fora do ar', async () => {
    definirProvedorIA({ nome: 'fora', gerarTriagem: async () => { throw new TypeError('fetch failed'); } });
    const criado = await criarChamado();
    expect((await aguardarTriagem(criado.id)).triagem.status).toBe('FALHOU');
  });
});

describe('fluxo de status', () => {
  it('aplica transições válidas, preenche e limpa resolvidoEm e grava histórico', async () => {
    const { id } = await criarChamado();
    const patch = (status: string) => comoAtendente(request(app).patch(`/api/chamados/${id}/status`)).send({ status });

    expect((await patch('RESOLVIDO')).status).toBe(409);
    expect((await patch('EM_ANDAMENTO')).status).toBe(200);

    const resolvido = await patch('RESOLVIDO');
    expect(resolvido.body.resolvidoEm).not.toBeNull();

    const reaberto = await patch('EM_ANDAMENTO');
    expect(reaberto.body.resolvidoEm).toBeNull();

    await patch('RESOLVIDO');
    const fechado = await patch('FECHADO');
    expect(fechado.body.transicoesPermitidas).toEqual([]);
    expect(fechado.body.historico.map((h: { statusNovo: string }) => h.statusNovo)).toEqual([
      'ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO',
    ]);

    const comentario = await comoAtendente(request(app).post(`/api/chamados/${id}/comentarios`)).send({ texto: 'Mais um' });
    expect(comentario.status).toBe(409);
  });

  it('não cancela chamado Crítico (422)', async () => {
    const { id } = await criarChamado({ ...novoChamado, prioridade: 'CRITICA' } as typeof novoChamado);
    const res = await comoAtendente(request(app).patch(`/api/chamados/${id}/status`)).send({ status: 'CANCELADO' });
    expect(res.status).toBe(422);
  });

  it('solicitante não pode mudar status (403)', async () => {
    const { id } = await criarChamado();
    const res = await request(app)
      .patch(`/api/chamados/${id}/status`)
      .set('Authorization', `Bearer ${tokenSolicitante}`)
      .send({ status: 'EM_ANDAMENTO' });
    expect(res.status).toBe(403);
  });

  it('retorna 404 para chamado inexistente', async () => {
    expect((await comoAtendente(request(app).get('/api/chamados/999999'))).status).toBe(404);
  });
});

describe('triagem por IA', () => {
  it('aceitar aplica categoria e prioridade sugeridas', async () => {
    const { id } = await criarChamado();
    await aguardarTriagem(id);
    const res = await comoAtendente(request(app).post(`/api/chamados/${id}/triagem/aceitar`));
    expect(res.status).toBe(200);
    expect(res.body.prioridade).toBe('CRITICA');
    expect(res.body.categoria.nome).toBe('Financeiro');
    expect(res.body.triagem.status).toBe('ACEITA');

    const novamente = await comoAtendente(request(app).post(`/api/chamados/${id}/triagem/rejeitar`));
    expect(novamente.status).toBe(409);
  });

  it('rejeitar não altera o chamado e refazer gera nova triagem', async () => {
    const { id, prioridade } = await criarChamado();
    await aguardarTriagem(id);
    const rejeitado = await comoAtendente(request(app).post(`/api/chamados/${id}/triagem/rejeitar`));
    expect(rejeitado.body.triagem.status).toBe('REJEITADA');
    expect(rejeitado.body.prioridade).toBe(prioridade);
    expect(rejeitado.body.categoria).toBeNull();

    const refeito = await comoAtendente(request(app).post(`/api/chamados/${id}/triagem`));
    expect(refeito.status).toBe(202);
    expect((await aguardarTriagem(id)).triagem.status).toBe('CONCLUIDA');
  });
});

describe('listagem e dashboard', () => {
  it('lista com filtro, paginação e ordenação por prioridade', async () => {
    const res = await comoAtendente(request(app).get('/api/chamados'))
      .query({ status: 'FECHADO', tamanhoPagina: 5, ordenarPor: 'prioridade', direcao: 'desc' });
    expect(res.status).toBe(200);
    expect(res.body.itens.length).toBeLessThanOrEqual(5);
    expect(res.body.total).toBeGreaterThanOrEqual(10);
    expect(res.body.itens.every((c: { status: string }) => c.status === 'FECHADO')).toBe(true);
  });

  it('busca por texto no título ou descrição', async () => {
    const res = await comoAtendente(request(app).get('/api/chamados')).query({ busca: 'boleto' });
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('valida parâmetros de consulta (400)', async () => {
    expect((await comoAtendente(request(app).get('/api/chamados')).query({ status: 'QUALQUER' })).status).toBe(400);
  });

  it('resume totais por status e métricas da IA a partir do banco', async () => {
    const res = await comoAtendente(request(app).get('/api/dashboard/resumo'));
    expect(res.status).toBe(200);

    const totalBanco = await prisma.chamado.count();
    const somaStatus = res.body.porStatus.reduce((s: number, i: { total: number }) => s + i.total, 0);
    expect(res.body.totalChamados).toBe(totalBanco);
    expect(somaStatus).toBe(totalBanco);
    expect(res.body.tempoMedioResolucaoHoras.porCategoria.length).toBeGreaterThan(0);
    expect(res.body.triagemIA.taxaAceitacao).toBeGreaterThan(0);
  });
});
