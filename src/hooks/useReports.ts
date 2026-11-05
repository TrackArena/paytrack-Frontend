import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function useRevenueReport(from?: string, to?: string) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['reports', 'revenue', workspace?.id, from, to],
    queryFn: async () => {
      const { data } = await api.get('/reports/revenue', {
        params: { workspaceId: workspace!.id, from, to },
      });
      return data.data;
    },
    enabled: !!workspace?.id,
  });
}

export function useInvoiceReport(from?: string, to?: string) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['reports', 'invoices', workspace?.id, from, to],
    queryFn: async () => {
      const { data } = await api.get('/reports/invoices', {
        params: { workspaceId: workspace!.id, from, to },
      });
      return data.data;
    },
    enabled: !!workspace?.id,
  });
}

export function useTransactionReport(from?: string, to?: string) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['reports', 'transactions', workspace?.id, from, to],
    queryFn: async () => {
      const { data } = await api.get('/reports/transactions', {
        params: { workspaceId: workspace!.id, from, to },
      });
      return data.data;
    },
    enabled: !!workspace?.id,
  });
}
