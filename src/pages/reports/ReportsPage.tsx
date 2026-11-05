import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRevenueReport, useInvoiceReport } from '@/hooks/useReports';
import { formatAmount, formatAmountCompact } from '@/lib/utils';

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fromISO = from ? new Date(from).toISOString() : undefined;
  const toISO = to ? new Date(to).toISOString() : undefined;

  const { data: revenue, isLoading: revLoading } = useRevenueReport(fromISO, toISO);
  const { data: invoices, isLoading: invLoading } = useInvoiceReport(fromISO, toISO);

  const revenueChartData = revenue?.byMonth?.map((m: { month: string; total: string; count: number }) => ({
    month: m.month,
    revenue: parseFloat(m.total),
    transactions: m.count,
  })) ?? [];

  const invoiceChartData = invoices?.byStatus?.map((s: { status: string; count: number; totalAmount: string }) => ({
    status: s.status.charAt(0) + s.status.slice(1).toLowerCase().replace('_', ' '),
    count: s.count,
    amount: parseFloat(s.totalAmount),
  })) ?? [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reports</h2>
          <p className="text-sm text-muted-foreground">Financial analytics from actual database records</p>
        </div>
        {/* Date range filter */}
        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" className="h-8 text-xs w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" className="h-8 text-xs w-36" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {(from || to) && (
            <Button variant="ghost" size="sm" className="mt-5" onClick={() => { setFrom(''); setTo(''); }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total revenue', value: revenue ? formatAmountCompact(revenue.summary.total) : '—' },
          { label: 'Transactions', value: revenue?.summary.count ?? '—' },
          { label: 'Avg transaction', value: revenue ? formatAmount(revenue.summary.average) : '—' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              {revLoading ? (
                <div className="h-7 w-24 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums mt-1">{s.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by month chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by month</CardTitle>
          <p className="text-xs text-muted-foreground">Completed USDC payments aggregated monthly</p>
        </CardHeader>
        <CardContent>
          {revLoading ? (
            <div className="h-56 bg-muted/40 animate-pulse rounded-lg" />
          ) : revenueChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              No revenue data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={revenueChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(220,9%,46%)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(220,9%,46%)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white', border: '1px solid hsl(220,13%,91%)',
                    borderRadius: '8px', fontSize: 12,
                  }}
                  formatter={(v: number) => [formatAmount(v), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(8,93%,58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Invoice summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Invoice summary</CardTitle>
          </CardHeader>
          <CardContent>
            {invLoading ? (
              <div className="h-32 bg-muted/40 animate-pulse rounded-lg" />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Invoiced', value: invoices ? formatAmountCompact(invoices.summary.totalInvoiced) : '—' },
                    { label: 'Collected', value: invoices ? formatAmountCompact(invoices.summary.totalPaid) : '—' },
                    { label: 'Outstanding', value: invoices ? formatAmountCompact(invoices.summary.outstanding) : '—' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-base font-semibold tabular-nums mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices by status</CardTitle>
          </CardHeader>
          <CardContent>
            {invLoading ? (
              <div className="h-32 bg-muted/40 animate-pulse rounded-lg" />
            ) : invoiceChartData.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                No invoice data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={128}>
                <BarChart data={invoiceChartData} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fontSize: 11, fill: 'hsl(220,9%,46%)' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid hsl(220,13%,91%)', borderRadius: '8px', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="hsl(220,9%,64%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
