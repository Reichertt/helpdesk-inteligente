import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chamadosApi } from '../api/endpoints';
import type { ChamadoDetalhe, FiltrosChamados, NovoChamado, Status } from '../api/types';

export const chaves = {
  lista: (filtros: FiltrosChamados) => ['chamados', 'lista', filtros] as const,
  detalhe: (id: number) => ['chamados', 'detalhe', id] as const,
};

export function useChamados(filtros: FiltrosChamados) {
  return useQuery({
    queryKey: chaves.lista(filtros),
    queryFn: () => chamadosApi.listar(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useChamado(id: number) {
  return useQuery({
    queryKey: chaves.detalhe(id),
    queryFn: () => chamadosApi.detalhe(id),
    enabled: Number.isInteger(id) && id > 0,
    // Enquanto a IA processa, consulta de novo a cada 2s até a triagem sair de PENDENTE.
    refetchInterval: (query) => (query.state.data?.triagem?.status === 'PENDENTE' ? 2000 : false),
  });
}

function useAtualizarDetalhe() {
  const queryClient = useQueryClient();
  return (chamado: ChamadoDetalhe) => {
    queryClient.setQueryData(chaves.detalhe(chamado.id), chamado);
    queryClient.invalidateQueries({ queryKey: ['chamados', 'lista'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCriarChamado() {
  const atualizar = useAtualizarDetalhe();
  return useMutation({ mutationFn: (dados: NovoChamado) => chamadosApi.criar(dados), onSuccess: atualizar });
}

export function useMudarStatus(id: number) {
  const atualizar = useAtualizarDetalhe();
  return useMutation({ mutationFn: (status: Status) => chamadosApi.mudarStatus(id, status), onSuccess: atualizar });
}

export function useAdicionarComentario(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (texto: string) => chamadosApi.comentar(id, texto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.detalhe(id) }),
  });
}

export type AcaoTriagem = 'aceitar' | 'rejeitar' | 'refazer';

export function useAcaoTriagem(id: number) {
  const atualizar = useAtualizarDetalhe();
  return useMutation({
    mutationFn: (acao: AcaoTriagem) =>
      acao === 'aceitar'
        ? chamadosApi.aceitarTriagem(id)
        : acao === 'rejeitar'
          ? chamadosApi.rejeitarTriagem(id)
          : chamadosApi.refazerTriagem(id),
    onSuccess: atualizar,
  });
}
