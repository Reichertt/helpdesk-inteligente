import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { de?: string } | null)?.de ?? '/';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={destino} replace />;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email.trim(), senha);
      navigate(destino, { replace: true });
    } catch (e) {
      setErro(e instanceof ApiError ? e.detalhe : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login">
      <div className="login-lateral" aria-hidden="true">
        <div className="login-canhoto">
          <span className="canhoto-numero">#0001</span>
          <span className="canhoto-texto">Cada chamado chega triado. Quem decide é você.</span>
        </div>
      </div>

      <main className="login-conteudo">
        <form className="login-form" onSubmit={enviar} noValidate>
          <div className="marca marca-escura">
            <span className="marca-icone" aria-hidden="true" />
            <span>HelpDesk</span>
          </div>
          <h1>Entrar na central de chamados</h1>

          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && (
            <p className="alerta alerta-erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" className="botao botao-primario botao-largo" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  );
}
