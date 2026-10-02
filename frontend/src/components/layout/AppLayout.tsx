import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="app">
      <header className="topbar">
        <button
          type="button"
          className="botao-menu"
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <span className="topbar-titulo">HelpDesk</span>
      </header>

      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
      {menuAberto && <div className="sobreposicao" onClick={() => setMenuAberto(false)} aria-hidden="true" />}

      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
