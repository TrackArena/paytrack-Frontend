import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function useCustomers(params?: { page?: number; limit?: number; search?: string }) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['customers', workspace?.id, params],
    queryFn: async () => {
      const { data } = await api.get('/customers', {
        params: { ...params, workspaceId: workspace!.id },
      });
      return data;
    },
    enabled: !!workspace?.id,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await api.post('/customers', {
        ...(payload as object),
        workspaceId: workspace!.id,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/customers/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
