import { searchCatalog } from '@nexus/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * El contrato del carrito sólo devuelve `productId`; el catálogo público es la
 * única fuente real de nombres y precios de referencia. Sin datos inventados.
 */
export function useProductLookup(enabled: boolean) {
  const query = useQuery({
    queryKey: ['catalog', 'lookup'],
    queryFn: () => searchCatalog({ page: 1, limit: 200 }),
    enabled,
    staleTime: 60_000,
  });

  const byId = useMemo(() => {
    const map = new Map<string, { name: string; price: number; imageUrl?: string }>();
    for (const product of query.data?.products ?? []) {
      map.set(product.productId, {
        name: product.name,
        price: product.price,
        imageUrl: product.images !== undefined && product.images.length > 0
          ? product.images[0].url
          : undefined,
      });
    }
    return map;
  }, [query.data]);

  return { byId, isLoading: query.isLoading, error: query.error };
}
