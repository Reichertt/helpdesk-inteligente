import { useState } from 'react';
import type { Triagem } from '../../api/types';
import type { AcaoTriagem } from '../../hooks/useChamados';
import { formatarDataHora, formatarPercentual } from '../../utils/formatacao';
import { ROTULO_PRIORIDADE } from '../../utils/rotulos';
import { PrioridadeBadge } from '../ui/Badges';

interface Props {
  triagem: Triagem | null;
  podeAgir: boolean;
  acaoEmAndamento: AcaoTriagem | null;
  erro?: string | null;
  onAcao: (acao: AcaoTriagem) => void;
}

export function TriagemPainel({ triagem, podeAgir, acaoEmAndamento, erro, onAcao }: Props) {
  const ocupado = acaoEmAndamento !== null;

  return (
    <section className="painel-ia" aria-labelledby="painel-ia-titulo">
      <header className="painel-ia-cabecalho">
        <h2 id="painel-ia-titulo">Sugestão da IA</h2>
        {triagem && <span className="painel-ia-modelo">{triagem.modelo}</span>}
      </header>
      <p className="painel-ia-aviso">
        Conteúdo gerado automaticamente. Nada é aplicado ao chamado sem a decisão de um atendente.
      </p>

      {erro && (
        <p className="alerta alerta-erro" role="alert">
          {erro}
        </p>
      )}

      <ConteudoTriagem triagem={triagem} />

      {podeAgir && triagem?.status !== 'PENDENTE' && (
        <div className="painel-ia-acoes">
          {triagem?.status === 'CONCLUIDA' && (
            <>
              <button type="button" className="botao botao-primario" disabled={ocupado} onClick={() => onAcao('aceitar')}>
                {acaoEmAndamento === 'aceitar' ? 'Aplicando…' : 'Aceitar sugestão'}
              </button>
              <button type="button" className="botao botao-secundario" disabled={ocupado} onClick={() => onAcao('rejeitar')}>
                {acaoEmAndamento === 'rejeitar' ? 'Rejeitando…' : 'Rejeitar'}
              </button>
            </>
          )}
          <button type="button" className="botao botao-fantasma" disabled={ocupado} onClick={() => onAcao('refazer')}>
            {acaoEmAndamento === 'refazer'
              ? 'Solicitando…'
              : triagem?.status === 'FALHOU'
                ? 'Tentar novamente'
                : triagem
                  ? 'Refazer triagem'
                  : 'Gerar triagem'}
          </button>
        </div>
      )}
    </section>
  );
}

function ConteudoTriagem({ triagem }: { triagem: Triagem | null }) {
  const [copiado, setCopiado] = useState(false);

  if (!triagem) {
    return <p className="texto-suave">Este chamado ainda não passou por triagem.</p>;
  }

  if (triagem.status === 'PENDENTE') {
    return (
      <div className="painel-ia-pendente" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>A IA está analisando o chamado. Isso costuma levar alguns segundos.</p>
      </div>
    );
  }

  if (triagem.status === 'FALHOU') {
    return (
      <div className="alerta alerta-aviso" role="alert">
        <strong>Não foi possível gerar a sugestão.</strong>
        <p>{triagem.erro ?? 'O provedor de IA não respondeu como esperado.'} O chamado segue normalmente; você pode tentar de novo.</p>
      </div>
    );
  }

  const copiar = async () => {
    await navigator.clipboard?.writeText(triagem.respostaSugerida ?? '');
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="painel-ia-conteudo">
      <dl className="painel-ia-dados">
        <div>
          <dt>Categoria</dt>
          <dd>{triagem.categoriaSugerida?.nome ?? '—'}</dd>
        </div>
        <div>
          <dt>Prioridade</dt>
          <dd>{triagem.prioridadeSugerida ? <PrioridadeBadge prioridade={triagem.prioridadeSugerida} /> : '—'}</dd>
        </div>
        <div>
          <dt>Confiança</dt>
          <dd>{formatarPercentual(triagem.confianca)}</dd>
        </div>
      </dl>

      <div className="painel-ia-bloco">
        <h3>Resumo</h3>
        <p>{triagem.resumo}</p>
      </div>

      <div className="painel-ia-bloco">
        <div className="painel-ia-bloco-titulo">
          <h3>Resposta sugerida ao solicitante</h3>
          <button type="button" className="botao-link" onClick={copiar}>
            {copiado ? 'Copiada' : 'Copiar'}
          </button>
        </div>
        <blockquote>{triagem.respostaSugerida}</blockquote>
      </div>

      {(triagem.status === 'ACEITA' || triagem.status === 'REJEITADA') && (
        <p className={`painel-ia-decisao decisao-${triagem.status.toLowerCase()}`}>
          {triagem.status === 'ACEITA'
            ? `Aceita por ${triagem.decididoPor}: categoria e prioridade ${ROTULO_PRIORIDADE[triagem.prioridadeSugerida!].toLowerCase()} aplicadas.`
            : `Rejeitada por ${triagem.decididoPor}. O chamado não foi alterado.`}
          {triagem.decididoEm && ` ${formatarDataHora(triagem.decididoEm)}.`}
        </p>
      )}
    </div>
  );
}
