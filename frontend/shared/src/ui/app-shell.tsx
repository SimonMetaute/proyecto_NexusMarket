import { LogOut, ShoppingBag, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import type { PortalDefinition } from '../portal';
import { useAuth } from '../auth/AuthProvider';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '../lib/cn';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export function AppShell({
  portal,
  nav,
}: {
  portal: PortalDefinition;
  nav: readonly NavItem[];
}) {
  const { session, logout } = useAuth();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-border bg-card lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">NexusMarket</p>
            <p className="truncate text-xs text-muted-foreground">{portal.name}</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{portal.description}</p>
            <p className="text-xs text-muted-foreground">
              Puerto {portal.port} · API http://localhost:3000/api/v1
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{session?.user.email}</p>
              <p className="text-xs text-muted-foreground">
                {session?.user.username}
              </p>
            </div>
            <Badge variant="secondary">{session?.user.role}</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
