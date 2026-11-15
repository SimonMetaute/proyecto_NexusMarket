import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  confirmDelivery,
  dispatchShipment,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import type { ShipmentActionResponse } from '@nexus/shared';
import { ArrowLeft, PackageCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export function ShipmentPage() {
  const { orderId = '' } = useParams();
  const queryClient = useQueryClient();
  const [shipmentId, setShipmentId] = useState(orderId);
  const [result, setResult] = useState<ShipmentActionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['logistics', 'shipments'] });
  };

  const dispatch = useMutation({
    mutationFn: () => dispatchShipment(shipmentId.trim()),
    onSuccess: (response) => {
      setResult(response);
      setError(null);
      void refresh();
    },
    onError: (caught) => {
      setResult(null);
      setError(toApiError(caught).message);
    },
  });

  const confirm = useMutation({
    mutationFn: () => confirmDelivery(shipmentId.trim()),
    onSuccess: (response) => {
      setResult(response);
      setError(null);
      void refresh();
    },
    onError: (caught) => {
      setResult(null);
      setError(toApiError(caught).message);
    },
  });

  return (
    <div className="space-y-6">
      <Link
        to="/dispatch-queue"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a la cola
      </Link>

      <PageHeader
        title="Gestión de envío"
        description="Despacho y confirmación de entrega por identificador de envío."
      />

      <Alert variant="info" title="Identificador del envío">
        El backend opera con <code>shipmentId</code>. La cola de despacho ahora lista
        los envíos reales y enlaza aquí con el identificador correcto. También puedes
        introducirlo manualmente.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="shipmentId" className="text-sm font-medium">
              Shipment ID
            </label>
            <Input
              id="shipmentId"
              value={shipmentId}
              onChange={(event) => setShipmentId(event.target.value)}
              placeholder="UUID del envío"
            />
          </div>

          {error !== null ? <Alert variant="error">{error}</Alert> : null}

          {result !== null ? (
            <Alert variant="success" title="Estado devuelto por el backend">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{result.shipmentId}</span>
                <Badge variant={statusVariant(result.shipmentStatus)}>
                  {result.shipmentStatus}
                </Badge>
              </div>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              loading={dispatch.isPending}
              disabled={shipmentId.trim().length === 0}
              onClick={() => dispatch.mutate()}
            >
              <Truck className="h-4 w-4" /> Despachar
            </Button>
            <Button
              variant="outline"
              loading={confirm.isPending}
              disabled={shipmentId.trim().length === 0}
              onClick={() => confirm.mutate()}
            >
              <PackageCheck className="h-4 w-4" /> Confirmar entrega
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            El backend valida el flujo secuencial y responde 404 si el envío no existe.
            No se infiere ni se simula ningún estado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
