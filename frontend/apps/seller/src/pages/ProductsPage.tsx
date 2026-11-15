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
  getSellerProfile,
  publishProduct,
  searchCatalog,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import type { CatalogProduct } from '@nexus/shared';
import { PackagePlus, PackageSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: getSellerProfile,
  });

  const catalogQuery = useQuery({
    queryKey: ['catalog', 'seller-products'],
    queryFn: () => searchCatalog({ page: 1, limit: 200 }),
  });

  const sellerId = profileQuery.data?.sellerId;

  const products = useMemo<CatalogProduct[]>(() => {
    const all = catalogQuery.data?.products ?? [];
    if (sellerId === undefined) {
      return [];
    }
    return all.filter((product) => product.seller.sellerId === sellerId);
  }, [catalogQuery.data, sellerId]);

  const publish = useMutation({
    mutationFn: (productId: string) => publishProduct(productId),
    onSuccess: (response) => {
      setActionError(null);
      setActionMessage(
        `Producto ${response.productId.slice(0, 8)}… publicado (${response.status}).`,
      );
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: (error) => {
      setActionMessage(null);
      setActionError(toApiError(error).message);
    },
  });

  const isLoading = profileQuery.isLoading || catalogQuery.isLoading;
  const firstError = profileQuery.error ?? catalogQuery.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis productos"
        description="Vista derivada del catálogo público filtrado por tu sellerId."
        actions={
          <Link to="/products/new">
            <Button>
              <PackagePlus className="h-4 w-4" /> Nuevo producto
            </Button>
          </Link>
        }
      />

      <Alert variant="info" title="Contrato real">
        No existe <code>GET /seller/products</code>: el listado combina el catálogo
        público con tu <code>sellerId</code>. El backend incluye productos en estado
        distinto de <em>Published</em> y no expone edición ni borrado.
      </Alert>

      {actionMessage !== null ? (
        <Alert variant="success">{actionMessage}</Alert>
      ) : null}
      {actionError !== null ? <Alert variant="error">{actionError}</Alert> : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {firstError !== null && firstError !== undefined ? (
        <ErrorState
          error={firstError}
          onRetry={() => {
            void profileQuery.refetch();
            void catalogQuery.refetch();
          }}
        />
      ) : null}

      {!isLoading && (firstError === null || firstError === undefined) && products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-10 w-10" />}
          title="Aún no tienes productos en el catálogo"
          description="Los borradores recién creados pueden no aparecer hasta que el catálogo los devuelva. Crea un producto para comenzar."
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
                <TableCell>{product.category}</TableCell>
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
