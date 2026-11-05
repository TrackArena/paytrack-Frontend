import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, FileText,
  AlertCircle, CheckCircle, ArrowUpRight, ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardOverview, useDashboardRevenue, type Period } from '@/hooks/useDashboard';
import { formatAmount, formatAmountCompact, formatDateRelative, getPaymentStatusConfig, truncateHash } from '@/lib/utils';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Today',   value: 'today' },
  { label: '7 days',  value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
];

const STATUS_COLORS: Record<string, string> = {
  PAID:           '#10b981',
  PENDING:        '#f59e0b',
  PARTIALLY_PAID: '#8b5cf6',
  OVERDUE:        '#ef4444',
  DRAFT:          '#9ca3af',
  CANCELLED:      '#d1d5db',
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const { workspace } = useWorkspace();
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(period);
  const { data: revenueData, isLoading: revenueLoading } = useDashboardRevenue(period);

  const kpis = [
    {
      title: 'Total Revenue',
      value: overview ? formatAmountCompact(overview.revenue.total) : '—',
      sub: `${formatAmountCompact(overview?.revenue.inPeriod || '0')} this period`,
      icon: DollarSign,
      trend: 'up',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Payments Received',
      value: overview?.payments.completed ?? '—',
      sub: `${overview?.payments.pending ?? 0} pending`,
      icon: CheckCircle,
      trend: 'up',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Outstanding Invoices',
      value: overview ? formatAmountCompact(overview.invoices.outstanding) : '—',
      sub: `${overview?.invoices.overdue ?? 0} overdue`,
      icon: FileText,
      trend: overview?.invoices.overdue > 0 ? 'down' : 'neutral',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Failed Payments',
      value: overview?.payments.failed ?? '—',
      sub: `of ${overview?.payments.total ?? 0} total`,
      icon: AlertCircle,
      trend: overview?.payments.failed > 0 ? 'down' : 'neutral',
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
  ];

  const revenueChartData = revenueData?.data?.map((d: { date: string; total: string }) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: parseFloat(d.total),
  })) ?? [];

  const invoicePieData = overview
    ? Object.entries(overview.invoices)
        .filter(([k]) => k !== 'total' && k !== 'outstanding')
        .map(([status, count]) => ({
          name: status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
          value: count as number,
          color: STATUS_COLORS[status.toUpperCase()] || '#e5e7eb',
        }))
        .filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {workspace?.name ?? 'Dashboard'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Financial overview and reconciliation status
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1 text-xs rounded-md font-medium transition-colors',
                period === p.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="card-interactive">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                  {overviewLoading ? (
                    <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-semibold tabular-nums">{kpi.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </div>
                <div className={cn('size-9 rounded-lg flex items-center justify-center', kpi.bg)}>
                  <kpi.icon className={cn('size-4.5', kpi.color)} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {kpi.trend === 'up' && (
                  <TrendingUp className="size-3 text-emerald-500" />
                )}
                {kpi.trend === 'down' && (
                  <TrendingDown className="size-3 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Completed USDC payments over time
                </p>
              </div>
              <Link to="/reports">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  See detail <ArrowUpRight className="size-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {revenueLoading ? (
              <div className="h-48 bg-muted/40 animate-pulse rounded-lg" />
            ) : revenueChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No payment data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={192}>
                <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(8,93%,58%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(8,93%,58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(220,9%,46%)' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(220,9%,46%)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid hsl(220,13%,91%)',
                      borderRadius: '8px',
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
                    }}
                    formatter={(v: number) => [formatAmount(v), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(8,93%,58%)"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'hsl(8,93%,58%)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Invoice breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Invoice Status</CardTitle>
            <p className="text-xs text-muted-foreground">Breakdown by current status</p>
          </CardHeader>
          <CardContent className="pt-0">
            {overviewLoading ? (
              <div className="h-48 bg-muted/40 animate-pulse rounded-lg" />
            ) : invoicePieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No invoices yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={invoicePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={64}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {invoicePieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid hsl(220,13%,91%)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {invoicePieData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full" style={{ background: entry.color }} />
                        <span className="text-muted-foreground capitalize">{entry.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link to="/transactions">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowUpRight className="size-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {overviewLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/40 animate-pulse rounded" />
              ))}
            </div>
          ) : (overview?.recentTransactions ?? []).length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect a Stellar wallet to start receiving payments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">Transaction</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 text-xs font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(overview?.recentTransactions ?? []).map((tx: {
                    id: string;
                    transactionHash?: string;
                    customerName?: string;
                    invoiceNumber?: string;
                    amount: string;
                    currency: string;
                    status: string;
                    createdAt: string;
                  }) => {
                    const statusCfg = getPaymentStatusConfig(tx.status as never);
                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-muted-foreground font-mono">
                              {tx.transactionHash
                                ? truncateHash(tx.transactionHash, 6)
                                : `#${tx.id.slice(0, 8)}`}
                            </code>
                            {tx.transactionHash && (
                              <a
                                href={`https://stellar.expert/explorer/testnet/tx/${tx.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                                aria-label="View on Stellar Explorer"
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-sm">
                          {tx.customerName || <span className="text-muted-foreground">Unknown</span>}
                        </td>
                        <td className="py-2.5 pr-4">
                          {tx.invoiceNumber ? (
                            <Link
                              to={`/invoices`}
                              className="text-primary hover:underline text-xs font-mono"
                            >
                              {tx.invoiceNumber}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 font-mono font-medium tabular-nums text-sm">
                          {formatAmount(tx.amount, tx.currency)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge
                            className={cn('text-xs', statusCfg.className)}
                            variant="outline"
                          >
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateRelative(tx.createdAt)}
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
    </div>
  );
}
