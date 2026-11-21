import {
  LogIn,
  LogOut,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Badge } from './badge';
import { Button, buttonVariants } from './button';
import { cn } from '../lib/cn';

export function StorefrontShell() {
  const { session, logout } = useAuth();
  const isBuyer = session?.user.role === 'BUYER';
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  const onSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = term.trim();
    navigate(value.length > 0 ? `/?search=${encodeURIComponent(value)}` : '/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_28px_-14px_rgba(232,90,36,0.8)] transition-transform duration-300 ease-smooth group-hover:-rotate-6">
              <ShoppingBag className="h-[18px] w-[18px]" />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-base font-bold tracking-tight text-foreground">
                NexusMarket
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Marketplace
              </span>
            </span>
          </Link>

          <form
            onSubmit={onSearch}
            role="search"
            className="relative ml-1 hidden min-w-0 flex-1 md:block"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar productos, marcas y categorías…"
              aria-label="Buscar en el catálogo"
              className="h-11 w-full rounded-xl border border-border bg-[#f9f8f4] pl-11 pr-24 text-sm text-foreground placeholder:text-subtle/80 transition-all duration-200 focus:border-primary/50 focus:bg-[#fffdf8] focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Buscar
            </button>
          </form>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            <StoreLink to="/" label="Catálogo" end />
            {isBuyer ? (
              <>
                <StoreLink to="/orders" label="Mis órdenes" />
                <StoreLink to="/profile" label="Perfil" />
              </>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {session === null ? (
              <Link
                to="/login"
                className={buttonVariants({ size: 'sm', variant: 'outline' })}
              >
                <LogIn className="h-4 w-4" /> Ingresar
              </Link>
            ) : (
              <>
                <Badge variant="secondary" className="hidden xl:inline-flex">
                  {session.user.role}
                </Badge>
                <Link
                  to="/profile"
                  className={cn(
                    buttonVariants({ size: 'icon', variant: 'ghost' }),
                    'rounded-full border border-border bg-elevated',
                  )}
                  aria-label="Mi perfil"
                >
                  <User className="h-4 w-4" />
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Cerrar sesión"
                  className="hidden sm:inline-flex"
                  onClick={() => void logout()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
            <Link
              to="/cart"
              className={cn(
                buttonVariants({ size: 'sm', variant: 'outline' }),
                'group gap-2 border-border',
              )}
            >
              <ShoppingCart className="h-4 w-4 text-accent-foreground transition-transform duration-300 ease-smooth group-hover:-translate-y-0.5 group-hover:scale-110" />
              <span className="hidden sm:inline">Carrito</span>
            </Link>
          </div>
        </div>

        <div className="md:hidden">
          <form onSubmit={onSearch} role="search" className="px-4 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Buscar en NexusMarket…"
                aria-label="Buscar en el catálogo"
                className="h-10 w-full rounded-xl border border-border bg-[#f9f8f4] pl-10 pr-3 text-sm text-foreground placeholder:text-subtle/80 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </form>
        </div>

        {isBuyer ? (
          <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            <StoreLink to="/" label="Catálogo" end />
            <StoreLink to="/orders" label="Mis órdenes" />
            <StoreLink to="/profile" label="Perfil" />
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-[#171717] bg-deep">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-on-deep-muted sm:flex-row sm:items-center sm:justify-between">
          <span>NexusMarket · Buyer Storefront (puerto 5173)</span>
          <span className="font-mono tabular-nums">
            API http://localhost:3000/api/v1
          </span>
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
          'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive ? (
            <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />
          ) : null}
        </>
      )}
    </NavLink>
  );
}
