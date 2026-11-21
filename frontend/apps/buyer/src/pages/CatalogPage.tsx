import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  formatMoney,
  searchCatalog,
  statusVariant,
} from '@nexus/shared';
import type { CatalogQuery } from '@nexus/shared';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Package,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

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
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  const [draft, setDraft] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: urlSearch,
  });
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: urlSearch,
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (urlSearch.length === 0) {
      return;
    }
    setDraft((current) => ({ ...current, search: urlSearch }));
    setFilters((current) => ({ ...current, search: urlSearch }));
    setPage(1);
  }, [urlSearch]);

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

  const applySearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const next = { ...draft, search: draft.search.trim() };
    setDraft(next);
    setFilters(next);
    setPage(1);
  };

  const applyCategory = (category: string): void => {
    const next = { ...filters, category };
    setDraft(next);
    setFilters(next);
    setPage(1);
  };

  const resetFilters = (): void => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const totalPages =
    data === undefined ? 1 : Math.max(1, Math.ceil(data.total / data.limit));

  const hasFilters =
    filters.search.length > 0 ||
    filters.category.length > 0 ||
    filters.minPrice.length > 0 ||
    filters.maxPrice.length > 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#171717]/10 bg-deep">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-primary/[0.13] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" />

        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Catálogo en vivo
            </span>
            <div className="space-y-3">
              <h1 className="text-balance text-3xl font-bold leading-[1.08] tracking-tight text-on-deep sm:text-4xl lg:text-[2.75rem]">
                Encuentra exactamente
                <br />
                <span className="text-primary">lo que necesitas.</span>
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-on-deep-muted">
                Productos publicados por vendedores verificados. Precios, stock y
                disponibilidad confirmados por el servidor.
              </p>
            </div>

            <form onSubmit={applySearch} role="search" className="max-w-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-deep-muted" />
                <input
                  type="search"
                  value={draft.search}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder="¿Qué estás buscando?"
                  aria-label="Buscar productos"
                  className="h-14 w-full rounded-2xl border border-[#f7f6f2]/15 bg-[#f7f6f2]/[0.07] pl-12 pr-36 text-base text-on-deep placeholder:text-on-deep-muted/80 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)] transition-all duration-200 focus:border-primary/60 focus:bg-[#f7f6f2]/[0.1] focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  loading={isFetching && !isLoading}
                >
                  Buscar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-deep-muted">
              <span className="uppercase tracking-[0.14em]">Populares:</span>
              {CATEGORIES.slice(0, 4).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => applyCategory(category)}
                  className="rounded-full border border-[#f7f6f2]/15 bg-[#f7f6f2]/[0.06] px-3 py-1 font-medium text-on-deep-muted transition-colors hover:border-primary/50 hover:bg-[#f7f6f2]/[0.1] hover:text-on-deep"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="animate-float-slow rounded-2xl border border-[#171717]/12 bg-card/80 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Productos encontrados
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {data === undefined ? '—' : data.total}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-px bg-[#171717]/10" />
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Categoría</p>
                  <p className="mt-0.5 truncate font-semibold text-foreground">
                    {filters.category.length > 0 ? filters.category : 'Todas'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Página</p>
                  <p className="mt-0.5 font-semibold text-foreground tabular-nums">
                    {data?.page ?? page} / {totalPages}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterPill
          active={filters.category.length === 0}
          onClick={() => applyCategory('')}
        >
          Todas
        </FilterPill>
        {CATEGORIES.map((category) => (
          <FilterPill
            key={category}
            active={filters.category === category}
            onClick={() => applyCategory(category)}
          >
            {category}
          </FilterPill>
        ))}
      </div>

      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-[#171717]/10 bg-card p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 pb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4 text-[#171717]/60" /> Rango de precio
          </div>
          <div className="w-32 space-y-1.5">
            <label htmlFor="minPrice" className="text-[11px] text-muted-foreground">
              Mínimo
            </label>
            <Input
              id="minPrice"
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              value={draft.minPrice}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  minPrice: event.target.value,
                }))
              }
            />
          </div>
          <div className="w-32 space-y-1.5">
            <label htmlFor="maxPrice" className="text-[11px] text-muted-foreground">
              Máximo
            </label>
            <Input
              id="maxPrice"
              type="number"
              min={0}
              step="0.01"
              placeholder="∞"
              value={draft.maxPrice}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxPrice: event.target.value,
                }))
              }
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button type="submit" loading={isFetching && !isLoading}>
              Aplicar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={!hasFilters}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </form>

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-2xl border border-[#171717]/10 bg-card p-4"
            >
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && data !== undefined && data.products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-5 w-5" />}
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="tabular-nums">
              <strong className="font-semibold text-foreground">
                {data.total}
              </strong>{' '}
              producto{data.total === 1 ? '' : 's'} · página {data.page} de{' '}
              {totalPages}
            </span>
            {isFetching ? (
              <span className="text-xs text-accent-foreground">Actualizando…</span>
            ) : null}
          </div>

          <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product) => {
              const inStock = product.stock > 0 && product.productStatus !== 'OutOfStock';
              return (
                <article
                  key={product.productId}
                  className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-[#171717]/10 bg-card"
                >
                  <Link
                    to={`/products/${product.productId}`}
                    className="relative flex h-44 items-center justify-center overflow-hidden bg-[#f7f6f2]/[0.04]"
                    aria-label={`Ver ${product.name}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,90,36,0.10),transparent_55%)]" />
                    <Package className="h-16 w-16 text-[#171717]/20 transition-transform duration-500 ease-smooth group-hover:scale-110 group-hover:text-[#171717]/40" />
                    <span className="absolute left-3 top-3">
                      <Badge variant={inStock ? 'success' : 'destructive'}>
                        <span
                          className={
                            inStock
                              ? 'h-1.5 w-1.5 rounded-full bg-emerald-700'
                              : 'h-1.5 w-1.5 rounded-full bg-red-700'
                          }
                        />
                        {inStock ? `${product.stock} en stock` : 'Sin stock'}
                      </Badge>
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {product.category}
                      </span>
                      <Badge variant={statusVariant(product.productStatus)}>
                        {product.productStatus}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent-foreground">
                        <Link to={`/products/${product.productId}`}>
                          {product.name}
                        </Link>
                      </h2>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-auto space-y-3 pt-1">
                      {product.sku !== undefined ? (
                        <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                          SKU {product.sku}
                        </p>
                      ) : null}
                      <p className="text-2xl font-bold tracking-tight text-accent-foreground tabular-nums">
                        {formatMoney(product.price)}
                      </p>
                      <Link
                        to={`/products/${product.productId}`}
                        className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#171717]/15 bg-[#f7f6f2]/[0.04] text-xs font-semibold text-foreground transition-all duration-200 hover:border-[#c4c0b5] hover:bg-[#f7f6f2]/[0.08] hover:text-accent-foreground-hover"
                      >
                        Ver producto
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#171717]/10 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'shrink-0 rounded-full border border-primary/40 bg-primary/[0.12] px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors'
          : 'shrink-0 rounded-full border border-[#171717]/12 bg-[#f7f6f2]/[0.03] px-4 py-1.5 text-xs font-medium text-[#171717]/60 transition-colors hover:border-[#171717]/20 hover:text-foreground'
      }
    >
      {children}
    </button>
  );
}
