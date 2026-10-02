import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/endpoints';

export function useDashboard() {
  return useQuery({ queryKey: ['dashboard', 'resumo'], queryFn: dashboardApi.resumo, refetchInterval: 60_000 });
}
