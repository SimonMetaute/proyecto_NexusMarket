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
  getAdminDashboard,
  getSupervisorDashboard,
  getSupervisorHealth,
  formatMoney,
  useAuth,
} from '@nexus/shared';
import {
  Activity,
  Package,
  RotateCcw,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

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
      />

      {isSupervisor ? (
        <Alert variant="info" title="Dashboard de supervisor en modo resumen">
          El endpoint <code>/supervisor/dashboard</code> sigue devolviendo el resumen
          básico; los KPIs completos están disponibles en{' '}
          <code>/admin/dashboard</code> para sesiones administradoras.
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Órdenes activas"
            value={String(adminQuery.data.activeOrders)}
          />
          <Metric
            icon={<TrendingUp className="h-4 w-4" />}
            label="Ventas totales"
            value={formatMoney(adminQuery.data.totalSales)}
          />
          <Metric
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Órdenes totales"
            value={String(adminQuery.data.totalOrders)}
          />
          <Metric
            icon={<Users className="h-4 w-4" />}
            label="Usuarios"
            value={String(adminQuery.data.totalUsers)}
          />
          <Metric
            icon={<Store className="h-4 w-4" />}
            label="Vendedores"
            value={String(adminQuery.data.totalSellers)}
          />
          <Metric
            icon={<Package className="h-4 w-4" />}
            label="Productos"
            value={String(adminQuery.data.totalProducts)}
          />
          <Metric
            icon={<Package className="h-4 w-4" />}
            label="Publicados"
            value={String(adminQuery.data.publishedProducts)}
          />
          <Metric
            icon={<RotateCcw className="h-4 w-4" />}
            label="Devoluciones pendientes"
            value={String(adminQuery.data.pendingReturns)}
          />
        </div>
      ) : null}

      {isSupervisor ? (
        <>
          {supervisorQuery.data !== undefined ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                icon={<ShoppingCart className="h-4 w-4" />}
                label="Órdenes activas"
                value={String(supervisorQuery.data.activeOrders)}
              />
              <Metric
                icon={<TrendingUp className="h-4 w-4" />}
                label="Ventas totales"
                value={String(supervisorQuery.data.totalSales)}
              />
            </div>
          ) : null}

          {healthQuery.data !== undefined ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Salud del marketplace
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4 text-sm">
                <Badge variant="success">{healthQuery.data.status}</Badge>
                <span className="text-muted-foreground">
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

function Metric({
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
