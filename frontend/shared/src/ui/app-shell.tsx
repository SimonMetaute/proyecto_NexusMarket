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
  const initials = (session?.user.username ?? session?.user.email ?? 'NX')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-[#D9DADC]/10 bg-sidebar lg:flex lg:h-screen lg:w-[264px] lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_30px_-14px_rgba(255,201,60,0.8)]">
            <ShoppingBag className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              NexusMarket
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {portal.name}
            </p>
          </div>
        </div>

        <div className="hidden px-5 pb-3 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            Operaciones
          </p>
        </div>

        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-1 lg:overflow-visible">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-smooth',
                  isActive
                    ? 'bg-primary/[0.12] text-foreground shadow-[inset_0_0_0_1px_rgba(255,201,60,0.18)]'
                    : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {isActive ? (
                    <span className="absolute inset-y-2 left-0 hidden w-0.5 rounded-full bg-primary lg:block" />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-[#D9DADC]/10 p-4 lg:block">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary tabular-nums">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {session?.user.username}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {session?.user.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#D9DADC]/10 bg-background/75 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {portal.description}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              Puerto {portal.port} · API http://localhost:3000/api/v1
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">
                {session?.user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.user.username}
              </p>
            </div>
            <Badge variant="secondary">{session?.user.role}</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
