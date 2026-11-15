import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  ErrorState,
  PageSkeleton,
  PORTAL_BY_ROLE,
  Skeleton,
  formatDate,
  formatMoney,
  getProduct,
  portalUrl,
  statusVariant,
  toApiError,
  useAuth,
} from '@nexus/shared';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
          Sin imagen en el contrato del backend
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{data.category}</Badge>
            <Badge variant={statusVariant(data.productStatus)}>
              {data.productStatus}
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
            <p className="text-sm text-muted-foreground">{data.description}</p>
          </div>

          <p className="text-3xl font-semibold">{formatMoney(data.price)}</p>

          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">SKU</dt>
              <dd>{data.sku ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Marca</dt>
              <dd>{data.brand ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Disponibilidad</dt>
              <dd>{data.stock} unidades</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Publicación</dt>
              <dd>{formatDate(data.publicationDate)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Vendedor</dt>
              <dd className="truncate">{data.seller.sellerId}</dd>
            </div>
          </dl>

          {message !== null ? <Alert variant="success">{message}</Alert> : null}
          {actionError !== null ? <Alert variant="error">{actionError}</Alert> : null}

          {!isAuthenticated ? (
            <Alert variant="info" title="Inicia sesión para comprar">
              <div className="mt-2">
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="font-medium text-accent-foreground hover:underline"
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
                    className="font-medium text-accent-foreground hover:underline"
                    href={portalUrl(correctPortal.port)}
                  >
                    Ir a {correctPortal.name} (:{correctPortal.port})
                  </a>
                </div>
              ) : null}
            </Alert>
          ) : null}

          {canBuy ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Cantidad
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={Math.max(1, data.stock)}
                  value={quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setQuantity(Number.isFinite(next) ? Math.max(1, next) : 1);
                  }}
                  className="h-10 w-24 rounded-md border border-input bg-card px-3 text-sm"
                />
              </div>
              <Button
                type="button"
                loading={addToCart.isPending}
                disabled={data.stock <= 0}
                onClick={() => addToCart.mutate()}
              >
                <ShoppingCart className="h-4 w-4" />
                {data.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}
              </Button>
              <Link
                to="/cart"
                className="text-sm font-medium text-accent-foreground hover:underline"
              >
                Ver carrito
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
