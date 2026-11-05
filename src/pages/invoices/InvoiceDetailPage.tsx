import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvoice, useSendInvoice } from '@/hooks/useInvoices';
import { useToast } from '@/components/ui/toast-provider';
import { formatAmount, formatDate, getInvoiceStatusConfig, getPaymentStatusConfig, truncateHash, getStellarExplorerUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Decimal from 'decimal.js';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id!);
  const sendInvoice = useSendInvoice();
  const { success, error } = useToast();

  const handleSend = async () => {
    try {
      await sendInvoice.mutateAsync(id!);
      success('Invoice sent', 'Status updated to Pending');
    } catch {
      error('Failed to send invoice');
    }
  };

  const copyPaymentLink = () => {
    const link = `${window.location.origin}/invoice/${invoice.publicToken}`;
    navigator.clipboard.writeText(link);
    success('Link copied', 'Payment link copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-3xl">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Invoice not found</p>
        <Link to="/invoices"><Button variant="link">Back to invoices</Button></Link>
      </div>
    );
  }

  const statusCfg = getInvoiceStatusConfig(invoice.status);
  const remaining = new Decimal(invoice.totalAmount).minus(new Decimal(invoice.paidAmount));

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to="/invoices">
            <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold font-mono">{invoice.invoiceNumber}</h2>
              <Badge className={cn('text-xs', statusCfg.className)} variant="outline">
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(invoice.createdAt)}
              {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={copyPaymentLink}>
            <Copy className="size-3.5" /> Copy link
          </Button>
          {invoice.status === 'DRAFT' && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={handleSend} loading={sendInvoice.isPending}>
              <Send className="size-3.5" /> Send
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Invoice total', value: formatAmount(invoice.totalAmount, invoice.currency) },
          { label: 'Paid', value: formatAmount(invoice.paidAmount, invoice.currency) },
          { label: 'Remaining', value: formatAmount(remaining.toString(), invoice.currency) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-semibold font-mono tabular-nums mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice detail */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Bill to</CardTitle>
              {invoice.customer ? (
                <div className="mt-1 text-sm">
                  <p className="font-medium">{invoice.customer.name}</p>
                  {invoice.customer.email && (
                    <p className="text-muted-foreground">{invoice.customer.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No customer attached</p>
              )}
            </div>
            {invoice.memo && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Payment memo</p>
                <p className="font-mono text-sm font-medium">{invoice.memo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Include in Stellar transaction</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Line items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left pb-2 font-medium">Description</th>
                <th className="text-right pb-2 font-medium">Qty</th>
                <th className="text-right pb-2 font-medium">Unit price</th>
                <th className="text-right pb-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.items?.map((item: {
                id: string; description: string; quantity: string; unitPrice: string; amount: string;
              }) => (
                <tr key={item.id}>
                  <td className="py-2.5 text-sm">{item.description}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{item.unitPrice}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums font-medium">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-border space-y-1.5 ml-auto w-52">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono tabular-nums">{invoice.subtotal}</span>
            </div>
            {parseFloat(invoice.taxAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono tabular-nums">{invoice.taxAmount}</span>
              </div>
            )}
            {parseFloat(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-mono tabular-nums">-{invoice.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
              <span>Total</span>
              <span className="font-mono tabular-nums">
                {formatAmount(invoice.totalAmount, invoice.currency)}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment history */}
      {invoice.payments?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.payments.map((p: {
                id: string;
                amount: string;
                currency: string;
                status: string;
                createdAt: string;
                blockchainTransaction?: { transactionHash: string; network: string };
                reconciliation?: { status: string; matchConfidence: string };
              }) => {
                const pStatusCfg = getPaymentStatusConfig(p.status as never);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums font-medium text-sm">
                          {formatAmount(p.amount, p.currency)}
                        </span>
                        <Badge className={cn('text-xs', pStatusCfg.className)} variant="outline">
                          {pStatusCfg.label}
                        </Badge>
                        {p.reconciliation && (
                          <span className="text-xs text-muted-foreground">
                            {p.reconciliation.status} · {p.reconciliation.matchConfidence}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(p.createdAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {p.blockchainTransaction && (
                      <a
                        href={getStellarExplorerUrl(
                          p.blockchainTransaction.transactionHash,
                          p.blockchainTransaction.network as 'testnet' | 'mainnet'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <span className="font-mono">{truncateHash(p.blockchainTransaction.transactionHash, 6)}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
