import { api } from './client';
import type {
  Categoria,
  ChamadoDetalhe,
  ChamadoResumo,
  Comentario,
  FiltrosChamados,
  NovoChamado,
  Pagina,
  ResumoDashboard,
  Sessao,
  Status,
} from './types';

export const authApi = {
  login: (email: string, senha: string) => api<Sessao>('/api/auth/login', { method: 'POST', body: { email, senha } }),
};

export const chamadosApi = {
  listar: (filtros: FiltrosChamados) => api<Pagina<ChamadoResumo>>('/api/chamados', { query: { ...filtros } }),
  detalhe: (id: number) => api<ChamadoDetalhe>(`/api/chamados/${id}`),
  criar: (dados: NovoChamado) => api<ChamadoDetalhe>('/api/chamados', { method: 'POST', body: dados }),
  mudarStatus: (id: number, status: Status) =>
    api<ChamadoDetalhe>(`/api/chamados/${id}/status`, { method: 'PATCH', body: { status } }),
  comentar: (id: number, texto: string) =>
    api<Comentario>(`/api/chamados/${id}/comentarios`, { method: 'POST', body: { texto } }),
  refazerTriagem: (id: number) => api<ChamadoDetalhe>(`/api/chamados/${id}/triagem`, { method: 'POST' }),
  aceitarTriagem: (id: number) => api<ChamadoDetalhe>(`/api/chamados/${id}/triagem/aceitar`, { method: 'POST' }),
  rejeitarTriagem: (id: number) => api<ChamadoDetalhe>(`/api/chamados/${id}/triagem/rejeitar`, { method: 'POST' }),
};

export const categoriasApi = {
  listar: () => api<Categoria[]>('/api/categorias'),
};

export const dashboardApi = {
  resumo: () => api<ResumoDashboard>('/api/dashboard/resumo'),
};
