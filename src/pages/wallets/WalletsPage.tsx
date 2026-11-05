import { useState } from 'react';
import { ExternalLink, Plus, Wallet, Trash2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWallets, useConnectWallet, useDisconnectWallet, useWalletTransactions } from '@/hooks/useWallets';
import { useToast } from '@/components/ui/toast-provider';
import { getErrorMessage } from '@/lib/api';
import { formatDate, truncateAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STELLAR_KEY_REGEX = /^G[A-Z0-9]{55}$/;

export default function WalletsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [form, setForm] = useState({ publicKey: '', label: '', network: 'testnet' });
  const [keyError, setKeyError] = useState('');
  const { success, error } = useToast();

  const { data: wallets = [], isLoading } = useWallets();
  const connectWallet = useConnectWallet();
  const disconnectWallet = useDisconnectWallet();
  const { data: txHistory } = useWalletTransactions(selectedWalletId ?? '', 10);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    if (!STELLAR_KEY_REGEX.test(form.publicKey.trim())) {
      setKeyError('Invalid Stellar public key. Must start with G and be 56 characters.');
      return;
    }
    try {
      await connectWallet.mutateAsync(form);
      success('Wallet connected', 'Now monitoring for incoming payments');
      setShowForm(false);
      setForm({ publicKey: '', label: '', network: 'testnet' });
    } catch (err) {
      error('Failed to connect wallet', getErrorMessage(err));
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this wallet? Payment monitoring will stop.')) return;
    try {
      await disconnectWallet.mutateAsync(id);
      success('Wallet disconnected');
      if (selectedWalletId === id) setSelectedWalletId(null);
    } catch {
      error('Failed to disconnect wallet');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Wallets</h2>
          <p className="text-sm text-muted-foreground">
            Stellar public addresses monitored for incoming payments
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Connect wallet
        </Button>
      </div>

      {/* Security notice */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
        <strong>Security:</strong> PayTrack only stores your Stellar <em>public address</em>.
        Never enter your secret key here. Payments are verified independently via the Stellar Horizon API.
      </div>

      {/* Connect form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Connect a Stellar wallet</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="space-y-3 max-w-lg">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Public key (G-address) *</label>
                <Input
                  placeholder="GABC...XYZ (56 characters)"
                  className="font-mono text-xs"
                  value={form.publicKey}
                  onChange={(e) => { setForm({ ...form, publicKey: e.target.value.trim() }); setKeyError(''); }}
                  required
                />
                {keyError && <p className="text-xs text-destructive">{keyError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Label</label>
                  <Input
                    placeholder="Main receiving wallet"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Network</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.network}
                    onChange={(e) => setForm({ ...form, network: e.target.value })}
                  >
                    <option value="testnet">Testnet (development)</option>
                    <option value="mainnet">Mainnet (production)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={connectWallet.isPending}>
                  Connect wallet
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Wallet list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/40 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Wallet className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium">No wallets connected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Connect a Stellar public address to start receiving payments
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className={cn(
                'cursor-pointer transition-shadow',
                selectedWalletId === wallet.id && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedWalletId(wallet.id === selectedWalletId ? null : wallet.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{wallet.label || 'Unnamed wallet'}</p>
                      <Badge
                        variant={wallet.network === 'mainnet' ? 'default' : 'warning'}
                        className="text-xs"
                      >
                        {wallet.network}
                      </Badge>
                      {wallet.isActive && (
                        <Badge variant="success" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {truncateAddress(wallet.publicKey, 8)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <a
                        href={`https://stellar.expert/explorer/${wallet.network}/account/${wallet.publicKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        View on explorer <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {wallet.isMonitored && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Activity className="size-3" />
                        <span className="text-xs">Monitoring</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDisconnect(wallet.id); }}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      aria-label="Disconnect wallet"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Connected {formatDate(wallet.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wallet transaction history panel */}
      {selectedWalletId && txHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions on Stellar</CardTitle>
            <p className="text-xs text-muted-foreground">
              Latest {txHistory.length} transactions fetched directly from Horizon
            </p>
          </CardHeader>
          <CardContent>
            {txHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No transactions found on this account
              </p>
            ) : (
              <div className="space-y-2">
                {txHistory.map((tx: {
                  hash: string; createdAt: string;
                  successful: boolean; memo: string | null; explorerUrl: string;
                }) => (
                  <div key={tx.hash} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className={cn(
                      'size-1.5 rounded-full shrink-0',
                      tx.successful ? 'bg-emerald-500' : 'bg-red-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-muted-foreground">
                          {truncateAddress(tx.hash, 8)}
                        </code>
                        {tx.memo && (
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            memo: {tx.memo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.createdAt, 'MMM d, h:mm a')}</p>
                    </div>
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="View on Stellar Explorer"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
