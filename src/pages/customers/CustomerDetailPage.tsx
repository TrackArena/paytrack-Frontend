import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomer } from '@/hooks/useCustomers';
import { formatAmount, formatDate, getInvoiceStatusConfig, type InvoiceStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(id!);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-3xl">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Customer not found</p>
        <Link to="/customers"><Button variant="link">Back to customers</Button></Link>
      </div>
    );
  }

  const totalInvoiced = customer.invoices?.reduce(
    (sum: number, inv: { totalAmount: string }) => sum + parseFloat(inv.totalAmount || '0'), 0
  ) ?? 0;

  const totalPaid = customer.invoices?.reduce(
    (sum: number, inv: { paidAmount: string }) => sum + parseFloat(inv.paidAmount || '0'), 0
  ) ?? 0;

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/customers">
          <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
        </Link>
        <div>
          <h2 className="text-lg font-semibold">{customer.name}</h2>
          {customer.company && (
            <p className="text-sm text-muted-foreground">{customer.company}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total invoiced', value: formatAmount(totalInvoiced) },
          { label: 'Total paid', value: formatAmount(totalPaid) },
          { label: 'Outstanding', value: formatAmount(totalInvoiced - totalPaid) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-semibold font-mono tabular-nums mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: 'Email', value: customer.email },
              { label: 'Phone', value: customer.phone },
              { label: 'Country', value: customer.country },
              { label: 'City', value: customer.city },
              { label: 'Stellar address', value: customer.stellarAddress },
              { label: 'Customer since', value: formatDate(customer.createdAt) },
            ].map(({ label, value }) => (
              value ? (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-medium mt-0.5 break-all">{value}</dd>
                </div>
              ) : null
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Invoice history */}
      {customer.invoices?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Invoice history</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Invoice</th>
                  <th className="text-left pb-2 font-medium">Amount</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customer.invoices.map((inv: {
                  id: string; invoiceNumber: string;
                  totalAmount: string; currency: string;
                  status: InvoiceStatus; createdAt: string;
                }) => {
                  const cfg = getInvoiceStatusConfig(inv.status);
                  return (
                    <tr key={inv.id} className="hover:bg-muted/20">
                      <td className="py-2.5">
                        <Link to={`/invoices/${inv.id}`} className="font-mono text-xs text-primary hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 font-mono tabular-nums text-sm">
                        {formatAmount(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-2.5">
                        <Badge className={cn('text-xs', cfg.className)} variant="outline">{cfg.label}</Badge>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{formatDate(inv.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
