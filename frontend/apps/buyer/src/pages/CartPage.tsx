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
            className="text-destructive"
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
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{lineName(line.productId)}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.variantId !== undefined ? `Variante ${line.variantId} · ` : ''}
                    Producto {line.productId}
                  </p>
                  <p className="text-sm">
                    {formatMoney(line.unitPrice)} · subtotal{' '}
                    <span className="font-medium">{formatMoney(line.subtotal)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Disminuir cantidad"
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
                  <span className="w-10 text-center text-sm font-medium">
                    {line.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Aumentar cantidad"
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
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar línea"
                    disabled={removeItem.isPending}
                    onClick={() => removeItem.mutate(line.cartLineId)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit space-y-4 rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold">Resumen</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatMoney(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(cart.total)}</dd>
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
