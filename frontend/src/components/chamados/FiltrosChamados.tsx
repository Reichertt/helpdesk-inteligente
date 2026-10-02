import { useEffect, useState } from 'react';
import type { Categoria, FiltrosChamados as Filtros } from '../../api/types';
import { PRIORIDADES, ROTULO_PRIORIDADE, ROTULO_STATUS, STATUS } from '../../utils/rotulos';

const ORDENACOES = [
  { valor: 'criadoEm:desc', rotulo: 'Mais recentes' },
  { valor: 'criadoEm:asc', rotulo: 'Mais antigos' },
  { valor: 'prioridade:desc', rotulo: 'Maior prioridade' },
  { valor: 'prioridade:asc', rotulo: 'Menor prioridade' },
];

interface Props {
  filtros: Filtros;
  categorias: Categoria[];
  onAlterar: (alteracoes: Partial<Record<keyof Filtros, string>>) => void;
  onLimpar: () => void;
}

export function FiltrosChamados({ filtros, categorias, onAlterar, onLimpar }: Props) {
  const [busca, setBusca] = useState(filtros.busca ?? '');

  useEffect(() => setBusca(filtros.busca ?? ''), [filtros.busca]);

  // Espera o usuário parar de digitar para não disparar uma requisição por tecla.
  useEffect(() => {
    if (busca === (filtros.busca ?? '')) return;
    const timer = setTimeout(() => onAlterar({ busca }), 400);
    return () => clearTimeout(timer);
  }, [busca, filtros.busca, onAlterar]);

  const temFiltro = Boolean(
    filtros.status || filtros.prioridade || filtros.categoriaId || filtros.busca || filtros.dataInicio || filtros.dataFim,
  );

  return (
    <div className="filtros" role="search">
      <div className="campo filtro-busca">
        <label htmlFor="busca">Buscar</label>
        <input
          id="busca"
          type="search"
          placeholder="Título ou descrição"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="campo">
        <label htmlFor="filtro-status">Status</label>
        <select id="filtro-status" value={filtros.status ?? ''} onChange={(e) => onAlterar({ status: e.target.value })}>
          <option value="">Todos</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {ROTULO_STATUS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="filtro-prioridade">Prioridade</label>
        <select
          id="filtro-prioridade"
          value={filtros.prioridade ?? ''}
          onChange={(e) => onAlterar({ prioridade: e.target.value })}
        >
          <option value="">Todas</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {ROTULO_PRIORIDADE[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="filtro-categoria">Categoria</label>
        <select
          id="filtro-categoria"
          value={filtros.categoriaId ?? ''}
          onChange={(e) => onAlterar({ categoriaId: e.target.value })}
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="filtro-inicio">De</label>
        <input id="filtro-inicio" type="date" value={filtros.dataInicio ?? ''} onChange={(e) => onAlterar({ dataInicio: e.target.value })} />
      </div>

      <div className="campo">
        <label htmlFor="filtro-fim">Até</label>
        <input id="filtro-fim" type="date" value={filtros.dataFim ?? ''} onChange={(e) => onAlterar({ dataFim: e.target.value })} />
      </div>

      <div className="campo">
        <label htmlFor="ordenacao">Ordenar por</label>
        <select
          id="ordenacao"
          value={`${filtros.ordenarPor}:${filtros.direcao}`}
          onChange={(e) => {
            const [ordenarPor, direcao] = e.target.value.split(':');
            onAlterar({ ordenarPor, direcao });
          }}
        >
          {ORDENACOES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </div>

      {temFiltro && (
        <button type="button" className="botao-link filtros-limpar" onClick={onLimpar}>
          Limpar filtros
        </button>
      )}
    </div>
  );
}
