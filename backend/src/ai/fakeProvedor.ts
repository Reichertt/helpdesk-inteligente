import type { EntradaTriagem, ProvedorIA, RespostaProvedor } from './provedor';

const REGRAS: { termos: RegExp; categoria: string }[] = [
  { termos: /senha|login|acesso|logar|bloquead|autentica/i, categoria: 'Acesso/Login' },
  { termos: /boleto|fatura|pagamento|cobran|nota fiscal|estorno|financeir/i, categoria: 'Financeiro' },
  { termos: /servidor|rede|vpn|impressora|wi-?fi|backup|lentid/i, categoria: 'Infraestrutura' },
  { termos: /erro|bug|falha|trava|não funciona|quebr/i, categoria: 'Bug no sistema' },
  { termos: /como|dúvida|duvida|é possível|onde/i, categoria: 'Dúvida' },
];

function definirPrioridade(texto: string) {
  if (/fora do ar|parad|todos|ninguém|nenhum usuário/i.test(texto)) return 'Crítica';
  if (/urgente|não consigo|impedid|cobrad|duplic/i.test(texto)) return 'Alta';
  if (/dúvida|como|gostaria|solicit/i.test(texto)) return 'Baixa';
  return 'Média';
}

// Provedor determinístico para rodar o projeto e os testes sem chave de API.
// Se a descrição contiver [simular-falha-ia], devolve uma resposta inválida para exercitar o estado "falhou".
export class FakeProvedor implements ProvedorIA {
  readonly nome = 'fake';

  constructor(private readonly latenciaMs = 600) {}

  async gerarTriagem({ titulo, descricao, categorias }: EntradaTriagem, signal: AbortSignal): Promise<RespostaProvedor> {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, this.latenciaMs);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(Object.assign(new Error('abortado'), { name: 'AbortError' }));
      });
    });

    if (descricao.includes('[simular-falha-ia]')) {
      return { conteudo: 'isso não é JSON', modelo: 'fake:topmed-v1' };
    }

    const texto = `${titulo} ${descricao}`;
    const sugerida = REGRAS.find((r) => r.termos.test(texto) && categorias.includes(r.categoria))?.categoria;
    const categoria = sugerida ?? categorias[0];

    const conteudo = JSON.stringify({
      categoria,
      prioridade: definirPrioridade(texto),
      resumo: `Solicitante relata: ${titulo}`.slice(0, 200),
      respostaSugerida: `Olá! Recebemos seu chamado sobre "${titulo}". Nossa equipe de ${categoria} já está analisando e retornaremos em breve com uma atualização.`,
      confianca: sugerida ? 0.8 : 0.4,
    });

    return { conteudo, modelo: 'fake:topmed-v1', tokensEntrada: 0, tokensSaida: 0 };
  }
}
