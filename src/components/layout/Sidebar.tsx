import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, ArrowLeftRight,
  Wallet, BarChart3, Settings, Link2, LogOut, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/components/ui/toast-provider';

const navigation = [
  { name: 'Overview',      href: '/dashboard',     icon: LayoutDashboard },
  { name: 'Transactions',  href: '/transactions',   icon: ArrowLeftRight },
  { name: 'Invoices',      href: '/invoices',       icon: FileText },
  { name: 'Customers',     href: '/customers',      icon: Users },
  { name: 'Payment Links', href: '/payment-links',  icon: Link2 },
  { name: 'Wallets',       href: '/wallets',        icon: Wallet },
  { name: 'Reports',       href: '/reports',        icon: BarChart3 },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { workspace } = useWorkspace();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    success('Logged out', 'See you next time');
    navigate('/login');
  };

  return (
    <aside className="flex flex-col w-[220px] shrink-0 border-r border-border bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-[60px] border-b border-border shrink-0">
        <div className="size-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">P</span>
        </div>
        <span className="font-semibold text-sm tracking-tight">PayTrack</span>
      </div>

      {/* Workspace selector */}
      {workspace && (
        <div className="px-3 py-3 border-b border-border">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left">
            <div className="size-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-semibold">
                {workspace.name[0].toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-medium truncate flex-1">{workspace.name}</span>
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: settings + user */}
      <div className="px-3 pb-4 space-y-0.5 shrink-0">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-primary text-white font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )
          }
        >
          <Settings className="size-4 shrink-0" />
          <span>Settings</span>
        </NavLink>

        <div className="pt-2 border-t border-border mt-2">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-semibold">
                {user?.firstName?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
