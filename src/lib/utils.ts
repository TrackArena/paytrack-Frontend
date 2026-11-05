import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Financial formatting ──────────────────────────────────────

export function formatAmount(
  amount: string | number,
  currency = 'USDC',
  decimals = 2
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  if (currency === 'USDC' || currency === 'XLM') {
    return `${num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })} ${currency}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatAmountCompact(amount: string | number, currency = 'USDC'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M ${currency}`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K ${currency}`;
  }
  return formatAmount(amount, currency);
}

// ── Date formatting ───────────────────────────────────────────

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—';
  try {
    return format(new Date(date), fmt);
  } catch {
    return '—';
  }
}

export function formatDateRelative(date: string | Date): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

// ── Truncation ────────────────────────────────────────────────

export function truncateHash(hash: string, chars = 8): string {
  if (!hash || hash.length <= chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address || address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ── Status helpers ────────────────────────────────────────────

export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'DUPLICATE';

export function getInvoiceStatusConfig(status: InvoiceStatus) {
  const configs = {
    DRAFT:          { label: 'Draft',         className: 'bg-gray-100 text-gray-600' },
    PENDING:        { label: 'Pending',        className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    PARTIALLY_PAID: { label: 'Partial',        className: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
    PAID:           { label: 'Paid',           className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
    OVERDUE:        { label: 'Overdue',        className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
    CANCELLED:      { label: 'Cancelled',      className: 'bg-gray-100 text-gray-500' },
  };
  return configs[status] || configs.DRAFT;
}

export function getPaymentStatusConfig(status: PaymentStatus) {
  const configs = {
    PENDING:   { label: 'Pending',   className: 'bg-amber-50 text-amber-700' },
    COMPLETED: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' },
    FAILED:    { label: 'Failed',    className: 'bg-red-50 text-red-700' },
    REFUNDED:  { label: 'Refunded',  className: 'bg-blue-50 text-blue-700' },
    DUPLICATE: { label: 'Duplicate', className: 'bg-gray-100 text-gray-600' },
  };
  return configs[status] || configs.PENDING;
}

// ── Stellar helpers ───────────────────────────────────────────

export function getStellarExplorerUrl(hash: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
  const base =
    network === 'mainnet'
      ? (import.meta.env.VITE_STELLAR_EXPLORER_MAINNET || 'https://stellar.expert/explorer/public')
      : (import.meta.env.VITE_STELLAR_EXPLORER_TESTNET || 'https://stellar.expert/explorer/testnet');
  return `${base}/tx/${hash}`;
}
