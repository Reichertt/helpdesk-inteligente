import { Prioridade } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { parsearRespostaTriagem } from '../../src/ai/parser';

const categorias = [
  { id: 1, nome: 'Acesso/Login' },
  { id: 2, nome: 'Financeiro' },
  { id: 4, nome: 'Dúvida' },
];

const valida = {
  categoria: 'Acesso/Login',
  prioridade: 'Alta',
  resumo: 'Usuário não consegue entrar após trocar a senha.',
  respostaSugerida: 'Olá! Vamos verificar sua conta.',
  confianca: 0.82,
};

describe('parser da resposta da IA', () => {
  it('aceita uma resposta válida e converte categoria e prioridade', () => {
    const resultado = parsearRespostaTriagem(JSON.stringify(valida), categorias);
    expect(resultado).toEqual({
      ok: true,
      dados: { categoriaId: 1, prioridade: Prioridade.ALTA, resumo: valida.resumo, respostaSugerida: valida.respostaSugerida, confianca: 0.82 },
    });
  });

  it('aceita JSON dentro de bloco markdown e ignora acentos/caixa', () => {
    const conteudo = '```json\n' + JSON.stringify({ ...valida, categoria: 'duvida', prioridade: 'MÉDIA' }) + '\n```';
    const resultado = parsearRespostaTriagem(conteudo, categorias);
    expect(resultado.ok && resultado.dados).toMatchObject({ categoriaId: 4, prioridade: Prioridade.MEDIA });
  });

  it('falha com JSON inválido', () => {
    expect(parsearRespostaTriagem('não sou json', categorias)).toEqual({ ok: false, erro: 'A resposta da IA não é um JSON válido.' });
  });

  it('falha quando a categoria não existe', () => {
    const resultado = parsearRespostaTriagem(JSON.stringify({ ...valida, categoria: 'Marketing' }), categorias);
    expect(resultado.ok).toBe(false);
    expect(!resultado.ok && resultado.erro).toContain('Marketing');
  });

  it('falha quando a prioridade é inválida', () => {
    const resultado = parsearRespostaTriagem(JSON.stringify({ ...valida, prioridade: 'Urgentíssima' }), categorias);
    expect(resultado.ok).toBe(false);
  });

  it('falha quando faltam campos ou a confiança está fora de 0..1', () => {
    expect(parsearRespostaTriagem(JSON.stringify({ categoria: 'Financeiro' }), categorias).ok).toBe(false);
    expect(parsearRespostaTriagem(JSON.stringify({ ...valida, confianca: 1.7 }), categorias).ok).toBe(false);
  });

  it('limita o resumo a 200 caracteres', () => {
    const resultado = parsearRespostaTriagem(JSON.stringify({ ...valida, resumo: 'a'.repeat(350) }), categorias);
    expect(resultado.ok && resultado.dados.resumo.length).toBe(200);
  });
});
