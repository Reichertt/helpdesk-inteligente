import { Link } from 'react-router-dom';
import type { ChamadoResumo } from '../../api/types';
import { formatarDataHora, numeroChamado } from '../../utils/formatacao';
import { PrioridadeBadge, StatusBadge, TriagemBadge } from '../ui/Badges';

export function ListaChamados({ chamados }: { chamados: ChamadoResumo[] }) {
  return (
    <div className="lista-chamados">
      <div className="lista-cabecalho" aria-hidden="true">
        <span>Chamado</span>
        <span>Categoria</span>
        <span>Prioridade</span>
        <span>Status</span>
        <span>Aberto em</span>
      </div>
      <ul>
        {chamados.map((c) => (
          <li key={c.id} className={`linha-chamado borda-${c.prioridade.toLowerCase()}`}>
            <div className="linha-principal">
              <span className="numero-chamado">{numeroChamado(c.id)}</span>
              <Link to={`/chamados/${c.id}`} className="linha-titulo">
                {c.titulo}
              </Link>
              <span className="texto-suave linha-solicitante">{c.solicitanteNome}</span>
            </div>
            <span className="linha-categoria">
              {c.categoria?.nome ?? <em className="texto-suave">Sem categoria</em>}
              {c.statusTriagem === 'CONCLUIDA' && <TriagemBadge status={c.statusTriagem} />}
            </span>
            <span>
              <PrioridadeBadge prioridade={c.prioridade} />
            </span>
            <span>
              <StatusBadge status={c.status} />
            </span>
            <time className="texto-suave" dateTime={c.criadoEm}>
              {formatarDataHora(c.criadoEm)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
