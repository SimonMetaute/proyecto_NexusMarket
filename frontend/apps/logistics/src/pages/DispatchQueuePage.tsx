import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
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
  listLogisticsWarehouses,
  statusVariant,
} from '@nexus/shared';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DispatchQueuePage() {
  const warehousesQuery = useQuery({
    queryKey: ['logistics', 'warehouses'],
    queryFn: listLogisticsWarehouses,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cola de despacho"
        description="Órdenes pagadas/aprobadas pendientes de preparación y envío."
      />

      <Alert variant="warning" title="El backend no expone la cola de despacho">
        No existe un endpoint para listar órdenes confirmadas ni envíos. La cola no puede
        construirse con datos reales. Abajo se muestran las bodegas operativas que sí
        devuelve la API.
      </Alert>

      <EmptyState
        icon={<Truck className="h-10 w-10" />}
        title="Sin fuente de datos para la cola"
        description="Cuando el backend publique el listado de envíos/órdenes confirmadas, esta vista se conectará a él. Para operar un envío concreto, abre /shipments/:id con el identificador real."
        action={
          <Link
            to="/shipments/shipment-id"
            className="text-sm font-medium text-accent-foreground hover:underline"
          >
            Ir a gestión de envío
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Bodegas operativas</h2>

        {warehousesQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}

        {warehousesQuery.isError ? (
          <ErrorState
            error={warehousesQuery.error}
            onRetry={() => void warehousesQuery.refetch()}
          />
        ) : null}

        {warehousesQuery.data !== undefined &&
        warehousesQuery.data.length === 0 ? (
          <EmptyState
            title="Sin bodegas"
            description="El backend no devolvió bodegas para este operador."
          />
        ) : null}

        {warehousesQuery.data !== undefined &&
        warehousesQuery.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bodega</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehousesQuery.data.map((warehouse) => (
                <TableRow key={warehouse.warehouseId}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {warehouse.sellerId}
                  </TableCell>
                  <TableCell>
                    {warehouse.location.city}, {warehouse.location.department}
                  </TableCell>
                  <TableCell>{warehouse.capacity}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(warehouse.status)}>
                      {warehouse.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(warehouse.creationDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </section>
    </div>
  );
}
