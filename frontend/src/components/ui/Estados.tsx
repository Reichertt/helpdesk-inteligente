import type { ReactNode } from 'react';

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  );
}

export function ErroEstado({ mensagem, onTentarNovamente }: { mensagem: string; onTentarNovamente?: () => void }) {
  return (
    <div className="estado estado-erro" role="alert">
      <p>{mensagem}</p>
      {onTentarNovamente && (
        <button type="button" className="botao botao-secundario" onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="estado estado-vazio">
      <p className="estado-titulo">{titulo}</p>
      {children}
    </div>
  );
}
