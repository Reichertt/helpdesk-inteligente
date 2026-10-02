import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ResumoDashboard } from '../../api/types';
import { COR_PRIORIDADE, COR_STATUS, ROTULO_PRIORIDADE, ROTULO_STATUS } from '../../utils/rotulos';

const eixo = { fontSize: 12, fill: '#5D6B78' };

export function GraficoStatus({ dados }: { dados: ResumoDashboard['porStatus'] }) {
  const linhas = dados.map((d) => ({ nome: ROTULO_STATUS[d.status], total: d.total, cor: COR_STATUS[d.status] }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={linhas} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#E4E8E6" />
        <XAxis dataKey="nome" tick={eixo} tickLine={false} axisLine={false} interval={0} />
        <YAxis allowDecimals={false} tick={eixo} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'rgba(24,34,47,0.05)' }} formatter={(v) => [String(v), 'Chamados']} />
        <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={56}>
          {linhas.map((l) => (
            <Cell key={l.nome} fill={l.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoPrioridade({ dados }: { dados: ResumoDashboard['porPrioridade'] }) {
  const total = dados.reduce((soma, d) => soma + d.total, 0) || 1;
  return (
    <ul className="barras-prioridade">
      {dados.map((d) => (
        <li key={d.prioridade}>
          <span className="barras-rotulo">{ROTULO_PRIORIDADE[d.prioridade]}</span>
          <span className="barras-trilho">
            <span
              className="barras-preenchimento"
              style={{ width: `${(d.total / total) * 100}%`, background: COR_PRIORIDADE[d.prioridade] }}
            />
          </span>
          <span className="barras-valor">{d.total}</span>
        </li>
      ))}
    </ul>
  );
}

export function GraficoTempoResolucao({ dados }: { dados: ResumoDashboard['tempoMedioResolucaoHoras']['porCategoria'] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, dados.length * 44)}>
      <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="#E4E8E6" />
        <XAxis type="number" tick={eixo} tickLine={false} axisLine={false} unit=" h" />
        <YAxis type="category" dataKey="categoria" tick={eixo} tickLine={false} axisLine={false} width={120} />
        <Tooltip
          cursor={{ fill: 'rgba(24,34,47,0.05)' }}
          formatter={(v) => [`${Number(v).toLocaleString('pt-BR')} h`, 'Tempo médio']}
        />
        <Bar dataKey="horas" fill="#12715B" radius={[0, 3, 3, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
