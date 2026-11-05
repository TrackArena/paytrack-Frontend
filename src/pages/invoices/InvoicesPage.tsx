import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInvoices, useSendInvoice, useCancelInvoice } from '@/hooks/useInvoices';
import { formatAmount, formatDate, getInvoiceStatusConfig, type InvoiceStatus } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Partial', value: 'PARTIALLY_PAID' },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { success, error } = useToast();

  const { data, isLoading } = useInvoices({
    page,
    limit: 20,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const sendInvoice = useSendInvoice();
  const cancelInvoice = useCancelInvoice();

  const invoices = data?.data ?? [];
  const meta = data?.meta;

  const handleSend = async (id: string) => {
    try {
      await sendInvoice.mutateAsync(id);
      success('Invoice sent', 'Status updated to Pending');
    } catch {
      error('Failed to send invoice');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this invoice? This cannot be undone.')) return;
    try {
      await cancelInvoice.mutateAsync(id);
      success('Invoice cancelled');
    } catch {
      error('Failed to cancel invoice');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">
            {meta?.total ?? 0} invoice{meta?.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/invoices/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            New invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search invoices…"
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                    statusFilter === f.value
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0 pb-0">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/40 animate-pulse rounded" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center">
              <FileTextIcon className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium">No invoices found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || statusFilter ? 'Try adjusting your filters' : 'Create your first invoice to get started'}
              </p>
              {!search && !statusFilter && (
                <Link to="/invoices/new">
                  <Button size="sm" className="mt-3 gap-1.5">
                    <Plus className="size-3.5" /> Create invoice
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Invoice', 'Customer', 'Amount', 'Status', 'Due date', 'Actions'].map((h) => (
                      <th key={h} className="text-left py-3 pr-4 text-xs font-medium text-muted-foreground first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv: {
                    id: string;
                    invoiceNumber: string;
                    customer?: { name: string };
                    totalAmount: string;
                    paidAmount: string;
                    currency: string;
                    status: InvoiceStatus;
                    dueDate?: string;
                  }) => {
                    const statusCfg = getInvoiceStatusConfig(inv.status);
                    return (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="py-3 pr-4">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="font-mono text-xs text-primary hover:underline font-medium"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-sm">
                          {inv.customer?.name || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 pr-4 font-mono tabular-nums font-medium">
                          {formatAmount(inv.totalAmount, inv.currency)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={cn('text-xs', statusCfg.className)} variant="outline">
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/invoices/${inv.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2">View</Button>
                            </Link>
                            {inv.status === 'DRAFT' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => handleSend(inv.id)}
                              >
                                Send
                              </Button>
                            )}
                            {['DRAFT', 'PENDING', 'OVERDUE'].includes(inv.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                                onClick={() => handleCancel(inv.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
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
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
