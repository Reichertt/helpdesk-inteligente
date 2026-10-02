import { Prioridade, StatusChamado } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { AppError } from '../../src/lib/errors';
import { calcularResolvidoEm, transicoesPermitidas, validarTransicao } from '../../src/services/regrasStatus';

const { ABERTO, EM_ANDAMENTO, RESOLVIDO, FECHADO, CANCELADO } = StatusChamado;

function statusDoErro(fn: () => void) {
  try {
    fn();
  } catch (e) {
    return e instanceof AppError ? e.status : -1;
  }
  return null;
}

describe('regras de transição de status', () => {
  it.each([
    [ABERTO, EM_ANDAMENTO],
    [ABERTO, CANCELADO],
    [EM_ANDAMENTO, RESOLVIDO],
    [RESOLVIDO, FECHADO],
    [RESOLVIDO, EM_ANDAMENTO],
  ])('permite %s → %s', (de, para) => {
    expect(() => validarTransicao({ status: de, prioridade: Prioridade.MEDIA }, para)).not.toThrow();
  });

  it.each([
    [ABERTO, RESOLVIDO],
    [ABERTO, FECHADO],
    [EM_ANDAMENTO, ABERTO],
    [EM_ANDAMENTO, CANCELADO],
    [RESOLVIDO, ABERTO],
    [RESOLVIDO, CANCELADO],
  ])('rejeita %s → %s com 409', (de, para) => {
    expect(statusDoErro(() => validarTransicao({ status: de, prioridade: Prioridade.MEDIA }, para))).toBe(409);
  });

  it.each([FECHADO, CANCELADO])('estado final %s não aceita nenhuma transição', (final) => {
    for (const destino of Object.values(StatusChamado)) {
      expect(statusDoErro(() => validarTransicao({ status: final, prioridade: Prioridade.BAIXA }, destino))).toBe(409);
    }
  });

  it('não permite cancelar chamado com prioridade Crítica (422)', () => {
    expect(statusDoErro(() => validarTransicao({ status: ABERTO, prioridade: Prioridade.CRITICA }, CANCELADO))).toBe(422);
  });

  it('lista apenas as transições permitidas, sem cancelamento para Crítica', () => {
    expect(transicoesPermitidas({ status: ABERTO, prioridade: Prioridade.ALTA })).toEqual([EM_ANDAMENTO, CANCELADO]);
    expect(transicoesPermitidas({ status: ABERTO, prioridade: Prioridade.CRITICA })).toEqual([EM_ANDAMENTO]);
    expect(transicoesPermitidas({ status: FECHADO, prioridade: Prioridade.BAIXA })).toEqual([]);
  });

  it('preenche resolvidoEm ao resolver e limpa ao reabrir', () => {
    const agora = new Date();
    expect(calcularResolvidoEm(EM_ANDAMENTO, RESOLVIDO, agora)).toBe(agora);
    expect(calcularResolvidoEm(RESOLVIDO, EM_ANDAMENTO, agora)).toBeNull();
    expect(calcularResolvidoEm(RESOLVIDO, FECHADO, agora)).toBeUndefined();
  });
});
