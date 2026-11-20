import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  approveOrder,
  cn,
  formatDate,
  formatMoney,
  listSellerOrders,
  prepareOrder,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import {
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { useState } from 'react';

const STATUS_FILTERS = [
  '',
  'Pending',
  'Confirmed',
  'Preparing',
  'Sent',
  'Delivered',
  'Cancelled',
] as const;

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

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

  const orders = ordersQuery.data ?? [];
  const visibleOrders =
    statusFilter.length === 0
      ? orders
      : orders.filter((order) => order.orderStatus === statusFilter);

  const countBy = (status: string): number =>
    orders.filter((order) => order.orderStatus === status).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes"
        description="Pedidos que contienen productos del vendedor autenticado."
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Órdenes"
          value={orders.length}
          hint="Total recibido"
          tone="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Por aprobar"
          value={countBy('Pending')}
          hint="Estado Pending"
          tone="warning"
        />
        <StatCard
          icon={PackageCheck}
          label="En preparación"
          value={countBy('Preparing')}
          hint="Estado Preparing"
          tone="info"
        />
        <StatCard
          icon={Truck}
          label="Enviadas"
          value={countBy('Sent')}
          hint="Estado Sent"
          tone="success"
        />
      </div>

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((status) => {
          const active = statusFilter === status;
          return (
            <button
              key={status.length === 0 ? 'all' : status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-[#D9DADC]/12 bg-white/[0.03] text-muted-foreground hover:border-[#D9DADC]/25 hover:text-foreground',
              )}
            >
              {status.length === 0 ? 'Todas' : status}
              <span className="ml-1.5 tabular-nums opacity-70">
                {status.length === 0 ? orders.length : countBy(status)}
              </span>
            </button>
          );
        })}
      </div>

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

      {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="Sin órdenes"
          description="Cuando un comprador incluya tus productos en una orden, aparecerá aquí."
        />
      ) : null}

      {orders.length > 0 && visibleOrders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="Sin órdenes en este estado"
          description="Cambia el filtro para ver el resto del historial."
        />
      ) : null}

      {visibleOrders.length > 0 ? (
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
            {visibleOrders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{order.orderId.slice(0, 8)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {order.buyerId.slice(0, 8)}…
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(order.orderStatus)}>
                    {order.orderStatus}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-primary tabular-nums">
                  {formatMoney(order.total)}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
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
                        Sin acciones
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
