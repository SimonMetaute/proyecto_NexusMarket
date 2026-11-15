import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  approveOrder,
  formatDate,
  formatMoney,
  listSellerOrders,
  prepareOrder,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import { ClipboardList } from 'lucide-react';
import { useState } from 'react';

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['seller', 'orders'],
    queryFn: listSellerOrders,
  });

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
  };

  const approve = useMutation({
    mutationFn: (orderId: string) => approveOrder(orderId),
    onSuccess: (response) => {
      setError(null);
      setMessage(`Orden ${response.orderId} → ${response.orderStatus}.`);
      void invalidate();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const prepare = useMutation({
    mutationFn: (orderId: string) => prepareOrder(orderId),
    onSuccess: (response) => {
      setError(null);
      setMessage(`Orden ${response.orderId} → ${response.orderStatus}.`);
      void invalidate();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes"
        description="Pedidos que contienen productos del vendedor autenticado."
      />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      {ordersQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {ordersQuery.isError ? (
        <ErrorState
          error={ordersQuery.error}
          onRetry={() => void ordersQuery.refetch()}
        />
      ) : null}

      {ordersQuery.data !== undefined && ordersQuery.data.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Sin órdenes"
          description="Cuando un comprador incluya tus productos en una orden, aparecerá aquí."
        />
      ) : null}

      {ordersQuery.data !== undefined && ordersQuery.data.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersQuery.data.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
                <TableCell className="font-mono text-xs">{order.buyerId}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(order.orderStatus)}>
                    {order.orderStatus}
                  </Badge>
                </TableCell>
                <TableCell>{formatMoney(order.total)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(order.creationDate)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {order.orderStatus === 'Pending' ? (
                      <Button
                        size="sm"
                        loading={
                          approve.isPending && approve.variables === order.orderId
                        }
                        onClick={() => approve.mutate(order.orderId)}
                      >
                        Aprobar
                      </Button>
                    ) : null}
                    {order.orderStatus === 'Confirmed' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={
                          prepare.isPending && prepare.variables === order.orderId
                        }
                        onClick={() => prepare.mutate(order.orderId)}
                      >
                        Preparar
                      </Button>
                    ) : null}
                    {order.orderStatus !== 'Pending' &&
                    order.orderStatus !== 'Confirmed' ? (
                      <span className="text-xs text-muted-foreground">
                        Sin acciones disponibles
                      </span>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <Alert variant="info" title="Transiciones reales">
        El backend sólo expone <code>approve</code> y <code>prepare</code>. No se
        simulan otros cambios de estado.
      </Alert>
    </div>
  );
}
