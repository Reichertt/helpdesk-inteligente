export interface EntradaTriagem {
  titulo: string;
  descricao: string;
  categorias: string[];
}

export interface RespostaProvedor {
  conteudo: string;
  modelo: string;
  tokensEntrada?: number;
  tokensSaida?: number;
}

export interface ProvedorIA {
  readonly nome: string;
  gerarTriagem(entrada: EntradaTriagem, signal: AbortSignal): Promise<RespostaProvedor>;
}

export class ErroProvedorIA extends Error {
  constructor(
    message: string,
    public readonly retentavel: boolean,
  ) {
    super(message);
  }
}
