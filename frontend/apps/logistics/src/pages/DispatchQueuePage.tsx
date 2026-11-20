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
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  confirmDelivery,
  dispatchShipment,
  formatDate,
  listLogisticsShipments,
  listLogisticsWarehouses,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import type { ShipmentFilters } from '@nexus/shared';
import { CheckCircle2, Clock, PackageCheck, Truck } from 'lucide-react';
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
  const pendingDispatch = shipments.filter(
    (shipment) =>
      shipment.shipmentStatus === 'Scheduled' ||
      shipment.shipmentStatus === 'InPreparation',
  ).length;
  const inTransit = shipments.filter(
    (shipment) => shipment.shipmentStatus === 'InTransit',
  ).length;
  const delivered = shipments.filter(
    (shipment) => shipment.shipmentStatus === 'Delivered',
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cola de despacho"
        description="Envíos reales con transiciones a InTransit y Delivered; la orden asociada se actualiza en la misma operación."
      />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Truck}
          label="Envíos en vista"
          value={shipments.length}
          hint="Según los filtros actuales"
          tone="primary"
        />
        <StatCard
          icon={Clock}
          label="Por despachar"
          value={pendingDispatch}
          hint="Scheduled + InPreparation"
          tone="warning"
        />
        <StatCard
          icon={PackageCheck}
          label="En tránsito"
          value={inTransit}
          hint="InTransit"
          tone="info"
        />
        <StatCard
          icon={CheckCircle2}
          label="Entregados"
          value={delivered}
          hint="Delivered"
          tone="success"
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-[#D9DADC]/10 bg-card p-4">
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {SHIPMENT_STATUSES.map((status) => {
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
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : 'border-[#D9DADC]/12 bg-white/[0.03] text-muted-foreground hover:border-[#D9DADC]/25 hover:text-foreground',
                )}
              >
                {status === '' ? 'Todos' : status}
              </button>
            );
          })}
        </div>
        <div className="max-w-xs">
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
              <TableHead>Destino</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Salida</TableHead>
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
                <TableCell className="max-w-[16rem] text-sm">
                  <p className="font-medium">
                    {shipment.deliveryAddress.city}
                    {shipment.deliveryAddress.department !== ''
                      ? ` · ${shipment.deliveryAddress.department}`
                      : ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {shipment.deliveryAddress.address}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(shipment.shipmentStatus)}>
                    {shipment.shipmentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(shipment.departureDate)}
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
