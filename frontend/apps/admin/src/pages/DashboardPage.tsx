import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
  formatMoney,
  getAdminDashboard,
  getSupervisorDashboard,
  getSupervisorHealth,
  useAuth,
} from '@nexus/shared';
import {
  Activity,
  Package,
  PackageCheck,
  RotateCcw,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';

export function DashboardPage() {
  const { session } = useAuth();
  const isAdmin = session?.user.role === 'ADMINISTRATOR';
  const isSupervisor = session?.user.role === 'SUPERVISOR';

  const adminQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
    enabled: isAdmin,
  });
  const supervisorQuery = useQuery({
    queryKey: ['supervisor', 'dashboard'],
    queryFn: getSupervisorDashboard,
    enabled: isSupervisor,
  });
  const healthQuery = useQuery({
    queryKey: ['supervisor', 'health'],
    queryFn: getSupervisorHealth,
    enabled: isSupervisor,
  });

  const activeError = isAdmin
    ? adminQuery.error
    : supervisorQuery.error ?? healthQuery.error;
  const isLoading = isAdmin
    ? adminQuery.isLoading
    : supervisorQuery.isLoading || healthQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Sesión ${session?.user.role ?? ''} · agregaciones reales del backend.`}
        actions={
          <Badge variant={isAdmin ? 'default' : 'info'}>
            {isAdmin ? 'Vista administrador' : 'Vista supervisor'}
          </Badge>
        }
      />

      {isSupervisor ? (
        <Alert variant="info" title="Dashboard de supervisor en modo resumen">
          El endpoint <code>/supervisor/dashboard</code> sigue devolviendo el resumen
          básico; los KPIs completos están disponibles en{' '}
          <code>/admin/dashboard</code> para sesiones administradoras.
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : null}

      {activeError !== null && activeError !== undefined ? (
        <ErrorState
          error={activeError}
          onRetry={() => {
            void adminQuery.refetch();
            void supervisorQuery.refetch();
            void healthQuery.refetch();
          }}
        />
      ) : null}

      {isAdmin && adminQuery.data !== undefined ? (
        <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={ShoppingCart}
            label="Órdenes activas"
            value={adminQuery.data.activeOrders}
            hint="En curso en el marketplace"
            tone="primary"
          />
          <StatCard
            icon={TrendingUp}
            label="Ventas totales"
            value={formatMoney(adminQuery.data.totalSales)}
            hint="Facturación agregada"
            tone="success"
          />
          <StatCard
            icon={ShoppingCart}
            label="Órdenes totales"
            value={adminQuery.data.totalOrders}
            hint="Histórico completo"
            tone="info"
          />
          <StatCard
            icon={Users}
            label="Usuarios"
            value={adminQuery.data.totalUsers}
            hint="Cuentas registradas"
            tone="primary"
          />
          <StatCard
            icon={Store}
            label="Vendedores"
            value={adminQuery.data.totalSellers}
            hint="Cuentas de vendedor"
            tone="warning"
          />
          <StatCard
            icon={Package}
            label="Productos"
            value={adminQuery.data.totalProducts}
            hint="Incluye borradores"
            tone="info"
          />
          <StatCard
            icon={PackageCheck}
            label="Publicados"
            value={adminQuery.data.publishedProducts}
            hint="Visibles en el catálogo"
            tone="success"
          />
          <StatCard
            icon={RotateCcw}
            label="Devoluciones pendientes"
            value={adminQuery.data.pendingReturns}
            hint="Requieren gestión"
            tone="danger"
          />
        </div>
      ) : null}

      {isSupervisor ? (
        <>
          {supervisorQuery.data !== undefined ? (
            <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={ShoppingCart}
                label="Órdenes activas"
                value={supervisorQuery.data.activeOrders}
                hint="Resumen del supervisor"
                tone="primary"
              />
              <StatCard
                icon={TrendingUp}
                label="Ventas totales"
                value={String(supervisorQuery.data.totalSales)}
                hint="Valor reportado por el endpoint"
                tone="success"
              />
            </div>
          ) : null}

          {healthQuery.data !== undefined ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Salud del marketplace
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4 text-sm">
                <Badge variant="success">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  {healthQuery.data.status}
                </Badge>
                <span className="text-muted-foreground tabular-nums">
                  Uptime reportado: {healthQuery.data.uptime}%
                </span>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      {isAdmin ? (
        <Alert variant="info" title="Rol Administrador">
          Las funciones de supervisión (dashboard operativo y salud) requieren una sesión
          con rol SUPERVISOR.
        </Alert>
      ) : null}
    </div>
  );
}
