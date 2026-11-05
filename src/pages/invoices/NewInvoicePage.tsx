import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/components/ui/toast-provider';
import { getErrorMessage } from '@/lib/api';
import Decimal from 'decimal.js';

const itemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.coerce.number().positive('Must be positive'),
  unitPrice: z.coerce.number().min(0, 'Must be 0 or more'),
});

const schema = z.object({
  customerId: z.string().optional(),
  currency: z.string().default('USDC'),
  dueDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(itemSchema).min(1, 'At least one item required'),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

export default function NewInvoicePage() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const { success, error } = useToast();
  const createInvoice = useCreateInvoice();
  const { data: customersData } = useCustomers({ limit: 100 });
  const customers = customersData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'USDC',
      taxRate: 0,
      discountAmount: 0,
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const watchTax = watch('taxRate') || 0;
  const watchDiscount = watch('discountAmount') || 0;

  // Live totals using Decimal for precision
  const subtotal = (watchItems || []).reduce((sum, item) => {
    const q = new Decimal(item.quantity || 0);
    const p = new Decimal(item.unitPrice || 0);
    return sum.plus(q.times(p));
  }, new Decimal(0));

  const taxAmount = subtotal.times(new Decimal(watchTax).dividedBy(100));
  const total = subtotal.plus(taxAmount).minus(new Decimal(watchDiscount));

  const onSubmit = async (data: FormData) => {
    try {
      const invoice = await createInvoice.mutateAsync({
        ...data,
        workspaceId: workspace!.id,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      });
      success('Invoice created', `${invoice.invoiceNumber} saved as draft`);
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      error('Failed to create invoice', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">New invoice</h2>
          <p className="text-sm text-muted-foreground">Create a new USDC invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer + meta */}
        <Card>
          <CardHeader><CardTitle>Invoice details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Customer</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register('customerId')}
              >
                <option value="">No customer</option>
                {customers.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register('currency')}
              >
                <option value="USDC">USDC (Stellar)</option>
                <option value="XLM">XLM (Stellar)</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Due date</label>
              <Input type="date" {...register('dueDate')} />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Payment instructions, bank details, terms…"
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              >
                <Plus className="size-3.5" /> Add item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-1 border-b border-border">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit price</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1" />
              </div>

              {fields.map((field, index) => {
                const qty = new Decimal(watchItems?.[index]?.quantity || 0);
                const price = new Decimal(watchItems?.[index]?.unitPrice || 0);
                const lineAmount = qty.times(price);
                return (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-6">
                      <Input
                        placeholder="Service or product description"
                        className="h-8 text-sm"
                        {...register(`items.${index}.description`)}
                        error={errors.items?.[index]?.description?.message}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="1"
                        className="h-8 text-sm text-right"
                        {...register(`items.${index}.quantity`)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="h-8 text-sm text-right"
                        {...register(`items.${index}.unitPrice`)}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-end h-8">
                      <span className="text-sm font-mono tabular-nums text-right">
                        {lineAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end h-8">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove line item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {errors.items?.root && (
                <p className="text-xs text-destructive">{errors.items.root.message}</p>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-border space-y-2 ml-auto w-64">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono tabular-nums">{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-1">Tax (%)</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="h-7 w-20 text-right text-sm"
                  {...register('taxRate')}
                />
                <span className="text-sm font-mono tabular-nums w-20 text-right">
                  {taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-1">Discount</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-7 w-20 text-right text-sm"
                  {...register('discountAmount')}
                />
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  {total.toFixed(2)} {watch('currency')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save as draft
          </Button>
        </div>
      </form>
    </div>
  );
}
