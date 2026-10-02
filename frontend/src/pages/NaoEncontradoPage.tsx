import { Link } from 'react-router-dom';

export function NaoEncontradoPage() {
  return (
    <div className="pagina">
      <h1>Página não encontrada</h1>
      <p className="texto-suave">O endereço acessado não existe.</p>
      <Link to="/" className="botao botao-secundario">
        Ir para o painel
      </Link>
    </div>
  );
}
