import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  PageHeader,
  Skeleton,
  formatMoney,
  getBuyerOrder,
  statusVariant,
} from '@nexus/shared';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export function OrderDetailPage() {
  const { orderId = '' } = useParams();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['buyer', 'orders', orderId],
    queryFn: () => getBuyerOrder(orderId),
    enabled: orderId.length > 0,
  });

  return (
    <div className="space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a mis órdenes
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {data !== undefined ? (
        <>
          <PageHeader
            title="Detalle de la orden"
            description={`Orden ${data.orderId}`}
            actions={
              <Badge variant={statusVariant(data.orderStatus)}>
                {data.orderStatus}
              </Badge>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Ítems</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border text-sm">
                  {data.items.map((item) => (
                    <li key={item.lineId} className="flex justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium">
                          Producto {item.product.productId.slice(0, 8)}…
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatMoney(item.price)}
                          {item.variantId !== undefined
                            ? ` · variante ${item.variantId}`
                            : ''}
                        </p>
                      </div>
                      <p className="font-medium">{formatMoney(item.subtotal)}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Totales</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(data.total)}</span>
                </CardContent>
              </Card>

              <Alert variant="info" title="Devoluciones no disponibles">
                <p>
                  El botón se muestra deshabilitado porque el backend todavía no expone
                  el endpoint de devoluciones. No se simula la operación.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled
                  title="El backend no expone POST /buyer/returns"
                >
                  <RotateCcw className="h-4 w-4" /> Solicitar devolución
                </Button>
              </Alert>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
