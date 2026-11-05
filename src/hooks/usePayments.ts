import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function usePayments(params?: { page?: number; limit?: number; status?: string }) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['payments', workspace?.id, params],
    queryFn: async () => {
      const { data } = await api.get('/payments', {
        params: { ...params, workspaceId: workspace!.id },
      });
      return data;
    },
    enabled: !!workspace?.id,
    refetchInterval: 30_000,
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: async () => {
      const { data } = await api.get(`/payments/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (payload: { transactionHash: string; invoiceId?: string }) => {
      const { data } = await api.post('/payments/verify', {
        ...payload,
        workspaceId: workspace!.id,
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
