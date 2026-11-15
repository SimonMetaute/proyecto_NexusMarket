import { Alert, EmptyState, PageHeader } from '@nexus/shared';
import { RotateCcw } from 'lucide-react';

export function ReturnsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoluciones"
        description="Bandeja de solicitudes de devolución para registrar su recepción física."
      />

      <Alert variant="warning" title="Funcionalidad no expuesta por el backend">
        No existe un endpoint de devoluciones (ni en comprador ni en logística). No se
        simulan solicitudes ni estados.
      </Alert>

      <EmptyState
        icon={<RotateCcw className="h-10 w-10" />}
        title="Sin solicitudes disponibles"
        description="Cuando el backend publique el recurso de devoluciones, esta bandeja mostrará las solicitudes reales."
      />
    </div>
  );
}
