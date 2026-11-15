import { useQuery } from '@tanstack/react-query';
import {
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
  formatDate,
  formatMoney,
  listBuyerOrders,
  statusVariant,
} from '@nexus/shared';
import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OrdersPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['buyer', 'orders'],
    queryFn: listBuyerOrders,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis órdenes"
        description="Historial de pedidos devuelto por el backend."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && data !== undefined && data.length === 0 ? (
        <EmptyState
          icon={<PackageOpen className="h-10 w-10" />}
          title="Aún no tienes órdenes"
          description="Cuando completes un checkout aprobado, tu pedido aparecerá aquí."
          action={
            <Link to="/">
              <Button>Explorar catálogo</Button>
            </Link>
          }
        />
      ) : null}

      {data !== undefined && data.length > 0 ? (
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
            {data.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
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
                  <Link
                    to={`/orders/${order.orderId}`}
                    className="text-sm font-medium text-accent-foreground hover:underline"
                  >
                    Ver detalle
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
