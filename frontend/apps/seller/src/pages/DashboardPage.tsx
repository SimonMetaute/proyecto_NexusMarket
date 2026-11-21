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
  StatCard,
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
import {
  ArrowRight,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
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
          {Array.from({ length: 8 }).map((_, index) => (
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
        actions={
          <>
            {profile !== undefined ? (
              <Badge variant={statusVariant(profile.verificationStatus)}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {profile.verificationStatus}
              </Badge>
            ) : null}
            <Link to="/products/new">
              <Button size="sm">Crear producto</Button>
            </Link>
          </>
        }
      />

      {profile !== undefined && profile.verificationStatus !== 'Verified' ? (
        <Alert variant="warning" title="Vendedor no verificado">
          El estado actual es {profile.verificationStatus}. Publicar productos requiere
          verificación aprobada por un administrador.
        </Alert>
      ) : null}

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label="Órdenes totales"
          value={String(dashboard?.totalOrders ?? 0)}
          hint="Órdenes que incluyen tus productos"
          tone="primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Ventas totales"
          value={formatMoney(dashboard?.totalSales ?? 0)}
          hint="Facturación agregada"
          tone="success"
        />
        <StatCard
          icon={Package}
          label="Productos publicados"
          value={`${dashboard?.publishedProducts ?? 0} / ${dashboard?.totalProducts ?? 0}`}
          hint="Publicados sobre el total"
          tone="info"
        />
        <StatCard
          icon={Warehouse}
          label="Stock total"
          value={String(dashboard?.totalStock ?? 0)}
          hint="Unidades disponibles"
          tone="warning"
        />
        <StatCard
          icon={ShoppingBag}
          label="Órdenes activas"
          value={String(dashboard?.activeOrders ?? 0)}
          hint="En curso ahora mismo"
          tone="primary"
        />
        <StatCard
          icon={RotateCcw}
          label="Devoluciones pendientes"
          value={String(dashboard?.pendingReturns ?? 0)}
          hint="Requieren seguimiento"
          tone="danger"
        />
        <StatCard
          icon={Warehouse}
          label="Registros de inventario"
          value={String(inventory.length)}
          hint="Filas devueltas por /inventory"
          tone="neutral"
        />
        <StatCard
          icon={ShieldCheck}
          label="Verificación"
          value={
            <span className="text-lg">
              {dashboard?.verificationStatus ??
                profile?.verificationStatus ??
                '—'}
            </span>
          }
          hint="Estado de la cuenta de vendedor"
          tone={
            (dashboard?.verificationStatus ??
              profile?.verificationStatus) === 'Verified'
              ? 'success'
              : 'warning'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Órdenes recientes</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Últimos movimientos con tus productos
              </p>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-foreground transition-colors hover:text-accent-foreground-hover"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
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
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{order.orderId.slice(0, 8)}
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
                <Button className="w-full">
                  Crear producto
                  <ArrowRight className="h-4 w-4" />
                </Button>
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
            liquidaciones se consultan por separado en <code>/seller/store</code> y{' '}
            <code>/seller/settlements</code>.
          </Alert>
        </div>
      </div>
    </div>
  );
}
