import { Search, Bell, HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const pageNames: Record<string, string> = {
  '/dashboard':    'Overview',
  '/transactions': 'Transactions',
  '/invoices':     'Invoices',
  '/customers':    'Customers',
  '/wallets':      'Wallets',
  '/reports':      'Reports',
  '/settings':     'Settings',
};

export function TopNav() {
  const location = useLocation();
  const pageName = pageNames[location.pathname] || 'PayTrack';

  return (
    <header className="h-[60px] border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 flex items-center px-6 gap-4 shrink-0">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground mr-auto">{pageName}</h1>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Search…"
          className={cn(
            'h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:w-64 transition-all'
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
        </button>
        <button
          className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="size-4" />
        </button>
      </div>
    </header>
  );
}
