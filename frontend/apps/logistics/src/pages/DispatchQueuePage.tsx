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
  confirmDelivery,
  dispatchShipment,
  formatDate,
  listLogisticsShipments,
  listLogisticsWarehouses,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import type { ShipmentFilters } from '@nexus/shared';
import { PackageCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const SHIPMENT_STATUSES = [
  '',
  'Scheduled',
  'InPreparation',
  'InTransit',
  'Delivered',
  'Failed',
  'Retained',
];

export function DispatchQueuePage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ShipmentFilters>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const warehousesQuery = useQuery({
    queryKey: ['logistics', 'warehouses'],
    queryFn: listLogisticsWarehouses,
  });

  const shipmentsQuery = useQuery({
    queryKey: ['logistics', 'shipments', filters],
    queryFn: () => listLogisticsShipments(filters),
  });

  const refresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['logistics', 'shipments'] });
  };

  const dispatch = useMutation({
    mutationFn: (shipmentId: string) => dispatchShipment(shipmentId),
    onSuccess: (response) => {
      setError(null);
      setMessage(`Envío ${response.shipmentId} → ${response.shipmentStatus}.`);
      void refresh();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const confirm = useMutation({
    mutationFn: (shipmentId: string) => confirmDelivery(shipmentId),
    onSuccess: (response) => {
      setError(null);
      setMessage(`Envío ${response.shipmentId} → ${response.shipmentStatus}.`);
      void refresh();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const shipments = shipmentsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cola de despacho"
        description="Envíos reales con transiciones a InTransit y Delivered; la orden asociada se actualiza en la misma operación."
      />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Estado del envío" htmlFor="statusFilter">
          <Select
            id="statusFilter"
            value={filters.status ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value === '' ? undefined : event.target.value,
              }))
            }
          >
            {SHIPMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === '' ? 'Todos' : status}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Bodega" htmlFor="warehouseFilter">
          <Select
            id="warehouseFilter"
            value={filters.warehouseId ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                warehouseId:
                  event.target.value === '' ? undefined : event.target.value,
              }))
            }
          >
            <option value="">Todas</option>
            {(warehousesQuery.data ?? []).map((warehouse) => (
              <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                {warehouse.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {shipmentsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {shipmentsQuery.isError ? (
        <ErrorState
          error={shipmentsQuery.error}
          onRetry={() => void shipmentsQuery.refetch()}
        />
      ) : null}

      {!shipmentsQuery.isLoading &&
      !shipmentsQuery.isError &&
      shipments.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-10 w-10" />}
          title="Sin envíos para estos filtros"
          description="Los envíos se generan cuando una orden confirmada entra al flujo logístico. Ajusta los filtros o espera nuevas órdenes."
        />
      ) : null}

      {shipments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Envío</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Transportadora</TableHead>
              <TableHead>Bodega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <TableRow key={shipment.shipmentId}>
                <TableCell>
                  <p className="font-mono text-xs">{shipment.shipmentId}</p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.trackingCode}
                  </p>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {shipment.orderId}
                </TableCell>
                <TableCell>{shipment.carrier.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  {shipment.warehouseId}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(shipment.shipmentStatus)}>
                    {shipment.shipmentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(shipment.deliveryDate)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {shipment.shipmentStatus === 'Scheduled' ||
                    shipment.shipmentStatus === 'InPreparation' ? (
                      <Button
                        size="sm"
                        loading={
                          dispatch.isPending &&
                          dispatch.variables === shipment.shipmentId
                        }
                        onClick={() => dispatch.mutate(shipment.shipmentId)}
                      >
                        Despachar
                      </Button>
                    ) : null}
                    {shipment.shipmentStatus === 'InTransit' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={
                          confirm.isPending &&
                          confirm.variables === shipment.shipmentId
                        }
                        onClick={() => confirm.mutate(shipment.shipmentId)}
                      >
                        <PackageCheck className="h-3 w-3" /> Confirmar entrega
                      </Button>
                    ) : null}
                    <Link to={`/shipments/${shipment.shipmentId}`}>
                      <Button size="sm" variant="outline">
                        Detalle
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
