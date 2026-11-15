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
  formatDate,
  listAuditLogs,
} from '@nexus/shared';
import type { AuditLogQuery } from '@nexus/shared';
import { FileClock } from 'lucide-react';
import { useState } from 'react';

const PAGE_SIZE = 20;

export function AuditLogsPage() {
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const query: AuditLogQuery = {
    page,
    limit: PAGE_SIZE,
    ...(actorId.trim().length > 0 ? { actorId: actorId.trim() } : {}),
    ...(action.trim().length > 0 ? { action: action.trim() } : {}),
    ...(from.length > 0 ? { from: new Date(from).toISOString() } : {}),
    ...(to.length > 0 ? { to: new Date(to).toISOString() } : {}),
  };

  const logsQuery = useQuery({
    queryKey: ['admin', 'audit-logs', query],
    queryFn: () => listAuditLogs(query),
  });

  const total = logsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consola de auditoría"
        description="Registros persistidos en MongoDB (audit_db.audit_logs), paginados y filtrables."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Actor (userId)" htmlFor="actorId">
            <Input
              id="actorId"
              value={actorId}
              onChange={(event) => {
                setActorId(event.target.value);
                setPage(1);
              }}
              placeholder="UUID"
            />
          </FormField>
          <FormField label="Acción" htmlFor="action">
            <Input
              id="action"
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
              placeholder="USER_LOGIN"
            />
          </FormField>
          <FormField label="Desde" htmlFor="from">
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />
          </FormField>
          <FormField label="Hasta" htmlFor="to">
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />
          </FormField>
        </CardContent>
      </Card>

      {logsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {logsQuery.isError ? (
        <ErrorState
          error={logsQuery.error}
          onRetry={() => void logsQuery.refetch()}
        />
      ) : null}

      {logsQuery.data !== undefined && logsQuery.data.items.length === 0 ? (
        <EmptyState
          icon={<FileClock className="h-10 w-10" />}
          title="Sin eventos para estos filtros"
          description="Ajusta los criterios o limpia los campos para ver el historial completo."
        />
      ) : null}

      {logsQuery.data !== undefined && logsQuery.data.items.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQuery.data.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.actorId}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <code className="block truncate text-xs">
                      {JSON.stringify(log.details)}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {total} evento(s) · página {logsQuery.data.page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Alert variant="info" title="Solo lectura">
        La auditoría es append-only: este portal no expone mutaciones sobre los
        eventos registrados.
      </Alert>
    </div>
  );
}
