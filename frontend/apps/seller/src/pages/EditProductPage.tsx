import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  Input,
  PageHeader,
  Skeleton,
  formatMoney,
  getProduct,
  publishProduct,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export function EditProductPage() {
  const { productId = '' } = useParams();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ['catalog', 'product', productId],
    queryFn: () => getProduct(productId),
    enabled: productId.length > 0,
  });

  const publish = useMutation({
    mutationFn: () => publishProduct(productId),
    onSuccess: (response) => {
      setError(null);
      setMessage(`Producto publicado: ${response.status}.`);
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  return (
    <div className="space-y-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a productos
      </Link>

      <PageHeader title="Detalle del producto" description={productId} />

      <Alert variant="warning" title="Edición no disponible en el backend">
        El contrato real no expone <code>PUT/PATCH /seller/products/:id</code>. Los
        campos se muestran en solo lectura para no simular una edición inexistente. La
        única acción soportada es publicar.
      </Alert>

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      {productQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {productQuery.isError ? (
        <ErrorState
          error={productQuery.error}
          onRetry={() => void productQuery.refetch()}
        />
      ) : null}

      {productQuery.data !== undefined ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{productQuery.data.name}</CardTitle>
            <Badge variant={statusVariant(productQuery.data.productStatus)}>
              {productQuery.data.productStatus}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Descripción" value={productQuery.data.description} />
            <ReadOnlyField label="Categoría" value={productQuery.data.category} />
            <ReadOnlyField label="SKU" value={productQuery.data.sku ?? '—'} />
            <ReadOnlyField label="Marca" value={productQuery.data.brand ?? '—'} />
            <ReadOnlyField
              label="Precio"
              value={formatMoney(productQuery.data.price)}
            />
            <ReadOnlyField
              label="Stock"
              value={`${productQuery.data.stock} unidades`}
            />
            <div className="sm:col-span-2">
              <ReadOnlyField
                label="Seller ID"
                value={productQuery.data.seller.sellerId}
              />
            </div>

            {productQuery.data.productStatus !== 'Published' ? (
              <div className="sm:col-span-2">
                <Button loading={publish.isPending} onClick={() => publish.mutate()}>
                  Publicar producto
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Input value={value} readOnly disabled />
    </div>
  );
}
