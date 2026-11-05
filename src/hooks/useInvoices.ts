import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function useInvoices(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['invoices', workspace?.id, params],
    queryFn: async () => {
      const { data } = await api.get('/invoices', { params });
      return data;
    },
    enabled: !!workspace?.id,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function usePublicInvoice(token: string) {
  return useQuery({
    queryKey: ['invoices', 'public', token],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/public/${token}`);
      return data.data;
    },
    enabled: !!token,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await api.post('/invoices', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/invoices/${id}/send`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/invoices/${id}/cancel`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
