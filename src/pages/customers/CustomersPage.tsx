import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/components/ui/toast-provider';
import { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useCustomers({ search: search || undefined });
  const createCustomer = useCreateCustomer();
  const { success, error } = useToast();

  const customers = data?.data ?? [];
  const meta = data?.meta;

  const [form, setForm] = useState({ name: '', email: '', company: '', country: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await createCustomer.mutateAsync(form);
      success('Customer created');
      setShowForm(false);
      setForm({ name: '', email: '', company: '', country: '' });
    } catch (err) {
      error('Failed to create customer', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Customers</h2>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} customers</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Add customer
        </Button>
      </div>

      {/* Quick-add form */}
      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Name *</label>
                <Input
                  placeholder="Customer name"
                  className="h-8 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="billing@company.com"
                  className="h-8 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Company</label>
                <Input
                  placeholder="Company name"
                  className="h-8 text-sm"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Country</label>
                <Input
                  placeholder="US"
                  className="h-8 text-sm"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={createCustomer.isPending}>
                  Save customer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search customers…"
              className="pl-8 h-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0 pb-0">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/40 animate-pulse rounded" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? 'No customers match your search' : 'No customers yet'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Email', 'Company', 'Country', 'Invoices', 'Joined', ''].map((h) => (
                    <th key={h} className="text-left py-3 pr-4 text-xs font-medium text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c: {
                  id: string;
                  name: string;
                  email?: string;
                  company?: string;
                  country?: string;
                  createdAt: string;
                  _count?: { invoices: number };
                }) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="py-3 pr-4 font-medium">{c.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">{c.email || '—'}</td>
                    <td className="py-3 pr-4 text-xs">{c.company || '—'}</td>
                    <td className="py-3 pr-4 text-xs">{c.country || '—'}</td>
                    <td className="py-3 pr-4 text-xs tabular-nums">{c._count?.invoices ?? 0}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{formatDate(c.createdAt)}</td>
                    <td className="py-3">
                      <Link to={`/customers/${c.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
