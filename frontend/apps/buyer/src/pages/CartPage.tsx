import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  ApiError,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  formatMoney,
  getCart,
  removeCartItem,
  clearCart,
  toApiError,
  updateCartItem,
} from '@nexus/shared';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProductLookup } from '../lib/use-product-lookup';

export function CartPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const cartQuery = useQuery({
    queryKey: ['buyer', 'cart'],
    queryFn: getCart,
    retry: false,
  });

  const cart = cartQuery.data;
  const lookup = useProductLookup(cart !== undefined);

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['buyer', 'cart'] });
  };

  const updateQuantity = useMutation({
    mutationFn: (input: { cartLineId: string; quantity: number }) =>
      updateCartItem(input.cartLineId, input.quantity),
    onSuccess: () => {
      setActionError(null);
      void invalidate();
    },
    onError: (error) => setActionError(toApiError(error).message),
  });

  const removeItem = useMutation({
    mutationFn: (cartLineId: string) => removeCartItem(cartLineId),
    onSuccess: () => {
      setActionError(null);
      void invalidate();
    },
    onError: (error) => setActionError(toApiError(error).message),
  });

  const clear = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      setActionError(null);
      void invalidate();
    },
    onError: (error) => setActionError(toApiError(error).message),
  });

  if (cartQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (cartQuery.isError) {
    const error = cartQuery.error;
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="space-y-6">
          <PageHeader title="Carrito" />
          <EmptyState
            icon={<ShoppingCart className="h-10 w-10" />}
            title="No tienes un carrito abierto"
            description="Agrega productos desde el catálogo para iniciar tu compra."
            action={
              <Link to="/">
                <Button>Ir al catálogo</Button>
              </Link>
            }
          />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <PageHeader title="Carrito" />
        <ErrorState error={error} onRetry={() => void cartQuery.refetch()} />
      </div>
    );
  }

  if (cart === undefined) {
    return null;
  }

  const lineName = (productId: string): string =>
    lookup.byId.get(productId)?.name ?? `Producto ${productId.slice(0, 8)}…`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carrito"
        description="Los precios y totales son los devueltos por el backend."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="border-red-600/25 text-red-700 hover:border-red-600/40 hover:bg-red-600/10"
            loading={clear.isPending}
            onClick={() => clear.mutate()}
          >
            Vaciar carrito
          </Button>
        }
      />

      {actionError !== null ? <Alert variant="error">{actionError}</Alert> : null}

      {cart.cartLines.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10" />}
          title="Tu carrito está vacío"
          description="Agrega productos desde el catálogo para continuar."
          action={
            <Link to="/">
              <Button>Ir al catálogo</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            {cart.cartLines.map((line) => (
              <div
                key={line.cartLineId}
                className="card-hover flex flex-col gap-4 rounded-2xl border border-[#171717]/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold text-foreground">
                    {lineName(line.productId)}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {line.variantId !== undefined ? `Variante ${line.variantId} · ` : ''}
                    Producto {line.productId}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatMoney(line.unitPrice)} · subtotal{' '}
                    <span className="font-semibold text-accent-foreground">
                      {formatMoney(line.subtotal)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-[#f7f6f2]/12 bg-[#f7f6f2]/[0.05]">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Disminuir cantidad"
                      className="rounded-r-none"
                      disabled={line.quantity <= 1 || updateQuantity.isPending}
                      onClick={() =>
                        updateQuantity.mutate({
                          cartLineId: line.cartLineId,
                          quantity: line.quantity - 1,
                        })
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center text-sm font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Aumentar cantidad"
                      className="rounded-l-none"
                      disabled={updateQuantity.isPending}
                      onClick={() =>
                        updateQuantity.mutate({
                          cartLineId: line.cartLineId,
                          quantity: line.quantity + 1,
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar línea"
                    className="text-red-700 hover:bg-red-600/10 hover:text-red-800"
                    disabled={removeItem.isPending}
                    onClick={() => removeItem.mutate(line.cartLineId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border border-[#171717]/12 bg-card p-5 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold tracking-tight">Resumen</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(cart.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-[#171717]/10 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="text-xl font-bold text-accent-foreground tabular-nums">
                  {formatMoney(cart.total)}
                </dd>
              </div>
            </dl>
            <Link to="/checkout" className="block">
              <Button className="w-full">Continuar al checkout</Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              El total definitivo se valida y reserva stock en el servidor al confirmar
              el checkout.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
