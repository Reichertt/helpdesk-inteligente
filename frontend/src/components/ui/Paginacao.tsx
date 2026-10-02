interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  onMudar: (pagina: number) => void;
}

export function Paginacao({ pagina, totalPaginas, total, onMudar }: Props) {
  return (
    <nav className="paginacao" aria-label="Paginação">
      <span>
        {total} {total === 1 ? 'chamado' : 'chamados'}, página {pagina} de {totalPaginas}
      </span>
      <div className="paginacao-botoes">
        <button type="button" className="botao botao-secundario" disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)}>
          Anterior
        </button>
        <button
          type="button"
          className="botao botao-secundario"
          disabled={pagina >= totalPaginas}
          onClick={() => onMudar(pagina + 1)}
        >
          Próxima
        </button>
      </div>
    </nav>
  );
}
