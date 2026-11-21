import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
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
  Textarea,
  addProductImage,
  createProduct,
  createVariant,
  deleteProductImage,
  listProductImages,
  publishProduct,
  toApiError,
} from '@nexus/shared';
import type { CreateProductResponse, ProductImage } from '@nexus/shared';
import { ArrowLeft, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

export function NewProductPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    brand: '',
    category: 'Electronics',
  });
  const [created, setCreated] = useState<CreateProductResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        ...(form.sku.length > 0 ? { sku: form.sku } : {}),
        ...(form.brand.length > 0 ? { brand: form.brand } : {}),
        category: form.category,
      }),
    onSuccess: (response) => {
      setCreated(response);
      setError(null);
      setMessage('Producto creado en estado borrador.');
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: (caught) => {
      const apiError = toApiError(caught);
      setError(
        apiError.field !== undefined
          ? `${apiError.message} (campo: ${apiError.field})`
          : apiError.message,
      );
    },
  });

  const update = (field: keyof typeof form, value: string): void =>
    setForm((current) => ({ ...current, [field]: value }));

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    create.mutate();
  };

  return (
    <div className="space-y-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a productos
      </Link>

      <PageHeader
        title="Nuevo producto"
        description="El precio y el stock se envían al backend; no se calculan localmente."
      />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      {created === null ? (
        <Card>
          <CardHeader>
            <CardTitle>Datos del producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={onSubmit}
            >
              <div className="sm:col-span-2">
                <FormField label="Nombre" htmlFor="name">
                  <Input
                    id="name"
                    required
                    maxLength={200}
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField label="Descripción" htmlFor="description">
                  <Textarea
                    id="description"
                    required
                    value={form.description}
                    onChange={(event) => update('description', event.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Precio (USD)" htmlFor="price">
                <Input
                  id="price"
                  type="number"
                  min={0.01}
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(event) => update('price', event.target.value)}
                />
              </FormField>
              <FormField label="Stock inicial" htmlFor="stock">
                <Input
                  id="stock"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={form.stock}
                  onChange={(event) => update('stock', event.target.value)}
                />
              </FormField>
              <FormField label="SKU (opcional)" htmlFor="sku">
                <Input
                  id="sku"
                  maxLength={100}
                  value={form.sku}
                  onChange={(event) => update('sku', event.target.value)}
                />
              </FormField>
              <FormField label="Marca (opcional)" htmlFor="brand">
                <Input
                  id="brand"
                  maxLength={100}
                  value={form.brand}
                  onChange={(event) => update('brand', event.target.value)}
                />
              </FormField>
              <FormField label="Categoría" htmlFor="category">
                <Select
                  id="category"
                  value={form.category}
                  onChange={(event) => update('category', event.target.value)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="sm:col-span-2">
                <Button type="submit" loading={create.isPending}>
                  Crear producto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <CreatedProductPanel
          product={created}
          onMessage={(next) => {
            setMessage(next);
            setError(null);
          }}
          onError={(next) => {
            setError(next);
            setMessage(null);
          }}
        />
      )}
    </div>
  );
}

function CreatedProductPanel({
  product,
  onMessage,
  onError,
}: {
  product: CreateProductResponse;
  onMessage: (message: string) => void;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [variant, setVariant] = useState({
    attribute: '',
    value: '',
    additionalPrice: '',
    skuVariant: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(product.status === 'Published');

  const imagesQuery = useQuery({
    queryKey: ['seller', 'product-images', product.productId],
    queryFn: () => listProductImages(product.productId),
  });

  const refresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: ['seller', 'product-images', product.productId],
    });
    await queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    await queryClient.invalidateQueries({ queryKey: ['seller', 'dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['catalog'] });
  };

  const publish = useMutation({
    mutationFn: () => publishProduct(product.productId),
    onSuccess: (response) => {
      setPublished(true);
      onMessage(`Producto publicado: ${response.status}. ${response.message}`);
      void refresh();
      navigate('/products');
    },
    onError: (caught) => onError(toApiError(caught).message),
  });

  const addImage = useMutation({
    mutationFn: (url: string) => addProductImage(product.productId, { url }),
    onSuccess: () => {
      onMessage('Imagen agregada.');
      setImageUrl('');
      void refresh();
    },
    onError: (caught) => onError(toApiError(caught).message),
  });

  const removeImage = useMutation({
    mutationFn: (imageId: string) => deleteProductImage(product.productId, imageId),
    onSuccess: () => {
      onMessage('Imagen eliminada.');
      void refresh();
    },
    onError: (caught) => onError(toApiError(caught).message),
  });

  const addVariant = useMutation({
    mutationFn: () =>
      createVariant(product.productId, {
        variantId: globalThis.crypto.randomUUID(),
        attribute: variant.attribute,
        value: variant.value,
        additionalPrice: Number(variant.additionalPrice),
        skuVariant: variant.skuVariant,
      }),
    onSuccess: (response) => {
      onMessage(
        `Variante ${response.skuVariant} creada (${response.attribute}: ${response.value}).`,
      );
      setVariant({ attribute: '', value: '', additionalPrice: '', skuVariant: '' });
    },
    onError: (caught) => onError(toApiError(caught).message),
  });

  const update = (field: keyof typeof variant, value: string): void =>
    setVariant((current) => ({ ...current, [field]: value }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Producto creado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product ID</span>
            <span className="font-mono text-xs">{product.productId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre</span>
            <span className="font-medium">{product.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <span>{product.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">SKU</span>
            <span>{product.sku ?? '—'}</span>
          </div>
          <div className="pt-3">
            <Button
              className="w-full"
              loading={publish.isPending}
              disabled={
                 published ||
                 (imagesQuery.data?.length ?? 0) === 0 ||
                 (product.sku ?? '').length === 0
               }
              onClick={() => publish.mutate()}
            >
              {published ? 'Producto publicado' : 'Publicar producto'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Publicar exige vendedor verificado, SKU y al menos una imagen. Si el backend
              mensaje exacto.
            </p>
          </div>
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
              {imagesQuery.data.map((image: ProductImage) => (
                <li
                  key={image.imageId}
                  className="overflow-hidden rounded-xl border border-[#171717]/12"
                >
                  <img
                    src={image.url}
                    alt={product.name}
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
          <CardTitle>Agregar variante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Atributo" htmlFor="attribute">
              <Input
                id="attribute"
                required
                placeholder="Talla"
                value={variant.attribute}
                onChange={(event) => update('attribute', event.target.value)}
              />
            </FormField>
            <FormField label="Valor" htmlFor="value">
              <Input
                id="value"
                required
                placeholder="M"
                value={variant.value}
                onChange={(event) => update('value', event.target.value)}
              />
            </FormField>
            <FormField label="Recargo (USD)" htmlFor="additionalPrice">
              <Input
                id="additionalPrice"
                type="number"
                min={0}
                step="0.01"
                required
                value={variant.additionalPrice}
                onChange={(event) => update('additionalPrice', event.target.value)}
              />
            </FormField>
            <FormField label="SKU variante" htmlFor="skuVariant">
              <Input
                id="skuVariant"
                required
                value={variant.skuVariant}
                onChange={(event) => update('skuVariant', event.target.value)}
              />
            </FormField>
          </div>
          <Button
            className="mt-4"
            variant="outline"
            loading={addVariant.isPending}
            onClick={() => addVariant.mutate()}
          >
            Agregar variante
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            El recargo lo valida y aplica el backend; el catálogo público no devuelve
            variantes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
