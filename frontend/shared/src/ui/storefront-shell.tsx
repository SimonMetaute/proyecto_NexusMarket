import { LogIn, LogOut, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Badge } from './badge';
import { Button, buttonVariants } from './button';
import { cn } from '../lib/cn';

export function StorefrontShell() {
  const { session, logout } = useAuth();
  const isBuyer = session?.user.role === 'BUYER';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold">NexusMarket</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            <StoreLink to="/" label="Catálogo" end />
            {isBuyer ? (
              <>
                <StoreLink to="/orders" label="Mis órdenes" />
                <StoreLink to="/profile" label="Perfil" />
              </>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {session === null ? (
              <Link
                to="/login"
                className={buttonVariants({ size: 'sm', variant: 'outline' })}
              >
                <LogIn className="h-4 w-4" /> Ingresar
              </Link>
            ) : (
              <>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {session.user.role}
                </Badge>
                <Link
                  to="/profile"
                  className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-32 truncate">
                    {session.user.username}
                  </span>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Cerrar sesión"
                  onClick={() => void logout()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
            <Link
              to="/cart"
              className={buttonVariants({ size: 'sm', variant: 'outline' })}
            >
              <ShoppingCart className="h-4 w-4" /> Carrito
            </Link>
          </div>
        </div>

        {isBuyer ? (
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
            <StoreLink to="/" label="Catálogo" end />
            <StoreLink to="/orders" label="Mis órdenes" />
            <StoreLink to="/profile" label="Perfil" />
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          NexusMarket · Buyer Storefront (puerto 5173) · API
          http://localhost:3000/api/v1
        </div>
      </footer>
    </div>
  );
}

function StoreLink({
  to,
  label,
  end,
}: {
  to: string;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {label}
    </NavLink>
  );
}
