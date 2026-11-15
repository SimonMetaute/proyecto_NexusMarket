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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  approveSeller,
  listAdminUsers,
  rejectSeller,
  toApiError,
} from '@nexus/shared';
import { UserX, Users } from 'lucide-react';
import { useState } from 'react';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [sellerId, setSellerId] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: listAdminUsers,
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
        description="Listado de cuentas y aprobación de vendedores."
      />

      <Alert variant="warning" title="Listado de usuarios no implementado en el backend">
        <code>GET /admin/users</code> devuelve siempre <code>[]</code> porque el
        repositorio no expone <code>findAll</code>. La tabla muestra el estado real
        (vacío), no datos inventados.
      </Alert>

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

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
          <p className="text-xs text-muted-foreground">
            El backend valida que el vendedor exista y que la transición sea válida;
            cualquier error se muestra con su mensaje original.
          </p>
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
          title="Sin usuarios para listar"
          description="La API no devuelve cuentas todavía. Usa el formulario superior si conoces el sellerId a aprobar."
        />
      ) : null}

      {usersQuery.data !== undefined && usersQuery.data.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.data.map((user) => (
              <TableRow key={user.userId}>
                <TableCell className="font-mono text-xs">{user.userId}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>{user.status ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <Alert variant="info" title="Suspender / activar cuentas">
        <span className="flex items-center gap-2">
          <UserX className="h-4 w-4" />
          El contrato real no expone endpoints para cambiar el estado de una cuenta
          desde este portal. La acción no se simula.
        </span>
      </Alert>
    </div>
  );
}
