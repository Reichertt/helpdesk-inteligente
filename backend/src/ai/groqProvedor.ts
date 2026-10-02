import { ErroProvedorIA, type EntradaTriagem, type ProvedorIA, type RespostaProvedor } from './provedor';
import { montarPromptSistema, montarPromptUsuario } from './prompt';

interface RespostaGroq {
  model: string;
  choices: { message: { content: string | null } }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export class GroqProvedor implements ProvedorIA {
  readonly nome = 'groq';

  constructor(
    private readonly apiKey: string,
    private readonly modelo: string,
    private readonly baseUrl: string,
  ) {}

  async gerarTriagem(entrada: EntradaTriagem, signal: AbortSignal): Promise<RespostaProvedor> {
    const resposta = await fetch(this.baseUrl, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b', 
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: montarPromptSistema(entrada.categorias) },
          { role: 'user', content: montarPromptUsuario(entrada.titulo, entrada.descricao) },
        ],
      }),
    });

    if (!resposta.ok) {
      // Lê o corpo da resposta de erro do Groq
      const corpoErro = await resposta.text();
      console.log('>>> CORPO DO ERRO GROQ:', corpoErro);

      const retentavel = resposta.status === 429 || resposta.status >= 500;
      throw new ErroProvedorIA(`Groq respondeu com HTTP ${resposta.status}.`, retentavel);
    }

    const corpo = (await resposta.json()) as RespostaGroq;
    const conteudo = corpo.choices?.[0]?.message?.content;
    if (!conteudo) throw new ErroProvedorIA('Groq retornou uma resposta vazia.', true);

    return {
      conteudo,
      modelo: `groq:${corpo.model ?? this.modelo}`,
      tokensEntrada: corpo.usage?.prompt_tokens,
      tokensSaida: corpo.usage?.completion_tokens,
    };
  }
}
