export type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO' | 'CANCELADO';
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type StatusTriagem = 'PENDENTE' | 'CONCLUIDA' | 'FALHOU' | 'ACEITA' | 'REJEITADA';
export type Perfil = 'SOLICITANTE' | 'ATENDENTE';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface ChamadoResumo {
  id: number;
  titulo: string;
  solicitanteNome: string;
  prioridade: Prioridade;
  status: Status;
  criadoEm: string;
  atualizadoEm: string;
  categoria: Categoria | null;
  statusTriagem: StatusTriagem | null;
}

export interface Pagina<T> {
  itens: T[];
  pagina: number;
  tamanhoPagina: number;
  total: number;
  totalPaginas: number;
}

export interface Comentario {
  id: number;
  autor: string;
  texto: string;
  criadoEm: string;
}

export interface HistoricoStatus {
  id: number;
  statusAnterior: Status | null;
  statusNovo: Status;
  alteradoEm: string;
  alteradoPor: string;
}

export interface Triagem {
  id: number;
  status: StatusTriagem;
  categoriaSugerida: Categoria | null;
  prioridadeSugerida: Prioridade | null;
  resumo: string | null;
  respostaSugerida: string | null;
  confianca: number | null;
  modelo: string;
  promptVersao: string;
  erro: string | null;
  decididoPor: string | null;
  decididoEm: string | null;
  criadoEm: string;
}

export interface ChamadoDetalhe {
  id: number;
  titulo: string;
  descricao: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  prioridade: Prioridade;
  status: Status;
  criadoEm: string;
  atualizadoEm: string;
  resolvidoEm: string | null;
  categoria: Categoria | null;
  comentarios: Comentario[];
  historico: HistoricoStatus[];
  triagem: Triagem | null;
  transicoesPermitidas: Status[];
}

export interface NovoChamado {
  titulo: string;
  descricao: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  categoriaId?: number | null;
  prioridade?: Prioridade;
}

export interface FiltrosChamados {
  status?: Status;
  prioridade?: Prioridade;
  categoriaId?: number;
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
  pagina: number;
  tamanhoPagina: number;
  ordenarPor: 'criadoEm' | 'prioridade';
  direcao: 'asc' | 'desc';
}

export interface ResumoDashboard {
  totalChamados: number;
  porStatus: { status: Status; total: number }[];
  porPrioridade: { prioridade: Prioridade; total: number }[];
  tempoMedioResolucaoHoras: {
    geral: number | null;
    porCategoria: { categoriaId: number; categoria: string; horas: number; resolvidos: number }[];
  };
  triagemIA: {
    aceitas: number;
    rejeitadas: number;
    falhas: number;
    aguardandoDecisao: number;
    taxaAceitacao: number | null;
    tokensConsumidos: { entrada: number; saida: number };
    qualidadePorCategoria: { categoria: string; aceitas: number; rejeitadas: number; taxaAceitacao: number | null }[];
  };
}
