import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  deleteAddress,
  formatDate,
  getBuyerProfile,
  listAddresses,
  listPaymentMethods,
  setPrimaryAddress,
  toApiError,
} from '@nexus/shared';
import { CreditCard, MapPin, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AddressDialog, PaymentDialog } from '../components/address-payment-dialogs';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [addressDialog, setAddressDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['buyer', 'profile'],
    queryFn: getBuyerProfile,
  });
  const addressesQuery = useQuery({
    queryKey: ['buyer', 'addresses'],
    queryFn: listAddresses,
  });
  const paymentsQuery = useQuery({
    queryKey: ['buyer', 'payment-methods'],
    queryFn: listPaymentMethods,
  });

  const invalidateAddresses = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['buyer', 'addresses'] });
    await queryClient.invalidateQueries({ queryKey: ['buyer', 'profile'] });
  };

  const markPrimary = useMutation({
    mutationFn: (addressId: string) => setPrimaryAddress(addressId),
    onSuccess: () => {
      setActionError(null);
      void invalidateAddresses();
    },
    onError: (error) => setActionError(toApiError(error).message),
  });

  const remove = useMutation({
    mutationFn: (addressId: string) => deleteAddress(addressId),
    onSuccess: () => {
      setActionError(null);
      void invalidateAddresses();
    },
    onError: (error) => setActionError(toApiError(error).message),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mi perfil" />
        <ErrorState
          error={profileQuery.error}
          onRetry={() => void profileQuery.refetch()}
        />
      </div>
    );
  }

  const profile = profileQuery.data;
  if (profile === undefined) {
    return null;
  }

  const addresses = addressesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi perfil"
        description="Datos de la cuenta y catálogos de dirección y pago del comprador."
      />

      {actionError !== null ? <Alert variant="error">{actionError}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Buyer ID
            </p>
            <p className="mt-1 font-mono text-xs text-foreground tabular-nums">
              {profile.buyerId}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              User ID
            </p>
            <p className="mt-1 font-mono text-xs text-foreground tabular-nums">
              {profile.userId}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Nivel de confianza
            </p>
            <div className="mt-1">
              <Badge variant="secondary">{profile.trustLevel}</Badge>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Última compra
            </p>
            <p className="mt-1 text-foreground tabular-nums">
              {formatDate(profile.lastPurchaseDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Direcciones
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddressDialog(true)}
            >
              Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {addressesQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : null}
            {!addressesQuery.isLoading && addresses.length === 0 ? (
              <EmptyState
                title="Sin direcciones"
                description="Agrega una dirección para usarla en el checkout."
              />
            ) : null}
            {addresses.map((address) => (
              <div
                key={address.addressId}
                className="rounded-xl border border-[#D9DADC]/12 bg-white/[0.02] p-3 text-sm transition-colors hover:border-[#D9DADC]/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {address.address}, {address.city}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {address.department}, {address.country} · {address.postalCode}
                    </p>
                  </div>
                  {address.isPrimary ? (
                    <Badge variant="success">
                      <Star className="mr-1 h-3 w-3" /> Principal
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-2 flex gap-2">
                  {!address.isPrimary ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={markPrimary.isPending}
                      onClick={() => markPrimary.mutate(address.addressId)}
                    >
                      Marcar principal
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-300 hover:bg-red-400/10 hover:text-red-200"
                    loading={remove.isPending}
                    onClick={() => remove.mutate(address.addressId)}
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Métodos de pago
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPaymentDialog(true)}
            >
              Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentsQuery.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : null}
            {!paymentsQuery.isLoading && payments.length === 0 ? (
              <EmptyState
                title="Sin métodos de pago"
                description="Agrega un método enmascarado para el checkout simulado."
              />
            ) : null}
            {payments.map((payment) => (
              <div
                key={payment.paymentMethodId}
                className="rounded-xl border border-[#D9DADC]/12 bg-white/[0.02] p-3 text-sm transition-colors hover:border-[#D9DADC]/20"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {payment.brand} {payment.maskedNumber}
                  </p>
                  {payment.isDefault ? <Badge variant="success">Default</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payment.type} · vence {payment.expirationDate} · {payment.cardholder}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AddressDialog
        open={addressDialog}
        onClose={() => setAddressDialog(false)}
        onCreated={() => {
          setAddressDialog(false);
          void invalidateAddresses();
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
