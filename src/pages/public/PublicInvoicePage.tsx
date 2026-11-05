import { useParams } from 'react-router-dom';
import { ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePublicInvoice } from '@/hooks/useInvoices';
import { useToast } from '@/components/ui/toast-provider';
import { formatAmount, formatDate, getInvoiceStatusConfig } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const { data: invoice, isLoading, isError } = usePublicInvoice(token!);
  const { success } = useToast();

  const copyMemo = () => {
    if (invoice?.memo) {
      navigator.clipboard.writeText(invoice.memo);
      success('Memo copied', 'Paste this into your Stellar wallet transaction');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Invoice not found</p>
          <p className="text-sm text-muted-foreground mt-1">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const statusCfg = getInvoiceStatusConfig(invoice.status);
  const isPaid = invoice.status === 'PAID';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Business header */}
        <div className="text-center mb-8">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">
              {invoice.workspace?.name?.[0]?.toUpperCase() ?? 'P'}
            </span>
          </div>
          <h1 className="text-xl font-semibold">{invoice.workspace?.name}</h1>
          {invoice.workspace?.email && (
            <p className="text-sm text-muted-foreground">{invoice.workspace.email}</p>
          )}
        </div>

        {/* Invoice card */}
        <div className="bg-white rounded-2xl shadow-card border border-border p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Invoice</p>
              <p className="font-mono font-semibold text-lg">{invoice.invoiceNumber}</p>
              {invoice.dueDate && (
                <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(invoice.dueDate)}</p>
              )}
            </div>
            <Badge className={cn('text-xs', statusCfg.className)} variant="outline">
              {statusCfg.label}
            </Badge>
          </div>

          {/* Bill to */}
          {invoice.customer && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bill to</p>
              <p className="font-medium text-sm">{invoice.customer.name}</p>
            </div>
          )}

          {/* Line items */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left pb-2">Description</th>
                  <th className="text-right pb-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items?.map((item: {
                  description: string; quantity: string; amount: string;
                }, i: number) => (
                  <tr key={i}>
                    <td className="py-2 text-sm">
                      {item.description}
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between font-semibold text-base mt-4 pt-3 border-t border-border">
              <span>Total due</span>
              <span className="font-mono">
                {formatAmount(invoice.totalAmount, invoice.currency)}
              </span>
            </div>
          </div>

          {/* Payment instructions */}
          {!isPaid && (
            <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-3">
              <p className="font-medium text-sm">How to pay</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open your Stellar wallet</li>
                <li>
                  Send exactly{' '}
                  <strong className="text-foreground font-mono">
                    {formatAmount(invoice.totalAmount, invoice.currency)}
                  </strong>
                </li>
                <li>
                  Include the memo:{' '}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    {invoice.memo}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 ml-1"
                    onClick={copyMemo}
                  >
                    <Copy className="size-3" />
                  </Button>
                </li>
                <li>The invoice will update automatically once payment is confirmed</li>
              </ol>

              <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>Accepted asset:</strong> USDC on Stellar {invoice.currency === 'USDC' ? '(testnet)' : ''}.<br />
                Ensure you use the correct network and asset issuer.
              </div>
            </div>
          )}

          {isPaid && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
              <div className="text-2xl mb-1">✓</div>
              <p className="font-medium text-emerald-700">Payment received</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {invoice.paidAt ? `Paid on ${formatDate(invoice.paidAt)}` : 'This invoice has been settled'}
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{' '}
          <span className="font-semibold text-foreground">PayTrack</span>
          {' '}· Verified on Stellar blockchain
        </p>
      </div>
    </div>
  );
}
