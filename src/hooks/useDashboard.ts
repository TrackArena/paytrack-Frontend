import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export type Period = 'today' | '7d' | '30d' | '90d' | 'all';

export function useDashboardOverview(period: Period = '30d') {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['dashboard', 'overview', workspace?.id, period],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/${workspace!.id}/overview`, {
        params: { period },
      });
      return data.data;
    },
    enabled: !!workspace?.id,
    refetchInterval: 60_000, // auto-refresh every minute
  });
}

export function useDashboardRevenue(period: Period = '30d') {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['dashboard', 'revenue', workspace?.id, period],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/${workspace!.id}/revenue`, {
        params: { period },
      });
      return data.data;
    },
    enabled: !!workspace?.id,
  });
}

export function useDashboardActivity() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['dashboard', 'activity', workspace?.id],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/${workspace!.id}/activity`);
      return data.data;
    },
    enabled: !!workspace?.id,
  });
}
