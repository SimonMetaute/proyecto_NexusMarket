import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  FormField,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  approveSeller,
  formatDate,
  listAdminUsers,
  rejectSeller,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import type { AdminUserFilters } from '@nexus/shared';
import { Users } from 'lucide-react';
import { useState } from 'react';

const ROLES = [
  '',
  'BUYER',
  'SELLER',
  'ADMINISTRATOR',
  'SUPERVISOR',
  'LOGISTICS_OPERATOR',
];

const STATUSES = ['', 'Active', 'Inactive', 'Blocked', 'PendingVerification'];

export function UsersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminUserFilters>({});
  const [sellerId, setSellerId] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => listAdminUsers(filters),
  });

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const approve = useMutation({
    mutationFn: () => approveSeller(sellerId.trim()),
    onSuccess: (response) => {
      setError(null);
      setMessage(
        `Vendedor ${response.sellerId} → ${response.verificationStatus}.`,
      );
      void invalidate();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const reject = useMutation({
    mutationFn: () => rejectSeller(sellerId.trim(), reason),
    onSuccess: (response) => {
      setError(null);
      setMessage(
        `Vendedor ${response.sellerId} → ${response.verificationStatus}.`,
      );
      void invalidate();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Cuentas reales, filtros por rol/estado y aprobación de vendedores."
      />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <FormField label="Rol" htmlFor="roleFilter">
            <Select
              id="roleFilter"
              value={filters.role ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  role: event.target.value === '' ? undefined : event.target.value,
                }))
              }
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role === '' ? 'Todos' : role}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Estado" htmlFor="statusFilter">
            <Select
              id="statusFilter"
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status:
                    event.target.value === '' ? undefined : event.target.value,
                }))
              }
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === '' ? 'Todos' : status}
                </option>
              ))}
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aprobar o rechazar vendedor por ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Seller ID" htmlFor="sellerId">
              <Input
                id="sellerId"
                value={sellerId}
                onChange={(event) => setSellerId(event.target.value)}
                placeholder="UUID del vendedor"
              />
            </FormField>
            <FormField label="Motivo de rechazo (opcional)" htmlFor="reason">
              <Input
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Documentación incompleta"
              />
            </FormField>
          </div>
          <div className="flex gap-2">
            <Button
              loading={approve.isPending}
              disabled={sellerId.trim().length === 0}
              onClick={() => approve.mutate()}
            >
              Aprobar
            </Button>
            <Button
              variant="destructive"
              loading={reject.isPending}
              disabled={sellerId.trim().length === 0 || reason.trim().length === 0}
              onClick={() => reject.mutate()}
            >
              Rechazar
            </Button>
          </div>
        </CardContent>
      </Card>

      {usersQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {usersQuery.isError ? (
        <ErrorState
          error={usersQuery.error}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : null}

      {usersQuery.data !== undefined && usersQuery.data.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Sin usuarios para estos filtros"
          description="Ajusta el rol o el estado, o provisiona un vendedor desde Onboarding."
        />
      ) : null}

      {usersQuery.data !== undefined && usersQuery.data.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Directorio</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {usersQuery.data.length} usuarios
            </span>
          </div>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.data.map((user) => (
              <TableRow key={user.userId}>
                <TableCell>
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    #{user.userId.slice(0, 8)}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  {user.registrationDate !== undefined
                    ? formatDate(user.registrationDate)
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </>
      ) : null}
    </div>
  );
}
