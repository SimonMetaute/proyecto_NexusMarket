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
      <aside className="border-b border-[#171717]/60 bg-sidebar lg:flex lg:h-screen lg:w-[264px] lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_28px_-14px_rgba(232,90,36,0.8)]">
            <ShoppingBag className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-on-deep">
              NexusMarket
            </p>
            <p className="truncate text-xs text-on-deep-muted">
              {portal.name}
            </p>
          </div>
        </div>

        <div className="hidden px-5 pb-3 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-deep-muted/70">
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
                    ? 'bg-primary/[0.14] text-on-deep shadow-[inset_0_0_0_1px_rgba(232,90,36,0.22)]'
                    : 'text-on-deep-muted hover:bg-[#f7f6f2]/[0.06] hover:text-on-deep',
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
                        : 'text-on-deep-muted group-hover:text-on-deep',
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

        <div className="mt-auto hidden border-t border-[#f7f6f2]/10 p-4 lg:block">
          <div className="flex items-center gap-3 rounded-xl bg-[#f7f6f2]/[0.04] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary tabular-nums">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-on-deep">
                {session?.user.username}
              </p>
              <p className="truncate text-[11px] text-on-deep-muted">
                {session?.user.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              className="text-on-deep-muted hover:bg-[#f7f6f2]/10 hover:text-on-deep"
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {portal.description}
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
