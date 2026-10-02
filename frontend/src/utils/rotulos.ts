import type { Prioridade, Status, StatusTriagem } from '../api/types';

export const STATUS: Status[] = ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO', 'CANCELADO'];
export const PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

export const ROTULO_STATUS: Record<Status, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
};

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const ROTULO_TRIAGEM: Record<StatusTriagem, string> = {
  PENDENTE: 'Em análise',
  CONCLUIDA: 'Aguardando decisão',
  FALHOU: 'Falhou',
  ACEITA: 'Aceita',
  REJEITADA: 'Rejeitada',
};

export const COR_STATUS: Record<Status, string> = {
  ABERTO: '#2F5DA8',
  EM_ANDAMENTO: '#7B57B2',
  RESOLVIDO: '#12715B',
  FECHADO: '#5D6B78',
  CANCELADO: '#A7AFB6',
};

export const COR_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: '#6E8B7D',
  MEDIA: '#B98A12',
  ALTA: '#C8621E',
  CRITICA: '#B3261E',
};

export function rotuloAcao(atual: Status, destino: Status) {
  if (destino === 'EM_ANDAMENTO') return atual === 'RESOLVIDO' ? 'Reabrir' : 'Iniciar atendimento';
  if (destino === 'RESOLVIDO') return 'Marcar como resolvido';
  if (destino === 'FECHADO') return 'Fechar chamado';
  if (destino === 'CANCELADO') return 'Cancelar chamado';
  return ROTULO_STATUS[destino];
}
