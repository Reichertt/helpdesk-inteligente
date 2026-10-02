import { env } from '../config/env';
import { FakeProvedor } from './fakeProvedor';
import { GroqProvedor } from './groqProvedor';
import type { ProvedorIA } from './provedor';

let provedorAtual: ProvedorIA | null = null;

export function obterProvedorIA(): ProvedorIA {
  if (!provedorAtual) {
    provedorAtual =
      env.AI_PROVIDER === 'groq'
        ? new GroqProvedor(env.GROQ_API_KEY!, env.GROQ_MODEL, env.GROQ_BASE_URL)
        : new FakeProvedor();
  }
  return provedorAtual;
}

// Usado pelos testes para injetar um provedor controlado.
export function definirProvedorIA(provedor: ProvedorIA | null) {
  provedorAtual = provedor;
}
