import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  formatMoney,
  searchCatalog,
  statusVariant,
} from '@nexus/shared';
import type { CatalogQuery } from '@nexus/shared';
import { PackageSearch, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'Electronics',
  'Home',
  'Clothing and Accessories',
  'Beauty',
  'Sports',
  'Toys',
  'Office',
  'Hardware',
  'Automotive',
  'Other',
] as const;

const PAGE_SIZE = 12;

interface Filters {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
};

export function CatalogPage() {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const query: CatalogQuery = {
    page,
    limit: PAGE_SIZE,
    ...(filters.search.length > 0 ? { search: filters.search } : {}),
    ...(filters.category.length > 0 ? { category: filters.category } : {}),
    ...(filters.minPrice.length > 0
      ? { minPrice: Number(filters.minPrice) }
      : {}),
    ...(filters.maxPrice.length > 0
      ? { maxPrice: Number(filters.maxPrice) }
      : {}),
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['catalog', query],
    queryFn: () => searchCatalog(query),
    placeholderData: keepPreviousData,
  });

  const applyFilters = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPage(1);
    setFilters(draft);
  };

  const resetFilters = (): void => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const totalPages =
    data === undefined ? 1 : Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo"
        description="Explora los productos publicados disponibles en NexusMarket."
      />

      <form
        onSubmit={applyFilters}
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-1.5 lg:col-span-2">
          <label htmlFor="search" className="text-xs font-medium text-muted-foreground">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              className="pl-9"
              placeholder="Nombre o descripción"
              value={draft.search}
              onChange={(event) =>
                setDraft((current) => ({ ...current, search: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="category" className="text-xs font-medium text-muted-foreground">
            Categoría
          </label>
          <Select
            id="category"
            value={draft.category}
            onChange={(event) =>
              setDraft((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="">Todas</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="minPrice" className="text-xs font-medium text-muted-foreground">
            Precio mín.
          </label>
          <Input
            id="minPrice"
            type="number"
            min={0}
            step="0.01"
            value={draft.minPrice}
            onChange={(event) =>
              setDraft((current) => ({ ...current, minPrice: event.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="maxPrice" className="text-xs font-medium text-muted-foreground">
            Precio máx.
          </label>
          <Input
            id="maxPrice"
            type="number"
            min={0}
            step="0.01"
            value={draft.maxPrice}
            onChange={(event) =>
              setDraft((current) => ({ ...current, maxPrice: event.target.value }))
            }
          />
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" loading={isFetching && !isLoading}>
            Aplicar filtros
          </Button>
          <Button type="button" variant="outline" onClick={resetFilters}>
            Limpiar
          </Button>
        </div>
      </form>

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && data !== undefined && data.products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-10 w-10" />}
          title="No encontramos productos"
          description="Ajusta los filtros o busca otro término. El listado proviene directamente del catálogo del backend."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          }
        />
      ) : null}

      {data !== undefined && data.products.length > 0 ? (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.total} producto{data.total === 1 ? '' : 's'} · página {data.page} de{' '}
              {totalPages}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product) => (
              <article
                key={product.productId}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex h-32 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  Sin imagen en el contrato
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{product.category}</Badge>
                  <Badge variant={statusVariant(product.productStatus)}>
                    {product.productStatus}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h2 className="line-clamp-2 font-medium">{product.name}</h2>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {product.description}
                  </p>
                  {product.sku !== undefined ? (
                    <p className="text-xs text-muted-foreground">SKU {product.sku}</p>
                  ) : null}
                </div>
                <div className="mt-auto space-y-2">
                  <p className="text-lg font-semibold">{formatMoney(product.price)}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Stock: {product.stock}
                    </span>
                    <Link
                      to={`/products/${product.productId}`}
                      className="font-medium text-accent-foreground hover:underline"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
