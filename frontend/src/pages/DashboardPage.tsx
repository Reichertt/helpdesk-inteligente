import { Link } from 'react-router-dom';
import { GraficoPrioridade, GraficoStatus, GraficoTempoResolucao } from '../components/dashboard/Graficos';
import { Indicadores } from '../components/dashboard/Indicadores';
import { Carregando, ErroEstado, Vazio } from '../components/ui/Estados';
import { useDashboard } from '../hooks/useDashboard';
import { formatarNumero, formatarPercentual } from '../utils/formatacao';

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  return (
    <div className="pagina">
      <header className="pagina-cabecalho">
        <div>
          <h1>Painel</h1>
          <p className="texto-suave">Visão geral dos chamados e do desempenho da triagem por IA.</p>
        </div>
      </header>

      {isLoading ? (
        <Carregando texto="Calculando indicadores…" />
      ) : isError ? (
        <ErroEstado mensagem={error.message} onTentarNovamente={() => refetch()} />
      ) : !data || data.totalChamados === 0 ? (
        <Vazio titulo="Ainda não há chamados registrados.">
          <Link to="/chamados/novo" className="botao botao-primario">
            Abrir o primeiro chamado
          </Link>
        </Vazio>
      ) : (
        <>
          <Indicadores resumo={data} />

          <div className="grade-dashboard">
            <section className="secao secao-grafico">
              <h2>Chamados por status</h2>
              <GraficoStatus dados={data.porStatus} />
            </section>

            <section className="secao">
              <h2>Chamados por prioridade</h2>
              <GraficoPrioridade dados={data.porPrioridade} />
            </section>

            <section className="secao secao-grafico">
              <h2>Tempo médio de resolução por categoria</h2>
              {data.tempoMedioResolucaoHoras.porCategoria.length === 0 ? (
                <p className="texto-suave">Nenhum chamado resolvido ainda.</p>
              ) : (
                <GraficoTempoResolucao dados={data.tempoMedioResolucaoHoras.porCategoria} />
              )}
            </section>

            <section className="secao">
              <h2>Qualidade da triagem por IA</h2>
              <dl className="ia-resumo">
                <div>
                  <dt>Aguardando decisão</dt>
                  <dd>{data.triagemIA.aguardandoDecisao}</dd>
                </div>
                <div>
                  <dt>Falhas</dt>
                  <dd>{data.triagemIA.falhas}</dd>
                </div>
                <div>
                  <dt>Tokens consumidos</dt>
                  <dd>{formatarNumero(data.triagemIA.tokensConsumidos.entrada + data.triagemIA.tokensConsumidos.saida)}</dd>
                </div>
              </dl>
              {data.triagemIA.qualidadePorCategoria.length === 0 ? (
                <p className="texto-suave">Nenhuma sugestão foi aceita ou rejeitada ainda.</p>
              ) : (
                <div className="tabela-rolagem">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th scope="col">Categoria sugerida</th>
                        <th scope="col">Aceitas</th>
                        <th scope="col">Rejeitadas</th>
                        <th scope="col">Aceitação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.triagemIA.qualidadePorCategoria.map((q) => (
                        <tr key={q.categoria}>
                          <th scope="row">{q.categoria}</th>
                          <td>{q.aceitas}</td>
                          <td>{q.rejeitadas}</td>
                          <td>{formatarPercentual(q.taxaAceitacao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
