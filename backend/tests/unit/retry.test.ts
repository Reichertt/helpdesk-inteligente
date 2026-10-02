import { describe, expect, it, vi } from 'vitest';
import { ErroProvedorIA } from '../../src/ai/provedor';
import { executarComRetry, FalhaAposTentativas } from '../../src/ai/retry';

const opcoes = { timeoutMs: 50, maxRetries: 2, esperaBaseMs: 1 };

describe('retry e timeout da chamada à IA', () => {
  it('repete em erro retentável e devolve o número de tentativas', async () => {
    const operacao = vi
      .fn()
      .mockRejectedValueOnce(new ErroProvedorIA('HTTP 503', true))
      .mockResolvedValueOnce('ok');

    await expect(executarComRetry(operacao, opcoes)).resolves.toEqual({ resultado: 'ok', tentativas: 2 });
  });

  it('não repete em erro não retentável', async () => {
    const operacao = vi.fn().mockRejectedValue(new ErroProvedorIA('HTTP 401', false));
    await expect(executarComRetry(operacao, opcoes)).rejects.toBeInstanceOf(FalhaAposTentativas);
    expect(operacao).toHaveBeenCalledTimes(1);
  });

  it('aborta por timeout e desiste após o máximo de tentativas', async () => {
    const operacao = vi.fn(
      (signal: AbortSignal) =>
        new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('abortado')))),
    );
    const erro = await executarComRetry(operacao, opcoes).catch((e) => e);
    expect(erro).toBeInstanceOf(FalhaAposTentativas);
    expect(erro.tentativas).toBe(3);
    expect(erro.message).toContain('Tempo limite');
  });
});
