import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { ChamadoForm } from '../components/chamados/ChamadoForm';
import { Carregando, ErroEstado } from '../components/ui/Estados';
import { useAuth } from '../hooks/useAuth';
import { useCategorias } from '../hooks/useCategorias';
import { useCriarChamado } from '../hooks/useChamados';

export function NovoChamadoPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const categorias = useCategorias();
  const criar = useCriarChamado();

  const erroApi = criar.error instanceof ApiError ? criar.error : null;
  const errosCampos = erroApi?.erros ?? {};
  const mensagemGeral = criar.error && Object.keys(errosCampos).length === 0 ? criar.error.message : null;

  return (
    <div className="pagina pagina-estreita">
      <header className="pagina-cabecalho">
        <div>
          <Link to="/chamados" className="voltar">
            Voltar para chamados
          </Link>
          <h1>Novo chamado</h1>
          <p className="texto-suave">Depois de aberto, a IA sugere categoria, prioridade e uma primeira resposta.</p>
        </div>
      </header>

      {categorias.isLoading ? (
        <Carregando texto="Preparando formulário…" />
      ) : categorias.isError ? (
        <ErroEstado mensagem={categorias.error.message} onTentarNovamente={() => categorias.refetch()} />
      ) : (
        <>
          {mensagemGeral && (
            <p className="alerta alerta-erro" role="alert">
              {mensagemGeral}
            </p>
          )}
          <ChamadoForm
            categorias={categorias.data ?? []}
            enviando={criar.isPending}
            errosServidor={errosCampos}
            valoresIniciais={usuario?.perfil === 'SOLICITANTE' ? { solicitanteNome: usuario.nome, solicitanteEmail: usuario.email } : undefined}
            onSubmit={(dados) => criar.mutate(dados, { onSuccess: (chamado) => navigate(`/chamados/${chamado.id}`) })}
          />
        </>
      )}
    </div>
  );
}
