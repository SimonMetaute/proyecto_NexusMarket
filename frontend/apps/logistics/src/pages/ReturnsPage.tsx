import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatDate,
  formatMoney,
  listLogisticsReturns,
  receiveReturn,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import type { ReturnFilters } from '@nexus/shared';
import { RotateCcw } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoluciones"
        description="Solicitudes reales de los compradores. Registrar la recepción física marca la devolución como Completed."
      />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      <FormField label="Estado" htmlFor="returnStatusFilter">
        <Select
          id="returnStatusFilter"
          value={filters.status ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value === '' ? undefined : event.target.value,
            }))
          }
        >
          {RETURN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === '' ? 'Todos' : status}
            </option>
          ))}
        </Select>
      </FormField>

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
                <TableCell className="font-mono text-xs">
                  {returnCase.returnId}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {returnCase.orderId}
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
                <TableCell>{formatMoney(returnCase.refundAmount)}</TableCell>
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
