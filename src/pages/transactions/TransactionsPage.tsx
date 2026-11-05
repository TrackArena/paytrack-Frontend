import { useState } from 'react';
import { ExternalLink, Search, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePayments, useVerifyPayment } from '@/hooks/usePayments';
import { useToast } from '@/components/ui/toast-provider';
import { getErrorMessage } from '@/lib/api';
import {
  formatAmount, formatDateRelative, getPaymentStatusConfig,
  truncateHash, getStellarExplorerUrl,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
];

export default function TransactionsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [verifyHash, setVerifyHash] = useState('');
  const { success, error } = useToast();

  const { data, isLoading } = usePayments({ page, limit: 20, status: statusFilter || undefined });
  const verifyPayment = useVerifyPayment();

  const payments = data?.data ?? [];
  const meta = data?.meta;

  const handleVerify = async () => {
    const hash = verifyHash.trim();
    if (!hash) return;
    try {
      const result = await verifyPayment.mutateAsync({ transactionHash: hash });
      if (result.idempotent) {
        success('Already processed', 'This transaction was already reconciled');
      } else {
        success('Payment verified', `Reconciliation: ${result.reconciliation.status}`);
      }
      setVerifyHash('');
    } catch (err) {
      error('Verification failed', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold">Transactions</h2>
        <p className="text-sm text-muted-foreground">
          All incoming Stellar payments and reconciliation results
        </p>
      </div>

      {/* Manual verification panel */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <CardTitle>Verify a transaction</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a Stellar transaction hash to independently verify and reconcile it against an invoice.
            The backend fetches and validates it directly from Horizon — no client data is trusted.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Input
              placeholder="Paste Stellar transaction hash (64 hex chars)…"
              className="font-mono text-xs"
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            <Button
              onClick={handleVerify}
              loading={verifyPayment.isPending}
              disabled={!verifyHash.trim()}
              size="sm"
            >
              Verify
            </Button>
          </div>
          {verifyPayment.isError && (
            <p className="text-xs text-destructive mt-2">
              {getErrorMessage(verifyPayment.error)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={cn(
              'px-3 py-1 text-xs rounded-full font-medium transition-colors border',
              statusFilter === f.value
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-0 pb-0">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-11 bg-muted/40 animate-pulse rounded" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect a Stellar wallet to start detecting incoming payments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Tx Hash', 'Customer', 'Invoice', 'Amount', 'Status', 'Match', 'Time', ''].map((h) => (
                      <th key={h} className="text-left py-3 pr-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p: {
                    id: string;
                    amount: string;
                    currency: string;
                    status: string;
                    createdAt: string;
                    invoice?: { invoiceNumber: string };
                    customer?: { name: string };
                    blockchainTransaction?: { transactionHash: string; network: string; status: string };
                    reconciliation?: { status: string; matchConfidence: string };
                  }) => {
                    const statusCfg = getPaymentStatusConfig(p.status as never);
                    const network = (p.blockchainTransaction?.network as 'testnet' | 'mainnet') ?? 'testnet';
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 pr-3">
                          {p.blockchainTransaction?.transactionHash ? (
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs font-mono text-muted-foreground">
                                {truncateHash(p.blockchainTransaction.transactionHash, 6)}
                              </code>
                              <a
                                href={getStellarExplorerUrl(p.blockchainTransaction.transactionHash, network)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                aria-label="View on Stellar Explorer"
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">
                              {truncateHash(p.id, 6)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-sm">
                          {p.customer?.name || <span className="text-muted-foreground text-xs">Unknown</span>}
                        </td>
                        <td className="py-3 pr-3">
                          {p.invoice?.invoiceNumber ? (
                            <span className="font-mono text-xs text-primary">{p.invoice.invoiceNumber}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Unmatched</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 font-mono tabular-nums font-medium text-sm whitespace-nowrap">
                          {formatAmount(p.amount, p.currency)}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge className={cn('text-xs', statusCfg.className)} variant="outline">
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-3">
                          {p.reconciliation ? (
                            <div className="flex items-center gap-1">
                              <span className={cn('text-xs font-medium',
                                p.reconciliation.status === 'MATCHED' ? 'text-emerald-600' :
                                p.reconciliation.status === 'OVERPAYMENT' ? 'text-amber-600' :
                                p.reconciliation.status === 'PARTIAL_MATCH' ? 'text-violet-600' :
                                'text-muted-foreground'
                              )}>
                                {p.reconciliation.status.replace('_', ' ')}
                              </span>
                              {p.reconciliation.matchConfidence && (
                                <span className="text-xs text-muted-foreground">
                                  {parseFloat(p.reconciliation.matchConfidence).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateRelative(p.createdAt)}
                        </td>
                        <td className="py-3">
                          {p.blockchainTransaction?.network && (
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded font-medium',
                              network === 'testnet' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            )}>
                              {network}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, meta.total)} of {meta.total}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
