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
  cn,
  formatDate,
  formatMoney,
  listLogisticsReturns,
  receiveReturn,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import type { ReturnFilters } from '@nexus/shared';
import { Clock, PackageCheck, RotateCcw, Wallet } from 'lucide-react';
import { useState } from 'react';

const RETURN_STATUSES = [
  '',
  'Requested',
  'InReview',
  'Approved',
  'Rejected',
  'Completed',
];

export function ReturnsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReturnFilters>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const returnsQuery = useQuery({
    queryKey: ['logistics', 'returns', filters],
    queryFn: () => listLogisticsReturns(filters),
  });

  const receive = useMutation({
    mutationFn: (returnId: string) => receiveReturn(returnId),
    onSuccess: (response) => {
      setError(null);
      setMessage(
        `Devolución ${response.returnId} recibida (${response.returnStatus}).`,
      );
      void queryClient.invalidateQueries({ queryKey: ['logistics', 'returns'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const returns = returnsQuery.data ?? [];
  const completed = returns.filter(
    (returnCase) => returnCase.returnStatus === 'Completed',
  ).length;
  const pending = returns.filter(
    (returnCase) =>
      returnCase.returnStatus !== 'Completed' &&
      returnCase.returnStatus !== 'Rejected',
  ).length;
  const refundTotal = returns.reduce(
    (sum, returnCase) => sum + returnCase.refundAmount,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoluciones"
        description="Solicitudes reales de los compradores. Registrar la recepción física marca la devolución como Completed."
      />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={RotateCcw}
          label="En vista"
          value={returns.length}
          hint="Según el filtro actual"
          tone="primary"
        />
        <StatCard
          icon={Clock}
          label="Pendientes"
          value={pending}
          hint="Sin recepción física"
          tone="warning"
        />
        <StatCard
          icon={PackageCheck}
          label="Completadas"
          value={completed}
          hint="Recepción registrada"
          tone="success"
        />
        <StatCard
          icon={Wallet}
          label="Reembolso acumulado"
          value={formatMoney(refundTotal)}
          hint="Suma devuelta por el backend"
          tone="info"
        />
      </div>

      <div className="scrollbar-none flex gap-2 overflow-x-auto rounded-2xl border border-[#171717]/10 bg-card p-3">
        {RETURN_STATUSES.map((status) => {
          const active = (filters.status ?? '') === status;
          return (
            <button
              key={status.length === 0 ? 'all' : status}
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  status: status === '' ? undefined : status,
                }))
              }
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'border-primary/40 bg-primary/[0.12] text-primary-foreground'
                  : 'border-[#171717]/12 bg-[#f7f6f2]/[0.03] text-[#171717]/60 hover:border-[#171717]/20 hover:text-foreground',
              )}
            >
              {status === '' ? 'Todas' : status}
            </button>
          );
        })}
      </div>

      {returnsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {returnsQuery.isError ? (
        <ErrorState
          error={returnsQuery.error}
          onRetry={() => void returnsQuery.refetch()}
        />
      ) : null}

      {!returnsQuery.isLoading && !returnsQuery.isError && returns.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="h-10 w-10" />}
          title="Sin devoluciones para estos filtros"
          description="Las solicitudes aparecen cuando un comprador devuelve una orden entregada dentro de los 30 días posteriores."
        />
      ) : null}

      {returns.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Devolución</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Solicitada</TableHead>
              <TableHead>Reembolso</TableHead>
              <TableHead>Recibida</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((returnCase) => (
              <TableRow key={returnCase.returnId}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{returnCase.returnId.slice(0, 8)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{returnCase.orderId.slice(0, 8)}
                </TableCell>
                <TableCell>{returnCase.reason}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(returnCase.returnStatus)}>
                    {returnCase.returnStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(returnCase.requestDate)}
                </TableCell>
                <TableCell className="font-semibold text-accent-foreground tabular-nums">
                  {formatMoney(returnCase.refundAmount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(returnCase.receivedDate)}
                </TableCell>
                <TableCell className="text-right">
                  {returnCase.returnStatus !== 'Completed' &&
                  returnCase.returnStatus !== 'Rejected' ? (
                    <Button
                      size="sm"
                      loading={
                        receive.isPending &&
                        receive.variables === returnCase.returnId
                      }
                      onClick={() => receive.mutate(returnCase.returnId)}
                    >
                      Registrar recepción
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
