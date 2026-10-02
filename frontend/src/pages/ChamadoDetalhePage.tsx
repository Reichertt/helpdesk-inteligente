import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Comentarios } from '../components/chamados/Comentarios';
import { HistoricoStatus } from '../components/chamados/HistoricoStatus';
import { StatusAcoes } from '../components/chamados/StatusAcoes';
import { TriagemPainel } from '../components/chamados/TriagemPainel';
import { PrioridadeBadge, StatusBadge } from '../components/ui/Badges';
import { Carregando, ErroEstado } from '../components/ui/Estados';
import { useAuth } from '../hooks/useAuth';
import { useAcaoTriagem, useAdicionarComentario, useChamado, useMudarStatus } from '../hooks/useChamados';
import { formatarDataHora, numeroChamado } from '../utils/formatacao';

export function ChamadoDetalhePage() {
  const id = Number(useParams().id);
  const { ehAtendente } = useAuth();
  const { data: chamado, isLoading, isError, error, refetch } = useChamado(id);
  const mudarStatus = useMudarStatus(id);
  const comentar = useAdicionarComentario(id);
  const acaoTriagem = useAcaoTriagem(id);

  if (!Number.isInteger(id) || id <= 0) return <ErroEstado mensagem="Endereço de chamado inválido." />;
  if (isLoading) return <Carregando texto="Carregando chamado…" />;
  if (isError) {
    const naoEncontrado = error instanceof ApiError && error.status === 404;
    return (
      <div className="pagina">
        <ErroEstado
          mensagem={naoEncontrado ? 'Este chamado não existe ou foi removido.' : error.message}
          onTentarNovamente={naoEncontrado ? undefined : () => refetch()}
        />
        <Link to="/chamados" className="voltar">
          Voltar para chamados
        </Link>
      </div>
    );
  }
  if (!chamado) return null;

  const finalizado = chamado.transicoesPermitidas.length === 0;

  return (
    <div className="pagina">
      <Link to="/chamados" className="voltar">
        Voltar para chamados
      </Link>

      <header className={`detalhe-cabecalho borda-${chamado.prioridade.toLowerCase()}`}>
        <span className="numero-chamado numero-grande">{numeroChamado(chamado.id)}</span>
        <h1>{chamado.titulo}</h1>
        <div className="detalhe-badges">
          <StatusBadge status={chamado.status} />
          <PrioridadeBadge prioridade={chamado.prioridade} />
          <span className="badge">{chamado.categoria?.nome ?? 'Sem categoria'}</span>
        </div>
      </header>

      <div className="detalhe-grade">
        <div className="detalhe-principal">
          <section className="secao">
            <h2>Descrição</h2>
            <p className="descricao">{chamado.descricao}</p>
            <dl className="dados-chamado">
              <div>
                <dt>Solicitante</dt>
                <dd>
                  {chamado.solicitanteNome}
                  <br />
                  <span className="texto-suave">{chamado.solicitanteEmail}</span>
                </dd>
              </div>
              <div>
                <dt>Aberto em</dt>
                <dd>{formatarDataHora(chamado.criadoEm)}</dd>
              </div>
              <div>
                <dt>Atualizado em</dt>
                <dd>{formatarDataHora(chamado.atualizadoEm)}</dd>
              </div>
              {chamado.resolvidoEm && (
                <div>
                  <dt>Resolvido em</dt>
                  <dd>{formatarDataHora(chamado.resolvidoEm)}</dd>
                </div>
              )}
            </dl>
          </section>

          {ehAtendente && (
            <section className="secao">
              <h2>Status</h2>
              <StatusAcoes
                statusAtual={chamado.status}
                transicoes={chamado.transicoesPermitidas}
                carregando={mudarStatus.isPending}
                onMudar={(destino) => mudarStatus.mutate(destino)}
              />
              {mudarStatus.error && (
                <p className="alerta alerta-erro" role="alert">
                  {mudarStatus.error.message}
                </p>
              )}
            </section>
          )}

          <Comentarios
            comentarios={chamado.comentarios}
            permiteNovo={!finalizado}
            enviando={comentar.isPending}
            erro={comentar.error?.message}
            onEnviar={(texto) => comentar.mutateAsync(texto)}
          />
        </div>

        <aside className="detalhe-lateral">
          <TriagemPainel
            triagem={chamado.triagem}
            podeAgir={ehAtendente && !finalizado}
            acaoEmAndamento={acaoTriagem.isPending ? acaoTriagem.variables ?? null : null}
            erro={acaoTriagem.error?.message}
            onAcao={(acao) => acaoTriagem.mutate(acao)}
          />
          <HistoricoStatus itens={chamado.historico} />
        </aside>
      </div>
    </div>
  );
}
