import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Skeleton,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  formatMoney,
  listSellerProducts,
  publishProduct,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import {
  Boxes,
  FileEdit,
  PackagePlus,
  PackageSearch,
  Search,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const STATUS_FILTERS = ['', 'Published', 'Draft', 'OutOfStock'] as const;

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [term, setTerm] = useState('');

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
  const normalizedTerm = term.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const isOutOfStock = product.productStatus === 'OutOfStock' || product.stock === 0;
    const matchesStatus =
      statusFilter.length === 0 ||
      (statusFilter === 'OutOfStock' ? isOutOfStock : product.productStatus === statusFilter);
    const matchesTerm =
      normalizedTerm.length === 0 ||
      product.name.toLowerCase().includes(normalizedTerm) ||
      (product.sku ?? '').toLowerCase().includes(normalizedTerm);
    return matchesStatus && matchesTerm;
  });
  const publishedCount = products.filter(
    (product) => product.productStatus === 'Published',
  ).length;
  const draftCount = products.filter(
    (product) => product.productStatus === 'Draft',
  ).length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

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

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Productos"
          value={products.length}
          hint="Incluye borradores"
          tone="primary"
        />
        <StatCard
          icon={Sparkles}
          label="Publicados"
          value={publishedCount}
          hint="Visibles en el catálogo"
          tone="success"
        />
        <StatCard
          icon={FileEdit}
          label="Borradores"
          value={draftCount}
          hint="Pendientes de publicar"
          tone="warning"
        />
        <StatCard
          icon={Boxes}
          label="Stock agregado"
          value={totalStock}
          hint="Unidades en inventario"
          tone="info"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#171717]/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre o SKU…"
            aria-label="Buscar productos"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status.length === 0 ? 'all' : status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/[0.12] text-primary-foreground'
                    : 'border-[#171717]/12 bg-[#f7f6f2]/[0.03] text-[#171717]/60 hover:border-[#171717]/20 hover:text-foreground',
                )}
              >
                {status.length === 0 ? 'Todos' : status}
              </button>
            );
          })}
        </div>
      </div>

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

      {products.length > 0 && visibleProducts.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-5 w-5" />}
          title="Sin coincidencias"
          description="Ajusta el filtro de estado o el término de búsqueda."
        />
      ) : null}

      {visibleProducts.length > 0 ? (
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
            {visibleProducts.map((product) => (
              <TableRow key={product.productId}>
                <TableCell>
                  <p className="font-semibold text-foreground">{product.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    #{product.productId.slice(0, 8)}
                  </p>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {product.sku ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.category ?? '—'}
                </TableCell>
                <TableCell className="font-semibold text-accent-foreground tabular-nums">
                  {formatMoney(product.price)}
                </TableCell>
                <TableCell className="tabular-nums">{product.stock}</TableCell>
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
