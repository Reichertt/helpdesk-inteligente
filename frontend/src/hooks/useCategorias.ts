import { useQuery } from '@tanstack/react-query';
import { categoriasApi } from '../api/endpoints';

export function useCategorias() {
  return useQuery({ queryKey: ['categorias'], queryFn: categoriasApi.listar, staleTime: 10 * 60 * 1000 });
}
