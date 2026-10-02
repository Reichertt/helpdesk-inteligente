import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { para: '/', texto: 'Painel', fim: true },
  { para: '/chamados', texto: 'Chamados', fim: true },
  { para: '/chamados/novo', texto: 'Novo chamado', fim: true },
];

export function Sidebar({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const { usuario, sair } = useAuth();

  return (
    <aside className={`sidebar ${aberta ? 'aberta' : ''}`}>
      <div className="marca">
        <span className="marca-icone" aria-hidden="true" />
        <span>HelpDesk</span>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {links.map((link) => (
          <NavLink key={link.para} to={link.para} end={link.fim} onClick={onFechar}>
            {link.texto}
          </NavLink>
        ))}
      </nav>

      {usuario && (
        <div className="sidebar-usuario">
          <p className="usuario-nome">{usuario.nome}</p>
          <p className="usuario-perfil">{usuario.perfil === 'ATENDENTE' ? 'Atendente' : 'Solicitante'}</p>
          <button type="button" className="botao-link" onClick={sair}>
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
