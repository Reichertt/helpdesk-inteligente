import { Prioridade } from '@prisma/client';
import { z } from 'zod';

export interface TriagemValidada {
  categoriaId: number;
  prioridade: Prioridade;
  resumo: string;
  respostaSugerida: string;
  confianca: number;
}

export type ResultadoParse = { ok: true; dados: TriagemValidada } | { ok: false; erro: string };

const RESUMO_MAX = 200;

const schema = z.object({
  categoria: z.string().min(1),
  prioridade: z.string().min(1),
  resumo: z.string().trim().min(1),
  respostaSugerida: z.string().trim().min(1),
  confianca: z.number().min(0).max(1),
});

const PRIORIDADES: Record<string, Prioridade> = {
  baixa: Prioridade.BAIXA,
  media: Prioridade.MEDIA,
  alta: Prioridade.ALTA,
  critica: Prioridade.CRITICA,
};

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

// Alguns modelos envolvem o JSON em ```json ... ``` ou adicionam texto ao redor.
function extrairJson(conteudo: string) {
  const inicio = conteudo.indexOf('{');
  const fim = conteudo.lastIndexOf('}');
  return inicio >= 0 && fim > inicio ? conteudo.slice(inicio, fim + 1) : conteudo;
}

export function parsearRespostaTriagem(
  conteudo: string,
  categorias: { id: number; nome: string }[],
): ResultadoParse {
  let bruto: unknown;
  try {
    bruto = JSON.parse(extrairJson(conteudo));
  } catch {
    return { ok: false, erro: 'A resposta da IA não é um JSON válido.' };
  }

  const resultado = schema.safeParse(bruto);
  if (!resultado.success) {
    const campos = resultado.error.issues.map((i) => i.path.join('.') || 'raiz').join(', ');
    return { ok: false, erro: `A resposta da IA está fora do formato esperado (campos: ${campos}).` };
  }

  const { categoria, prioridade, resumo, respostaSugerida, confianca } = resultado.data;

  const categoriaEncontrada = categorias.find((c) => normalizar(c.nome) === normalizar(categoria));
  if (!categoriaEncontrada) {
    return { ok: false, erro: `A IA sugeriu a categoria "${categoria}", que não existe.` };
  }

  const prioridadeEncontrada = PRIORIDADES[normalizar(prioridade)];
  if (!prioridadeEncontrada) {
    return { ok: false, erro: `A IA sugeriu a prioridade "${prioridade}", que é inválida.` };
  }

  return {
    ok: true,
    dados: {
      categoriaId: categoriaEncontrada.id,
      prioridade: prioridadeEncontrada,
      resumo: resumo.length > RESUMO_MAX ? `${resumo.slice(0, RESUMO_MAX - 1)}…` : resumo,
      respostaSugerida,
      confianca,
    },
  };
}
