import {
  Alert,
  EmptyState,
  PageHeader,
} from '@nexus/shared';
import { FileClock } from 'lucide-react';

export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Consola de auditoría"
        description="Registros persistidos en MongoDB (audit_db.audit_logs)."
      />

      <Alert variant="warning" title="Sin endpoint de lectura de auditoría">
        El backend escribe eventos en MongoDB (por ejemplo <code>USER_LOGOUT</code>,
        creación de productos y movimientos de stock), pero no expone ninguna ruta para
        consultarlos. Esta consola no puede mostrar datos reales todavía.
      </Alert>

      <EmptyState
        icon={<FileClock className="h-10 w-10" />}
        title="No hay fuente de datos disponible"
        description="Cuando el backend publique un endpoint de auditoría (con filtros por actor, evento y fecha), esta vista se conectará a él. No se usan registros simulados."
      />
    </div>
  );
}
