import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  ErrorState,
  PORTAL_BY_ROLE,
  PageSkeleton,
  Skeleton,
  formatDate,
  formatMoney,
  getProduct,
  portalUrl,
  statusVariant,
  toApiError,
  useAuth,
} from '@nexus/shared';
import {
  ArrowLeft,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { addItemCreatingCartIfNeeded } from '../lib/cart';

export function ProductDetailPage() {
  const { productId = '' } = useParams();
  const location = useLocation();
  const { session } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['catalog', 'product', productId],
    queryFn: () => getProduct(productId),
    enabled: productId.length > 0,
  });

  const addToCart = useMutation({
    mutationFn: () =>
      addItemCreatingCartIfNeeded({
        productId,
        quantity,
      }),
    onSuccess: () => {
      setActionError(null);
      setMessage(
        `Producto agregado al carrito (cantidad ${quantity}). El precio final lo confirma el servidor.`,
      );
    },
    onError: (caught) => {
      setMessage(null);
      setActionError(toApiError(caught).message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <PageSkeleton rows={3} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (data === undefined) {
    return null;
  }

  const canBuy = session?.user.role === 'BUYER';
  const isAuthenticated = session !== null;
  const correctPortal =
    session !== null ? PORTAL_BY_ROLE[session.user.role] : undefined;
  const inStock = data.stock > 0;
  const maxQuantity = Math.max(1, data.stock);

  const updateQuantity = (next: number): void => {
    if (!Number.isFinite(next)) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.min(maxQuantity, Math.max(1, Math.trunc(next))));
  };

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">
          Catálogo
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="truncate text-foreground/80">{data.category}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-5">
          <div className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-[#f7f6f2]/12 bg-[#f7f6f2]/[0.05]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(232,90,36,0.10),transparent_58%)]" />
            <div className="hero-grid absolute inset-0 opacity-40" />
            <Package className="relative h-28 w-28 text-[#171717]/20 transition-transform duration-500 ease-smooth group-hover:scale-105" />
            <span className="absolute bottom-4 left-4 rounded-full border border-[#f7f6f2]/15 bg-[#f7f6f2]/[0.06] px-3 py-1 text-[11px] text-[#171717]/60 backdrop-blur">
              Sin imagen en el contrato del backend
            </span>
          </div>

          <div className="rounded-2xl border border-[#171717]/10 bg-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Descripción
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">
              {data.description}
            </p>

            <h2 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Ficha del producto
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  SKU
                </dt>
                <dd className="mt-1 font-mono text-xs text-foreground tabular-nums">
                  {data.sku ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Marca
                </dt>
                <dd className="mt-1 text-foreground">{data.brand ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Disponibilidad
                </dt>
                <dd className="mt-1 text-foreground tabular-nums">
                  {data.stock} unidades
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Publicación
                </dt>
                <dd className="mt-1 text-foreground tabular-nums">
                  {formatDate(data.publicationDate)}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Vendedor
                </dt>
                <dd className="mt-1 truncate font-mono text-xs text-foreground">
                  {data.seller.sellerId}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[#171717]/12 bg-card p-5 shadow-[0_30px_70px_-45px_rgba(0,0,0,1)] sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{data.category}</Badge>
              <Badge variant={statusVariant(data.productStatus)}>
                {data.productStatus}
              </Badge>
              <Badge variant={inStock ? 'success' : 'destructive'}>
                {inStock ? 'Disponible' : 'Sin stock'}
              </Badge>
            </div>

            <h1 className="mt-4 text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              {data.name}
            </h1>

            <div className="mt-5 flex items-end gap-3">
              <p className="text-4xl font-bold tracking-tight text-accent-foreground tabular-nums">
                {formatMoney(data.price)}
              </p>
              <span className="pb-1 text-xs text-muted-foreground">
                precio del servidor
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={
                  inStock
                    ? 'flex h-2 w-2 rounded-full bg-emerald-600'
                    : 'flex h-2 w-2 rounded-full bg-red-600'
                }
              />
              {inStock
                ? `${data.stock} unidades disponibles`
                : 'Producto sin stock'}
            </div>

            <div className="my-5 h-px bg-[#171717]/10" />

            {message !== null ? (
              <Alert variant="success" className="mb-4">
                {message}
              </Alert>
            ) : null}
            {actionError !== null ? (
              <Alert variant="error" className="mb-4">
                {actionError}
              </Alert>
            ) : null}

            {!isAuthenticated ? (
              <Alert variant="info" title="Inicia sesión para comprar">
                <div className="mt-2">
                  <Link
                    to="/login"
                    state={{ from: location.pathname }}
                    className="font-semibold text-accent-foreground hover:text-accent-foreground-hover"
                  >
                    Ingresar como comprador
                  </Link>
                </div>
              </Alert>
            ) : null}

            {isAuthenticated && !canBuy ? (
              <Alert variant="warning" title="Este portal es sólo para compradores">
                Tu rol es {session.user.role}.
                {correctPortal !== undefined ? (
                  <div className="mt-2">
                    <a
                      className="font-semibold text-accent-foreground hover:text-accent-foreground-hover"
                      href={portalUrl(correctPortal.port)}
                    >
                      Ir a {correctPortal.name} (:{correctPortal.port})
                    </a>
                  </div>
                ) : null}
              </Alert>
            ) : null}

            {canBuy ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="quantity"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    Cantidad
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl border border-[#171717]/15 bg-[#1E1F22]/60">
                      <button
                        type="button"
                        aria-label="Disminuir cantidad"
                        onClick={() => updateQuantity(quantity - 1)}
                        disabled={quantity <= 1}
                        className="flex h-10 w-10 items-center justify-center rounded-l-xl text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        min={1}
                        max={maxQuantity}
                        value={quantity}
                        onChange={(event) => updateQuantity(Number(event.target.value))}
                        className="h-10 w-14 border-x border-[#171717]/10 bg-transparent text-center text-sm font-semibold text-foreground tabular-nums focus:outline-none"
                      />
                      <button
                        type="button"
                        aria-label="Aumentar cantidad"
                        onClick={() => updateQuantity(quantity + 1)}
                        disabled={quantity >= maxQuantity}
                        className="flex h-10 w-10 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Máx. {maxQuantity}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  loading={addToCart.isPending}
                  disabled={!inStock}
                  onClick={() => addToCart.mutate()}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {inStock ? 'Agregar al carrito' : 'Sin stock'}
                </Button>
                <Link
                  to="/cart"
                  className="flex items-center justify-center text-xs font-semibold text-accent-foreground transition-colors hover:text-accent-foreground-hover"
                >
                  Ver carrito
                </Link>
              </div>
            ) : null}

            <div className="mt-6 space-y-3 border-t border-[#171717]/10 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-[#171717]/50" />
                Envío gestionado por el operador logístico
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#171717]/50" />
                Devoluciones hasta 30 días tras la entrega
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
