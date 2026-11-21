import { useQuery } from '@tanstack/react-query';
import {
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
  formatDate,
  formatMoney,
  listBuyerOrders,
  statusVariant,
} from '@nexus/shared';
import { ArrowUpRight, PackageOpen, Receipt, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OrdersPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['buyer', 'orders'],
    queryFn: listBuyerOrders,
  });

  const orders = data ?? [];
  const totalSpent = orders.reduce((total, order) => total + order.total, 0);
  const latestDate = orders.reduce<string | undefined>((latest, order) => {
    if (latest === undefined) {
      return order.creationDate;
    }
    return Date.parse(order.creationDate) > Date.parse(latest)
      ? order.creationDate
      : latest;
  }, undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis órdenes"
        description="Historial de pedidos devuelto por el backend."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && orders.length > 0 ? (
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Órdenes registradas"
            value={orders.length}
            hint="Historial completo del comprador"
            icon={ShoppingBag}
            tone="primary"
          />
          <StatCard
            label="Total histórico"
            value={formatMoney(totalSpent)}
            hint="Suma de los totales confirmados"
            icon={Receipt}
            tone="success"
          />
          <StatCard
            label="Última orden"
            value={
              latestDate !== undefined ? formatDate(latestDate) : '—'
            }
            hint="Fecha del pedido más reciente"
            icon={PackageOpen}
            tone="info"
          />
        </div>
      ) : null}

      {!isLoading && !isError && orders.length === 0 ? (
        <EmptyState
          icon={<PackageOpen className="h-5 w-5" />}
          title="Aún no tienes órdenes"
          description="Cuando completes un checkout aprobado, tu pedido aparecerá aquí."
          action={
            <Link to="/">
              <Button>Explorar catálogo</Button>
            </Link>
          }
        />
      ) : null}

      {orders.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{order.orderId.slice(0, 10)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(order.orderStatus)}>
                    {order.orderStatus}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-accent-foreground tabular-nums">
                  {formatMoney(order.total)}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatDate(order.creationDate)}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to={`/orders/${order.orderId}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-accent-foreground transition-colors hover:bg-[#f7f6f2]/[0.08] hover:text-accent-foreground-hover"
                  >
                    Ver detalle
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
