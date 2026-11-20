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
  FormField,
  Input,
  PageHeader,
  Select,
  Skeleton,
  addProductImage,
  deleteProductImage,
  formatMoney,
  listProductImages,
  listSellerProducts,
  publishProduct,
  statusVariant,
  toApiError,
  updateSellerProduct,
} from '@nexus/shared';
import type { SellerProduct, UpdateProductRequest } from '@nexus/shared';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

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
];

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  sku: string;
  brand: string;
  category: string;
  basePrice: string;
}

function toForm(product: SellerProduct): ProductForm {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
    sku: product.sku ?? '',
    brand: product.brand ?? '',
    category: product.category ?? '',
    basePrice: product.basePrice !== undefined ? String(product.basePrice) : '',
  };
}

export function EditProductPage() {
  const { productId = '' } = useParams();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  const productsQuery = useQuery({
    queryKey: ['seller', 'products'],
    queryFn: listSellerProducts,
  });

  const product = productsQuery.data?.find(
    (candidate) => candidate.productId === productId,
  );

  useEffect(() => {
    if (product !== undefined) {
      setForm(toForm(product));
    }
  }, [product]);

  const imagesQuery = useQuery({
    queryKey: ['seller', 'product-images', productId],
    queryFn: () => listProductImages(productId),
    enabled: productId.length > 0,
  });

  const refresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    await queryClient.invalidateQueries({
      queryKey: ['seller', 'product-images', productId],
    });
    await queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['catalog'] });
  };

  const save = useMutation({
    mutationFn: (payload: UpdateProductRequest) =>
      updateSellerProduct(productId, payload),
    onSuccess: () => {
      setError(null);
      setMessage('Cambios guardados.');
      void refresh();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const publish = useMutation({
    mutationFn: () => publishProduct(productId),
    onSuccess: (response) => {
      setError(null);
      setMessage(`Producto publicado: ${response.status}.`);
      void refresh();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const addImage = useMutation({
    mutationFn: (url: string) => addProductImage(productId, { url }),
    onSuccess: () => {
      setError(null);
      setMessage('Imagen agregada.');
      setImageUrl('');
      void refresh();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const removeImage = useMutation({
    mutationFn: (imageId: string) => deleteProductImage(productId, imageId),
    onSuccess: () => {
      setError(null);
      setMessage('Imagen eliminada.');
      void refresh();
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const update = <K extends keyof ProductForm>(field: K, value: ProductForm[K]): void =>
    setForm((current) => (current === null ? current : { ...current, [field]: value }));

  return (
    <div className="space-y-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a productos
      </Link>

      <PageHeader title="Editar producto" description={productId} />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      {productsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {productsQuery.isError ? (
        <ErrorState
          error={productsQuery.error}
          onRetry={() => void productsQuery.refetch()}
        />
      ) : null}

      {!productsQuery.isLoading && product === undefined ? (
        <Alert variant="error" title="Producto no encontrado">
          No existe un producto con ese ID entre tus productos.
        </Alert>
      ) : null}

      {product !== undefined && form !== null ? (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{product.name}</CardTitle>
              <Badge variant={statusVariant(product.productStatus)}>
                {product.productStatus}
              </Badge>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const payload: UpdateProductRequest = {
                    name: form.name,
                    description: form.description,
                    price: Number.parseFloat(form.price),
                    stock: Number.parseInt(form.stock, 10),
                    sku: form.sku,
                    brand: form.brand,
                  };
                  if (form.category.length > 0) {
                    payload.category = form.category;
                  }
                  if (form.basePrice.length > 0) {
                    payload.basePrice = Number.parseFloat(form.basePrice);
                  }
                  save.mutate(payload);
                }}
              >
                <FormField label="Nombre" htmlFor="name">
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                  />
                </FormField>
                <FormField label="SKU" htmlFor="sku">
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(event) => update('sku', event.target.value)}
                    placeholder="Obligatorio para publicar"
                  />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="Descripción" htmlFor="description">
                    <Input
                      id="description"
                      required
                      value={form.description}
                      onChange={(event) => update('description', event.target.value)}
                    />
                  </FormField>
                </div>
                <FormField label="Categoría" htmlFor="category">
                  <Select
                    id="category"
                    value={form.category}
                    onChange={(event) => update('category', event.target.value)}
                  >
                    <option value="">Sin categoría</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Marca" htmlFor="brand">
                  <Input
                    id="brand"
                    value={form.brand}
                    onChange={(event) => update('brand', event.target.value)}
                  />
                </FormField>
                <FormField label="Precio" htmlFor="price">
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(event) => update('price', event.target.value)}
                  />
                </FormField>
                <FormField label="Precio base" htmlFor="basePrice">
                  <Input
                    id="basePrice"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.basePrice}
                    onChange={(event) => update('basePrice', event.target.value)}
                  />
                </FormField>
                <FormField label="Stock" htmlFor="stock">
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    required
                    value={form.stock}
                    onChange={(event) => update('stock', event.target.value)}
                  />
                </FormField>
                <div className="flex items-end">
                  <Button type="submit" loading={save.isPending}>
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4" /> Imágenes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  addImage.mutate(imageUrl.trim());
                }}
              >
                <div className="flex-1">
                  <FormField label="URL de la imagen" htmlFor="imageUrl">
                    <Input
                      id="imageUrl"
                      type="url"
                      required
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder="https://..."
                    />
                  </FormField>
                </div>
                <Button
                  type="submit"
                  loading={addImage.isPending}
                  disabled={imageUrl.trim().length === 0}
                >
                  Agregar
                </Button>
              </form>

              {imagesQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : null}
              {imagesQuery.isError ? (
                <ErrorState
                  error={imagesQuery.error}
                  onRetry={() => void imagesQuery.refetch()}
                />
              ) : null}

              {imagesQuery.data !== undefined && imagesQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin imágenes. Se requiere al menos una para publicar.
                </p>
              ) : null}

              {imagesQuery.data !== undefined && imagesQuery.data.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {imagesQuery.data.map((image) => (
                    <li
                      key={image.imageId}
                      className="overflow-hidden rounded-xl border border-[#D9DADC]/12"
                    >
                      <img
                        src={image.url}
                        alt={image.altText ?? product.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="flex items-center justify-between gap-2 p-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {image.imageId}
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          loading={
                            removeImage.isPending &&
                            removeImage.variables === image.imageId
                          }
                          onClick={() => removeImage.mutate(image.imageId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Precio actual: <strong>{formatMoney(product.price)}</strong> · SKU:{' '}
                <strong>{product.sku ?? 'sin definir'}</strong> · Imágenes:{' '}
                <strong>{imagesQuery.data?.length ?? 0}</strong>
              </p>
              {product.productStatus !== 'Published' ? (
                <Button
                  loading={publish.isPending}
                  onClick={() => publish.mutate()}
                  disabled={
                    (imagesQuery.data?.length ?? 0) === 0 ||
                    (product.sku ?? '').length === 0
                  }
                >
                  Publicar producto
                </Button>
              ) : (
                <Alert variant="success">El producto ya está publicado.</Alert>
              )}
              <p className="text-xs text-muted-foreground">
                Publicar requiere SKU y al menos una imagen; el backend responde
                <code> 422</code> con el campo faltante si no se cumple.
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
