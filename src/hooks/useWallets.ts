import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function useWallets() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ['wallets', workspace?.id],
    queryFn: async () => {
      const { data } = await api.get('/wallets', {
        params: { workspaceId: workspace!.id },
      });
      return data.data as Wallet[];
    },
    enabled: !!workspace?.id,
  });
}

export function useWalletTransactions(walletId: string, limit = 20) {
  return useQuery({
    queryKey: ['wallets', walletId, 'transactions'],
    queryFn: async () => {
      const { data } = await api.get(`/wallets/${walletId}/transactions`, {
        params: { limit },
      });
      return data.data;
    },
    enabled: !!walletId,
  });
}

export function useConnectWallet() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (payload: { publicKey: string; label?: string; network?: string }) => {
      const { data } = await api.post('/wallets/connect', {
        ...payload,
        workspaceId: workspace!.id,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallets'] }),
  });
}

export function useDisconnectWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wallets/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallets'] }),
  });
}

export interface Wallet {
  id: string;
  publicKey: string;
  label: string | null;
  network: string;
  isActive: boolean;
  isMonitored: boolean;
  createdAt: string;
}
