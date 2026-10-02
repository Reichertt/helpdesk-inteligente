import { useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { FiltrosChamados as Filtros, Prioridade, Status } from '../api/types';
import { FiltrosChamados } from '../components/chamados/FiltrosChamados';
import { ListaChamados } from '../components/chamados/ListaChamados';
import { Carregando, ErroEstado, Vazio } from '../components/ui/Estados';
import { Paginacao } from '../components/ui/Paginacao';
import { useCategorias } from '../hooks/useCategorias';
import { useChamados } from '../hooks/useChamados';
import { PRIORIDADES, STATUS } from '../utils/rotulos';

const TAMANHO_PAGINA = 10;
const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

// A URL é a fonte de verdade dos filtros: recarregar ou compartilhar o link mantém o estado.
function lerFiltros(params: URLSearchParams): Filtros {
  const status = params.get('status') as Status | null;
  const prioridade = params.get('prioridade') as Prioridade | null;
  const categoriaId = Number(params.get('categoriaId'));
  const dataInicio = params.get('dataInicio') ?? '';
  const dataFim = params.get('dataFim') ?? '';

  return {
    status: status && STATUS.includes(status) ? status : undefined,
    prioridade: prioridade && PRIORIDADES.includes(prioridade) ? prioridade : undefined,
    categoriaId: Number.isInteger(categoriaId) && categoriaId > 0 ? categoriaId : undefined,
    busca: params.get('busca')?.trim() || undefined,
    dataInicio: DATA_VALIDA.test(dataInicio) ? dataInicio : undefined,
    dataFim: DATA_VALIDA.test(dataFim) ? dataFim : undefined,
    pagina: Math.max(1, Number(params.get('pagina')) || 1),
    tamanhoPagina: TAMANHO_PAGINA,
    ordenarPor: params.get('ordenarPor') === 'prioridade' ? 'prioridade' : 'criadoEm',
    direcao: params.get('direcao') === 'asc' ? 'asc' : 'desc',
  };
}

export function ChamadosPage() {
  const [params, setParams] = useSearchParams();
  const filtros = useMemo(() => lerFiltros(params), [params]);
  const categorias = useCategorias();
  const { data, isLoading, isError, error, refetch, isFetching } = useChamados(filtros);

  const alterar = useCallback(
    (alteracoes: Partial<Record<keyof Filtros, string>>) => {
      setParams(
        (atual) => {
          const novos = new URLSearchParams(atual);
          Object.entries(alteracoes).forEach(([chave, valor]) => (valor ? novos.set(chave, valor) : novos.delete(chave)));
          if (!('pagina' in alteracoes)) novos.delete('pagina');
          return novos;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const limpar = useCallback(() => setParams({}, { replace: true }), [setParams]);

  return (
    <div className="pagina">
      <header className="pagina-cabecalho">
        <div>
          <h1>Chamados</h1>
          <p className="texto-suave">Acompanhe, filtre e abra o detalhe de cada solicitação.</p>
        </div>
        <Link to="/chamados/novo" className="botao botao-primario">
          Novo chamado
        </Link>
      </header>

      <FiltrosChamados filtros={filtros} categorias={categorias.data ?? []} onAlterar={alterar} onLimpar={limpar} />

      {isLoading ? (
        <Carregando texto="Carregando chamados…" />
      ) : isError ? (
        <ErroEstado mensagem={error.message} onTentarNovamente={() => refetch()} />
      ) : !data || data.itens.length === 0 ? (
        <Vazio titulo="Nenhum chamado encontrado com esses filtros.">
          <button type="button" className="botao botao-secundario" onClick={limpar}>
            Limpar filtros
          </button>
        </Vazio>
      ) : (
        <div className={isFetching ? 'atualizando' : undefined} aria-busy={isFetching}>
          <ListaChamados chamados={data.itens} />
          <Paginacao
            pagina={data.pagina}
            totalPaginas={data.totalPaginas}
            total={data.total}
            onMudar={(pagina) => alterar({ pagina: String(pagina) })}
          />
        </div>
      )}
    </div>
  );
}
