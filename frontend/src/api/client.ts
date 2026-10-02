import type { Sessao } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const CHAVE_SESSAO = 'helpdesk.sessao';
export const EVENTO_SESSAO_EXPIRADA = 'helpdesk:sessao-expirada';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly titulo: string,
    public readonly detalhe: string,
    public readonly erros: Record<string, string[]> = {},
  ) {
    super(detalhe);
  }
}

export function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: Sessao) {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_SESSAO);
}

type Query = Record<string, string | number | undefined | null>;

interface Opcoes {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  query?: Query;
}

export async function api<T>(caminho: string, { method = 'GET', body, query }: Opcoes = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${caminho}`, window.location.origin);
  Object.entries(query ?? {}).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(chave, String(valor));
  });

  const sessao = lerSessao();
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(sessao && { Authorization: `Bearer ${sessao.token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Sem conexão', 'Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.');
  }

  if (resposta.status === 401 && sessao) {
    limparSessao();
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }

  if (!resposta.ok) {
    const problema = await resposta.json().catch(() => null);
    throw new ApiError(
      resposta.status,
      problema?.title ?? 'Erro',
      problema?.detail ?? `O servidor respondeu com erro ${resposta.status}.`,
      problema?.errors ?? {},
    );
  }

  return resposta.status === 204 ? (undefined as T) : ((await resposta.json()) as T);
}
