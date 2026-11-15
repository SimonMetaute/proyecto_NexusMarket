import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  ApiError,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  checkout,
  formatMoney,
  getCart,
  listAddresses,
  listPaymentMethods,
  toApiError,
} from '@nexus/shared';
import type { CheckoutRequest, OrderSummary } from '@nexus/shared';
import { CheckCircle2, CreditCard, MapPin, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AddressDialog, PaymentDialog } from '../components/address-payment-dialogs';

type Outcome =
  | { kind: 'approved'; order: OrderSummary }
  | { kind: 'rejected'; message: string }
  | { kind: 'unknown'; message: string }
  | null;

export function CheckoutPage() {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [addressDialog, setAddressDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);

  const cartQuery = useQuery({
    queryKey: ['buyer', 'cart'],
    queryFn: getCart,
    retry: false,
  });
  const addressesQuery = useQuery({
    queryKey: ['buyer', 'addresses'],
    queryFn: listAddresses,
  });
  const paymentsQuery = useQuery({
    queryKey: ['buyer', 'payment-methods'],
    queryFn: listPaymentMethods,
  });

  const addresses = addressesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const selectedAddress =
    addresses.find((address) => address.addressId === selectedAddressId) ??
    addresses.find((address) => address.isPrimary) ??
    addresses[0];
  const selectedPayment =
    payments.find((payment) => payment.paymentMethodId === selectedPaymentId) ??
    payments.find((payment) => payment.isDefault) ??
    payments[0];

  const pay = useMutation({
    mutationFn: (payload: CheckoutRequest) => checkout(payload),
    onSuccess: (order) => {
      setOutcome({ kind: 'approved', order });
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'orders'] });
    },
    onError: (error) => {
      const apiError = toApiError(error);
      if (apiError.status === 0 || apiError.status >= 500) {
        setOutcome({ kind: 'unknown', message: apiError.message });
        return;
      }
      setOutcome({ kind: 'rejected', message: apiError.message });
    },
  });

  const cart = cartQuery.data;

  const submitPayment = (): void => {
    if (selectedAddress === undefined || selectedPayment === undefined) {
      setOutcome({
        kind: 'rejected',
        message: 'Selecciona una dirección de entrega y un método de pago.',
      });
      return;
    }
    setOutcome(null);
    pay.mutate({
      deliveryAddress: selectedAddress,
      paymentMethod: selectedPayment,
    });
  };

  // El checkout exitoso invalida/elimina el carrito: esta rama debe evaluarse
  // antes que los estados de carga/error del carrito para no ocultar la orden.
  if (outcome?.kind === 'approved') {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
          <h1 className="mt-3 text-xl font-semibold text-emerald-900">Pago aprobado</h1>
          <p className="mt-1 text-sm text-emerald-800">
            El servidor confirmó la orden. Este es el único estado que se declara como
            éxito.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orden creada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs">{outcome.order.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className="font-medium">{outcome.order.orderStatus}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(outcome.order.total)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link to={`/orders/${outcome.order.orderId}`}>
            <Button>Ver detalle de la orden</Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Seguir comprando</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (cartQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (cartQuery.isError) {
    const error = cartQuery.error;
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="space-y-6">
          <PageHeader title="Checkout" />
          <EmptyState
            icon={<ShoppingCart className="h-10 w-10" />}
            title="No tienes un carrito abierto"
            description="Agrega productos antes de iniciar el checkout."
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
        <PageHeader title="Checkout" />
        <ErrorState error={error} onRetry={() => void cartQuery.refetch()} />
      </div>
    );
  }

  if (cart === undefined) {
    return null;
  }

  if (cart.cartLines.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checkout" />
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10" />}
          title="Tu carrito está vacío"
          description="Agrega productos antes de confirmar una orden."
          action={
            <Link to="/">
              <Button>Ir al catálogo</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const loadingOptions = addressesQuery.isLoading || paymentsQuery.isLoading;
  const optionsError = addressesQuery.error ?? paymentsQuery.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout"
        description="Revisa el resumen y confirma el pago simulado contra el backend."
      />

      {outcome?.kind === 'rejected' ? (
        <Alert variant="error" title="Pago rechazado">
          {outcome.message}{' '}
          <span className="block text-xs">
            Puedes revisar los datos y reintentar. No se declaró ninguna orden.
          </span>
        </Alert>
      ) : null}

      {outcome?.kind === 'unknown' ? (
        <Alert variant="warning" title="Resultado desconocido">
          {outcome.message}{' '}
          <span className="block text-xs">
            El servidor no confirmó la orden. Verifica tu historial antes de reintentar:
            no se declara éxito sin una respuesta 201.
          </span>
          <Link
            to="/orders"
            className="mt-2 inline-block font-medium text-amber-900 underline"
          >
            Revisar mis órdenes
          </Link>
        </Alert>
      ) : null}

      {optionsError !== undefined && optionsError !== null ? (
        <ErrorState
          error={optionsError}
          onRetry={() => {
            void addressesQuery.refetch();
            void paymentsQuery.refetch();
          }}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Dirección de entrega
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAddressDialog(true)}
              >
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingOptions ? <Skeleton className="h-16 w-full" /> : null}
              {!loadingOptions && addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tienes direcciones registradas. Agrega una para continuar.
                </p>
              ) : null}
              {addresses.map((address) => (
                <label
                  key={address.addressId}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm hover:bg-muted/50"
                >
                  <input
                    type="radio"
                    name="address"
                    className="mt-1"
                    checked={selectedAddress?.addressId === address.addressId}
                    onChange={() => setSelectedAddressId(address.addressId)}
                  />
                  <span>
                    <span className="font-medium">
                      {address.address}, {address.city}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {address.department}, {address.country} · {address.postalCode}
                      {address.reference !== undefined && address.reference.length > 0
                        ? ` · ${address.reference}`
                        : ''}
                    </span>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Método de pago
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPaymentDialog(true)}
              >
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {!loadingOptions && payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tienes métodos de pago registrados. Agrega uno para continuar.
                </p>
              ) : null}
              {payments.map((payment) => (
                <label
                  key={payment.paymentMethodId}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm hover:bg-muted/50"
                >
                  <input
                    type="radio"
                    name="payment"
                    className="mt-1"
                    checked={selectedPayment?.paymentMethodId === payment.paymentMethodId}
                    onChange={() => setSelectedPaymentId(payment.paymentMethodId)}
                  />
                  <span>
                    <span className="font-medium">
                      {payment.brand} {payment.maskedNumber}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {payment.type} · vence {payment.expirationDate} ·{' '}
                      {payment.cardholder}
                    </span>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="h-fit space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">Resumen del pedido</h2>
          <ul className="space-y-2 text-sm">
            {cart.cartLines.map((line) => (
              <li key={line.cartLineId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {line.quantity} × producto {line.productId.slice(0, 8)}…
                </span>
                <span>{formatMoney(line.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatMoney(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(cart.total)}</dd>
            </div>
          </dl>
          <Button
            className="w-full"
            loading={pay.isPending}
            disabled={
              selectedAddress === undefined ||
              selectedPayment === undefined ||
              loadingOptions
            }
            onClick={submitPayment}
          >
            Pagar y confirmar orden
          </Button>
          <p className="text-xs text-muted-foreground">
            Pago simulado: el backend decide el resultado. Un 201 confirma la orden; un
            error 4xx la rechaza; sin respuesta el resultado queda desconocido.
          </p>
        </aside>
      </div>

      <AddressDialog
        open={addressDialog}
        onClose={() => setAddressDialog(false)}
        onCreated={() => {
          setAddressDialog(false);
          void queryClient.invalidateQueries({ queryKey: ['buyer', 'addresses'] });
        }}
      />

      <PaymentDialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        onCreated={() => {
          setPaymentDialog(false);
          void queryClient.invalidateQueries({
            queryKey: ['buyer', 'payment-methods'],
          });
        }}
      />
    </div>
  );
}
