import { useState, type FormEvent } from 'react';
import type { Comentario } from '../../api/types';
import { formatarDataHora } from '../../utils/formatacao';

interface Props {
  comentarios: Comentario[];
  permiteNovo: boolean;
  enviando: boolean;
  erro?: string | null;
  onEnviar: (texto: string) => Promise<unknown>;
}

export function Comentarios({ comentarios, permiteNovo, enviando, erro, onEnviar }: Props) {
  const [texto, setTexto] = useState('');
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!texto.trim()) {
      setErroLocal('Escreva o comentário antes de enviar.');
      return;
    }
    setErroLocal(null);
    try {
      await onEnviar(texto.trim());
      setTexto('');
    } catch {
      // A mensagem da API chega pela prop `erro`.
    }
  };

  return (
    <section className="secao" aria-labelledby="comentarios-titulo">
      <h2 id="comentarios-titulo">Comentários</h2>

      {comentarios.length === 0 ? (
        <p className="texto-suave">Nenhum comentário ainda.</p>
      ) : (
        <ol className="lista-comentarios">
          {comentarios.map((c) => (
            <li key={c.id}>
              <p className="comentario-meta">
                <strong>{c.autor}</strong> <time dateTime={c.criadoEm}>{formatarDataHora(c.criadoEm)}</time>
              </p>
              <p className="comentario-texto">{c.texto}</p>
            </li>
          ))}
        </ol>
      )}

      {permiteNovo ? (
        <form className="form-comentario" onSubmit={enviar} noValidate>
          <label htmlFor="novo-comentario">Novo comentário</label>
          <textarea id="novo-comentario" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} />
          {(erroLocal || erro) && (
            <p className="campo-erro" role="alert">
              {erroLocal ?? erro}
            </p>
          )}
          <button type="submit" className="botao botao-secundario" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Comentar'}
          </button>
        </form>
      ) : (
        <p className="texto-suave">Chamados fechados ou cancelados não recebem novos comentários.</p>
      )}
    </section>
  );
}
