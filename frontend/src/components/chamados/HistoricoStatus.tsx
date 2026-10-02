import type { HistoricoStatus as Historico } from '../../api/types';
import { formatarDataHora } from '../../utils/formatacao';
import { ROTULO_STATUS } from '../../utils/rotulos';

export function HistoricoStatus({ itens }: { itens: Historico[] }) {
  return (
    <section className="secao" aria-labelledby="historico-titulo">
      <h2 id="historico-titulo">Histórico de status</h2>
      <ol className="linha-tempo">
        {itens.map((h) => (
          <li key={h.id}>
            <p>
              {h.statusAnterior ? (
                <>
                  {ROTULO_STATUS[h.statusAnterior]} para <strong>{ROTULO_STATUS[h.statusNovo]}</strong>
                </>
              ) : (
                <>
                  Chamado aberto como <strong>{ROTULO_STATUS[h.statusNovo]}</strong>
                </>
              )}
            </p>
            <p className="texto-suave">
              {h.alteradoPor}, <time dateTime={h.alteradoEm}>{formatarDataHora(h.alteradoEm)}</time>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
