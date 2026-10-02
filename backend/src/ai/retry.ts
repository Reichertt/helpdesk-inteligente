import { ErroProvedorIA } from './provedor';

export interface OpcoesRetry {
  timeoutMs: number;
  maxRetries: number;
  esperaBaseMs?: number;
}

export class FalhaAposTentativas extends Error {
  constructor(
    public readonly causa: unknown,
    public readonly tentativas: number,
  ) {
    super(causa instanceof Error ? causa.message : String(causa));
  }
}

function ehRetentavel(erro: unknown) {
  if (erro instanceof ErroProvedorIA) return erro.retentavel;
  if (erro instanceof Error && (erro.name === 'AbortError' || erro.name === 'TimeoutError')) return true;
  // fetch lança TypeError em falhas de rede (DNS, conexão recusada).
  return erro instanceof TypeError;
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cada tentativa tem seu próprio timeout; entre tentativas aplica backoff exponencial.
export async function executarComRetry<T>(
  operacao: (signal: AbortSignal) => Promise<T>,
  { timeoutMs, maxRetries, esperaBaseMs = 500 }: OpcoesRetry,
): Promise<{ resultado: T; tentativas: number }> {
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= maxRetries + 1; tentativa++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return { resultado: await operacao(controller.signal), tentativas: tentativa };
    } catch (erro) {
      ultimoErro = controller.signal.aborted ? new ErroProvedorIA(`Tempo limite de ${timeoutMs} ms excedido.`, true) : erro;
      if (tentativa > maxRetries || !ehRetentavel(ultimoErro)) {
        throw new FalhaAposTentativas(ultimoErro, tentativa);
      }
      await esperar(esperaBaseMs * 2 ** (tentativa - 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new FalhaAposTentativas(ultimoErro, maxRetries + 1);
}
