import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  getSellerDashboard,
  getSellerProfile,
  listSellerInventory,
  listSellerOrders,
  statusVariant,
} from '@nexus/shared';
import { Package, RotateCcw, ShoppingBag, TrendingUp, Warehouse } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const profileQuery = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: getSellerProfile,
  });
  const ordersQuery = useQuery({
    queryKey: ['seller', 'orders'],
    queryFn: listSellerOrders,
  });
  const inventoryQuery = useQuery({
    queryKey: ['seller', 'inventory'],
    queryFn: listSellerInventory,
  });
  const dashboardQuery = useQuery({
    queryKey: ['seller', 'dashboard'],
    queryFn: getSellerDashboard,
  });

  const isLoading =
    profileQuery.isLoading ||
    ordersQuery.isLoading ||
    inventoryQuery.isLoading ||
    dashboardQuery.isLoading;
  const firstError =
    profileQuery.error ??
    ordersQuery.error ??
    inventoryQuery.error ??
    dashboardQuery.error;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (
    (profileQuery.isError || ordersQuery.isError || inventoryQuery.isError) &&
    firstError !== null
  ) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <ErrorState
          error={firstError}
          onRetry={() => {
            void profileQuery.refetch();
            void ordersQuery.refetch();
            void inventoryQuery.refetch();
            void dashboardQuery.refetch();
          }}
        />
      </div>
    );
  }

  const profile = profileQuery.data;
  const dashboard = dashboardQuery.data;
  const orders = ordersQuery.data ?? [];
  const inventory = inventoryQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile !== undefined ? profile.commercialName : 'Dashboard'}
        description="Resumen operativo construido sólo con respuestas del backend."
      />

      {profile !== undefined && profile.verificationStatus !== 'Verified' ? (
        <Alert variant="warning" title="Vendedor no verificado">
          El estado actual es {profile.verificationStatus}. Publicar productos requiere
          verificación aprobada por un administrador.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Órdenes totales"
          value={String(dashboard?.totalOrders ?? 0)}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Ventas totales"
          value={formatMoney(dashboard?.totalSales ?? 0)}
        />
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Productos publicados"
          value={`${dashboard?.publishedProducts ?? 0} / ${dashboard?.totalProducts ?? 0}`}
        />
        <MetricCard
          icon={<Warehouse className="h-4 w-4" />}
          label="Stock total"
          value={String(dashboard?.totalStock ?? 0)}
        />
        <MetricCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Órdenes activas"
          value={String(dashboard?.activeOrders ?? 0)}
        />
        <MetricCard
          icon={<RotateCcw className="h-4 w-4" />}
          label="Devoluciones pendientes"
          value={String(dashboard?.pendingReturns ?? 0)}
        />
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Registros de inventario"
          value={String(inventory.length)}
        />
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Verificación"
          value={dashboard?.verificationStatus ?? profile?.verificationStatus ?? '—'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Órdenes recientes</CardTitle>
            <Link
              to="/orders"
              className="text-sm font-medium text-accent-foreground hover:underline"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <EmptyState
                title="Sin órdenes todavía"
                description="Los pedidos que incluyan tus productos aparecerán aquí."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 5).map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-mono text-xs">
                        {order.orderId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(order.orderStatus)}>
                          {order.orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatMoney(order.total)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.creationDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link to="/products/new">
                <Button className="w-full">Crear producto</Button>
              </Link>
              <Link to="/inventory">
                <Button variant="outline" className="w-full">
                  Registrar entrada de stock
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="outline" className="w-full">
                  Revisar órdenes
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Alert variant="info" title="Métricas del backend">
            Los KPIs provienen de <code>GET /seller/dashboard</code> (agregaciones
            reales de órdenes, productos, stock y devoluciones). La tienda y las
            liquidaciones no existen en el contrato actual.
          </Alert>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
