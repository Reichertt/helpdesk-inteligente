import type { Status } from '../../api/types';
import { rotuloAcao } from '../../utils/rotulos';

interface Props {
  statusAtual: Status;
  transicoes: Status[];
  carregando: boolean;
  onMudar: (destino: Status) => void;
}

// As transições vêm prontas da API (regra única no backend); aqui só exibimos as permitidas.
export function StatusAcoes({ statusAtual, transicoes, carregando, onMudar }: Props) {
  if (transicoes.length === 0) {
    return <p className="texto-suave">Este chamado está finalizado e não aceita mudanças de status.</p>;
  }

  return (
    <div className="acoes-status">
      {transicoes.map((destino) => (
        <button
          key={destino}
          type="button"
          className={`botao ${destino === 'CANCELADO' ? 'botao-perigo' : 'botao-secundario'}`}
          disabled={carregando}
          onClick={() => onMudar(destino)}
        >
          {rotuloAcao(statusAtual, destino)}
        </button>
      ))}
    </div>
  );
}
