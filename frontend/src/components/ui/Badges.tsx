import type { Prioridade, Status, StatusTriagem } from '../../api/types';
import { ROTULO_PRIORIDADE, ROTULO_STATUS, ROTULO_TRIAGEM } from '../../utils/rotulos';

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-status status-${status.toLowerCase()}`}>{ROTULO_STATUS[status]}</span>;
}

const NIVEL: Record<Prioridade, number> = { BAIXA: 1, MEDIA: 2, ALTA: 3, CRITICA: 3 };

// Barras crescentes deixam a prioridade legível mesmo sem distinguir as cores.
export function PrioridadeBadge({ prioridade }: { prioridade: Prioridade }) {
  return (
    <span className={`badge badge-prioridade prioridade-${prioridade.toLowerCase()}`}>
      <span className="barras" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i key={n} className={n <= NIVEL[prioridade] ? 'ativa' : undefined} />
        ))}
      </span>
      {ROTULO_PRIORIDADE[prioridade]}
    </span>
  );
}

export function TriagemBadge({ status }: { status: StatusTriagem }) {
  return <span className={`badge badge-triagem triagem-${status.toLowerCase()}`}>IA: {ROTULO_TRIAGEM[status]}</span>;
}
