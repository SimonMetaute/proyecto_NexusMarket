import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatMoney,
  listSellerProducts,
  publishProduct,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import { PackagePlus, PackageSearch } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ['seller', 'products'],
    queryFn: listSellerProducts,
  });

  const publish = useMutation({
    mutationFn: (productId: string) => publishProduct(productId),
    onSuccess: (response) => {
      setActionError(null);
      setActionMessage(
        `Producto ${response.productId.slice(0, 8)}… publicado (${response.status}).`,
      );
      void queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      void queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: (error) => {
      setActionMessage(null);
      setActionError(toApiError(error).message);
    },
  });

  const products = productsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis productos"
        description="Productos propios, incluidos borradores. Publicar exige SKU y al menos una imagen."
        actions={
          <Link to="/products/new">
            <Button>
              <PackagePlus className="h-4 w-4" /> Nuevo producto
            </Button>
          </Link>
        }
      />

      <Alert variant="info" title="Regla de publicación">
        El backend valida que el producto tenga SKU y al menos una imagen antes de
        publicarlo. Si falta alguno, responde <code>422</code> indicando el campo
        <code>sku</code> o <code>images</code>.
      </Alert>

      {actionMessage !== null ? (
        <Alert variant="success">{actionMessage}</Alert>
      ) : null}
      {actionError !== null ? <Alert variant="error">{actionError}</Alert> : null}

      {productsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {productsQuery.isError ? (
        <ErrorState
          error={productsQuery.error}
          onRetry={() => void productsQuery.refetch()}
        />
      ) : null}

      {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-10 w-10" />}
          title="Aún no tienes productos"
          description="Crea tu primer producto; se guardará como borrador hasta que lo publiques."
          action={
            <Link to="/products/new">
              <Button>Crear producto</Button>
            </Link>
          }
        />
      ) : null}

      {products.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.productId}>
                <TableCell>
                  <p className="font-medium">{product.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {product.productId}
                  </p>
                </TableCell>
                <TableCell>{product.sku ?? '—'}</TableCell>
                <TableCell>{product.category ?? '—'}</TableCell>
                <TableCell>{formatMoney(product.price)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(product.productStatus)}>
                    {product.productStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {product.productStatus !== 'Published' ? (
                      <Button
                        size="sm"
                        loading={
                          publish.isPending &&
                          publish.variables === product.productId
                        }
                        onClick={() => publish.mutate(product.productId)}
                      >
                        Publicar
                      </Button>
                    ) : null}
                    <Link to={`/products/${product.productId}/edit`}>
                      <Button size="sm" variant="outline">
                        Ver / editar
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
