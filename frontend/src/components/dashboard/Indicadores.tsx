import type { ResumoDashboard } from '../../api/types';
import { formatarHoras, formatarNumero, formatarPercentual } from '../../utils/formatacao';

export function Indicadores({ resumo }: { resumo: ResumoDashboard }) {
  const total = (status: string[]) =>
    resumo.porStatus.filter((s) => status.includes(s.status)).reduce((soma, s) => soma + s.total, 0);
  const { triagemIA } = resumo;

  const itens = [
    { rotulo: 'Chamados registrados', valor: formatarNumero(resumo.totalChamados) },
    { rotulo: 'Em aberto ou em andamento', valor: formatarNumero(total(['ABERTO', 'EM_ANDAMENTO'])) },
    { rotulo: 'Resolvidos ou fechados', valor: formatarNumero(total(['RESOLVIDO', 'FECHADO'])) },
    { rotulo: 'Tempo médio de resolução', valor: formatarHoras(resumo.tempoMedioResolucaoHoras.geral) },
    {
      rotulo: 'Sugestões da IA aceitas',
      valor: formatarPercentual(triagemIA.taxaAceitacao),
      detalhe: `${triagemIA.aceitas} aceitas de ${triagemIA.aceitas + triagemIA.rejeitadas} decididas`,
    },
  ];

  return (
    <dl className="indicadores">
      {itens.map((item) => (
        <div key={item.rotulo} className="indicador">
          <dt>{item.rotulo}</dt>
          <dd>
            {item.valor}
            {item.detalhe && <span className="indicador-detalhe">{item.detalhe}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
