import { Prioridade, StatusChamado } from '@prisma/client';
import { conflict, unprocessable } from '../lib/errors';

const TRANSICOES: Record<StatusChamado, StatusChamado[]> = {
  ABERTO: [StatusChamado.EM_ANDAMENTO, StatusChamado.CANCELADO],
  EM_ANDAMENTO: [StatusChamado.RESOLVIDO],
  RESOLVIDO: [StatusChamado.FECHADO, StatusChamado.EM_ANDAMENTO],
  FECHADO: [],
  CANCELADO: [],
};

const ESTADOS_FINAIS: StatusChamado[] = [StatusChamado.FECHADO, StatusChamado.CANCELADO];

interface EstadoChamado {
  status: StatusChamado;
  prioridade: Prioridade;
}

export function ehEstadoFinal(status: StatusChamado) {
  return ESTADOS_FINAIS.includes(status);
}

export function transicoesPermitidas({ status, prioridade }: EstadoChamado): StatusChamado[] {
  return TRANSICOES[status].filter(
    (destino) => !(destino === StatusChamado.CANCELADO && prioridade === Prioridade.CRITICA),
  );
}

export function validarTransicao(chamado: EstadoChamado, destino: StatusChamado) {
  if (ehEstadoFinal(chamado.status)) {
    throw conflict(`O chamado está ${chamado.status} e não aceita mudança de status.`);
  }
  if (!TRANSICOES[chamado.status].includes(destino)) {
    throw conflict(`A transição de ${chamado.status} para ${destino} não é permitida.`);
  }
  if (destino === StatusChamado.CANCELADO && chamado.prioridade === Prioridade.CRITICA) {
    throw unprocessable('Chamados com prioridade Crítica não podem ser cancelados.');
  }
}

// undefined = manter o valor atual; null = limpar (reabertura).
export function calcularResolvidoEm(atual: StatusChamado, destino: StatusChamado, agora: Date): Date | null | undefined {
  if (destino === StatusChamado.RESOLVIDO) return agora;
  if (atual === StatusChamado.RESOLVIDO && destino === StatusChamado.EM_ANDAMENTO) return null;
  return undefined;
}
