import { useState, type FormEvent, type ReactNode } from 'react';
import type { Categoria, NovoChamado, Prioridade } from '../../api/types';
import { PRIORIDADES, ROTULO_PRIORIDADE } from '../../utils/rotulos';

type Campos = {
  titulo: string;
  descricao: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  categoriaId: string;
  prioridade: Prioridade;
};

export type ErrosForm = Partial<Record<keyof Campos, string>>;

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validarChamado(campos: Campos): ErrosForm {
  const erros: ErrosForm = {};
  const titulo = campos.titulo.trim();
  const descricao = campos.descricao.trim();

  if (!titulo) erros.titulo = 'Informe o título.';
  else if (titulo.length < 5) erros.titulo = 'O título deve ter ao menos 5 caracteres.';
  else if (titulo.length > 150) erros.titulo = 'O título deve ter no máximo 150 caracteres.';

  if (!descricao) erros.descricao = 'Descreva o problema.';
  else if (descricao.length < 10) erros.descricao = 'A descrição deve ter ao menos 10 caracteres.';

  if (campos.solicitanteNome.trim().length < 2) erros.solicitanteNome = 'Informe o nome do solicitante.';

  if (!campos.solicitanteEmail.trim()) erros.solicitanteEmail = 'Informe o e-mail do solicitante.';
  else if (!REGEX_EMAIL.test(campos.solicitanteEmail.trim())) erros.solicitanteEmail = 'Informe um e-mail válido.';

  return erros;
}

interface Props {
  categorias: Categoria[];
  enviando: boolean;
  errosServidor?: Record<string, string[]>;
  valoresIniciais?: Partial<Campos>;
  onSubmit: (dados: NovoChamado) => void;
}

export function ChamadoForm({ categorias, enviando, errosServidor = {}, valoresIniciais, onSubmit }: Props) {
  const [campos, setCampos] = useState<Campos>({
    titulo: '',
    descricao: '',
    solicitanteNome: '',
    solicitanteEmail: '',
    categoriaId: '',
    prioridade: 'MEDIA',
    ...valoresIniciais,
  });
  const [erros, setErros] = useState<ErrosForm>({});

  const alterar = <K extends keyof Campos>(campo: K, valor: Campos[K]) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados = validarChamado(campos);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    onSubmit({
      titulo: campos.titulo.trim(),
      descricao: campos.descricao.trim(),
      solicitanteNome: campos.solicitanteNome.trim(),
      solicitanteEmail: campos.solicitanteEmail.trim(),
      categoriaId: campos.categoriaId ? Number(campos.categoriaId) : null,
      prioridade: campos.prioridade,
    });
  };

  // Erro do cliente tem precedência; se não houver, mostra o que a API devolveu para o campo.
  const erroDe = (campo: keyof Campos) => erros[campo] ?? errosServidor[campo]?.[0];

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <Campo id="titulo" rotulo="Título" erro={erroDe('titulo')}>
        <input
          id="titulo"
          value={campos.titulo}
          maxLength={150}
          onChange={(e) => alterar('titulo', e.target.value)}
          aria-invalid={Boolean(erroDe('titulo'))}
          aria-describedby="titulo-erro"
        />
      </Campo>

      <Campo id="descricao" rotulo="Descrição" erro={erroDe('descricao')} dica="Evite colocar senhas ou documentos pessoais.">
        <textarea
          id="descricao"
          rows={6}
          value={campos.descricao}
          onChange={(e) => alterar('descricao', e.target.value)}
          aria-invalid={Boolean(erroDe('descricao'))}
          aria-describedby="descricao-erro"
        />
      </Campo>

      <div className="grade-2">
        <Campo id="solicitanteNome" rotulo="Nome do solicitante" erro={erroDe('solicitanteNome')}>
          <input
            id="solicitanteNome"
            value={campos.solicitanteNome}
            onChange={(e) => alterar('solicitanteNome', e.target.value)}
            aria-invalid={Boolean(erroDe('solicitanteNome'))}
            aria-describedby="solicitanteNome-erro"
          />
        </Campo>
        <Campo id="solicitanteEmail" rotulo="E-mail do solicitante" erro={erroDe('solicitanteEmail')}>
          <input
            id="solicitanteEmail"
            type="email"
            value={campos.solicitanteEmail}
            onChange={(e) => alterar('solicitanteEmail', e.target.value)}
            aria-invalid={Boolean(erroDe('solicitanteEmail'))}
            aria-describedby="solicitanteEmail-erro"
          />
        </Campo>
      </div>

      <div className="grade-2">
        <Campo id="categoriaId" rotulo="Categoria (opcional)" dica="Se não souber, a IA vai sugerir uma.">
          <select id="categoriaId" value={campos.categoriaId} onChange={(e) => alterar('categoriaId', e.target.value)}>
            <option value="">Deixar a IA sugerir</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="prioridade" rotulo="Prioridade">
          <select id="prioridade" value={campos.prioridade} onChange={(e) => alterar('prioridade', e.target.value as Prioridade)}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PRIORIDADE[p]}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="formulario-acoes">
        <button type="submit" className="botao botao-primario" disabled={enviando}>
          {enviando ? 'Abrindo chamado…' : 'Abrir chamado'}
        </button>
      </div>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  erro,
  dica,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
}) {
  return (
    <div className={`campo ${erro ? 'campo-invalido' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      {children}
      {erro ? (
        <p className="campo-erro" id={`${id}-erro`} role="alert">
          {erro}
        </p>
      ) : (
        dica && <p className="campo-dica">{dica}</p>
      )}
    </div>
  );
}
