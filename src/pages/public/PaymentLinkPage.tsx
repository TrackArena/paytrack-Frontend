import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatAmount, formatDate } from '@/lib/utils';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';

export default function PaymentLinkPage() {
  const { token } = useParams<{ token: string }>();
  const { success } = useToast();

  const { data: link, isLoading, isError } = useQuery({
    queryKey: ['payment-link', token],
    queryFn: async () => {
      const { data } = await api.get(`/payment-links/${token}`);
      return data.data;
    },
    enabled: !!token,
  });

  const copyMemo = () => {
    const memo = link?.invoice?.memo;
    if (memo) {
      navigator.clipboard.writeText(memo);
      success('Memo copied');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !link) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Payment link not found</p>
          <p className="text-sm text-muted-foreground mt-1">This link may have expired or been deactivated.</p>
        </div>
      </div>
    );
  }

  const amount = link.amount || link.invoice?.totalAmount;
  const currency = link.currency || link.invoice?.currency || 'USDC';
  const isPaid = link.invoice?.status === 'PAID';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">
              {link.workspace?.name?.[0]?.toUpperCase() ?? 'P'}
            </span>
          </div>
          <h1 className="text-xl font-semibold">{link.workspace?.name}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-6 space-y-5">
          {link.title && <h2 className="font-semibold text-lg">{link.title}</h2>}
          {link.description && <p className="text-sm text-muted-foreground">{link.description}</p>}

          {link.invoice && (
            <div className="p-3 rounded-lg bg-muted/40 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-mono">{link.invoice.invoiceNumber}</span>
              </div>
              {link.invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due date</span>
                  <span>{formatDate(link.invoice.dueDate)}</span>
                </div>
              )}
            </div>
          )}

          <div className="text-center py-4 border-y border-border">
            <p className="text-xs text-muted-foreground mb-1">Amount due</p>
            <p className="text-3xl font-bold font-mono tabular-nums">
              {amount ? formatAmount(amount, currency) : '—'}
            </p>
          </div>

          {!isPaid && link.invoice?.memo && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Transaction memo (required)</p>
              <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg border border-border">
                <code className="flex-1 font-mono text-sm">{link.invoice.memo}</code>
                <Button variant="ghost" size="sm" className="h-7" onClick={copyMemo}>
                  <Copy className="size-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Include this memo when sending your Stellar payment to ensure automatic matching.
              </p>
            </div>
          )}

          {isPaid ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
              <p className="font-medium text-emerald-700 text-lg">✓ Paid</p>
              <p className="text-xs text-emerald-600 mt-0.5">This payment has been settled</p>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center">
              Send USDC on Stellar to the business wallet · Payment verified on-chain
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
