import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  ErrorState,
  FormField,
  PageHeader,
  Select,
  Skeleton,
  Stepper,
  Textarea,
  formatDate,
  formatMoney,
  getBuyerOrder,
  listBuyerReturns,
  requestReturn,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const RETURN_REASONS = ['Damage', 'Shipping Error', 'Disagreement', 'Other'];

const ORDER_STEPS = [
  { label: 'Creada', hint: 'Orden registrada' },
  { label: 'En preparación', hint: 'Seller alista el pedido' },
  { label: 'En tránsito', hint: 'En camino' },
  { label: 'Entregada', hint: 'Recibida por el comprador' },
] as const;

/** Traduce el estado real del backend al índice visual del stepper. */
const STEP_BY_STATUS: Record<string, number> = {
  Pending: 0,
  Confirmed: 0,
  Preparing: 1,
  Sent: 2,
  Delivered: 3,
};

export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: ['buyer', 'orders', orderId],
    queryFn: () => getBuyerOrder(orderId),
    enabled: orderId.length > 0,
  });

  const returnsQuery = useQuery({
    queryKey: ['buyer', 'returns'],
    queryFn: listBuyerReturns,
    enabled: orderId.length > 0,
  });

  const orderReturns =
    returnsQuery.data?.filter((returnCase) => returnCase.orderId === orderId) ?? [];
  const activeReturn = orderReturns.find(
    (returnCase) => returnCase.returnStatus !== 'Rejected',
  );

  const mutation = useMutation({
    mutationFn: () => requestReturn(orderId, { reason, evidence: evidence.trim() }),
    onSuccess: (created) => {
      setOpen(false);
      setError(null);
      setMessage(
        `Devolución ${created.returnId} registrada (${created.returnStatus}).`,
      );
      setEvidence('');
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'returns'] });
      void queryClient.invalidateQueries({ queryKey: ['buyer', 'orders'] });
    },
    onError: (caught) => {
      const apiError = toApiError(caught);
      setError(
        apiError.field !== undefined
          ? `${apiError.message} (campo: ${apiError.field})`
          : apiError.message,
      );
    },
  });

  const canReturn = data?.orderStatus === 'Delivered' && activeReturn === undefined;

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

      {isError ? (
        <ErrorState error={queryError} onRetry={() => void refetch()} />
      ) : null}

      {message !== null ? <Alert variant="success">{message}</Alert> : null}

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

          <Card className="p-5 sm:p-6">
            <Stepper
              steps={ORDER_STEPS}
              current={STEP_BY_STATUS[data.orderStatus] ?? 0}
              errorLabel={
                data.orderStatus === 'Cancelled' || data.orderStatus === 'Refunded'
                  ? `Orden ${data.orderStatus.toLowerCase()}`
                  : undefined
              }
            />
          </Card>

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
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Ítems</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {data.items.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Estado</span>
                    <Badge variant={statusVariant(data.orderStatus)}>
                      {data.orderStatus}
                    </Badge>
                  </div>
                  {data.deliveryDate !== undefined ? (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Entrega</span>
                      <span className="text-foreground tabular-nums">
                        {formatDate(data.deliveryDate)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between border-t border-[#D9DADC]/10 pt-3 text-base">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary tabular-nums">
                      {formatMoney(data.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Devoluciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {data.orderStatus !== 'Delivered' ? (
                    <p className="text-muted-foreground">
                      Solo se pueden devolver órdenes entregadas. El estado actual es{' '}
                      <strong>{data.orderStatus}</strong>.
                    </p>
                  ) : null}

                  {orderReturns.length > 0 ? (
                    <ul className="space-y-2">
                      {orderReturns.map((returnCase) => (
                        <li
                          key={returnCase.returnId}
                          className="rounded-xl border border-[#D9DADC]/12 bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant={statusVariant(returnCase.returnStatus)}>
                              {returnCase.returnStatus}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(returnCase.requestDate)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {returnCase.reason} · reembolso{' '}
                            {formatMoney(returnCase.refundAmount)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {activeReturn === undefined ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canReturn}
                      onClick={() => {
                        setError(null);
                        setOpen(true);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" /> Solicitar devolución
                    </Button>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    La ventana de devolución es de 30 días desde la entrega y solo
                    admite una solicitud activa por orden.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>

          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Solicitar devolución"
            description="El backend valida que la orden esté entregada y dentro de los 30 días posteriores."
            footer={
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  loading={mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  Enviar solicitud
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <FormField label="Motivo" htmlFor="returnReason">
                <Select
                  id="returnReason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                >
                  {RETURN_REASONS.map((candidate) => (
                    <option key={candidate} value={candidate}>
                      {candidate}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Evidencia (opcional)" htmlFor="returnEvidence">
                <Textarea
                  id="returnEvidence"
                  rows={3}
                  value={evidence}
                  onChange={(event) => setEvidence(event.target.value)}
                  placeholder="Describe el problema o adjunta una referencia"
                />
              </FormField>
              {error !== null ? <Alert variant="error">{error}</Alert> : null}
            </div>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}
