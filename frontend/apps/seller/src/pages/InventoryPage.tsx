import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  createWarehouse,
  formatDate,
  getSellerProfile,
  listSellerInventory,
  listSellerWarehouses,
  registerStockEntry,
  searchCatalog,
  statusVariant,
  toApiError,
} from '@nexus/shared';
import { Boxes, PackageCheck, PackagePlus, Warehouse } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [warehouseDialog, setWarehouseDialog] = useState(false);
  const [entry, setEntry] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    receiptReference: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: getSellerProfile,
  });
  const warehousesQuery = useQuery({
    queryKey: ['seller', 'warehouses'],
    queryFn: listSellerWarehouses,
  });
  const inventoryQuery = useQuery({
    queryKey: ['seller', 'inventory'],
    queryFn: listSellerInventory,
  });
  const catalogQuery = useQuery({
    queryKey: ['catalog', 'seller-products'],
    queryFn: () => searchCatalog({ page: 1, limit: 200 }),
  });

  const sellerId = profileQuery.data?.sellerId;
  const products = useMemo(
    () =>
      (catalogQuery.data?.products ?? []).filter(
        (product) => product.seller.sellerId === sellerId,
      ),
    [catalogQuery.data, sellerId],
  );

  const productName = (productId: string): string =>
    products.find((product) => product.productId === productId)?.name ??
    `Producto ${productId.slice(0, 8)}…`;

  const warehouseName = (warehouseId: string): string =>
    (warehousesQuery.data ?? []).find(
      (warehouse) => warehouse.warehouseId === warehouseId,
    )?.name ?? `Bodega ${warehouseId.slice(0, 8)}…`;

  const stockEntry = useMutation({
    mutationFn: () =>
      registerStockEntry({
        productId: entry.productId,
        warehouseId: entry.warehouseId,
        quantity: Number(entry.quantity),
        receiptReference: entry.receiptReference,
      }),
    onSuccess: (response) => {
      setError(null);
      setMessage(
        `Entrada registrada: ${response.availableStock} disponibles / ${response.totalStock} totales.`,
      );
      setEntry((current) => ({
        ...current,
        quantity: '',
        receiptReference: '',
      }));
      void queryClient.invalidateQueries({ queryKey: ['seller', 'inventory'] });
    },
    onError: (caught) => {
      setMessage(null);
      setError(toApiError(caught).message);
    },
  });

  const onSubmitEntry = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    stockEntry.mutate();
  };

  const isLoading =
    warehousesQuery.isLoading || inventoryQuery.isLoading || profileQuery.isLoading;
  const firstError =
    warehousesQuery.error ?? inventoryQuery.error ?? profileQuery.error;

  const warehouses = warehousesQuery.data ?? [];
  const inventory = inventoryQuery.data ?? [];
  const availableTotal = inventory.reduce(
    (sum, item) => sum + item.availableStock,
    0,
  );
  const reservedTotal = inventory.reduce(
    (sum, item) => sum + item.reservedStock,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Bodegas y stock reales del vendedor autenticado."
        actions={
          <Button onClick={() => setWarehouseDialog(true)}>
            <Warehouse className="h-4 w-4" /> Nueva bodega
          </Button>
        }
      />

      {message !== null ? <Alert variant="success">{message}</Alert> : null}
      {error !== null ? <Alert variant="error">{error}</Alert> : null}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : null}

      {firstError !== null && firstError !== undefined ? (
        <ErrorState
          error={firstError}
          onRetry={() => {
            void warehousesQuery.refetch();
            void inventoryQuery.refetch();
            void profileQuery.refetch();
          }}
        />
      ) : null}

      {!isLoading && (firstError === null || firstError === undefined) ? (
        <>
          <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Warehouse}
              label="Bodegas"
              value={warehouses.length}
              hint="Centros de almacenamiento"
              tone="primary"
            />
            <StatCard
              icon={Boxes}
              label="Registros de stock"
              value={inventory.length}
              hint="Producto por bodega"
              tone="info"
            />
            <StatCard
              icon={PackageCheck}
              label="Disponible"
              value={availableTotal}
              hint="Unidades listas para vender"
              tone="success"
            />
            <StatCard
              icon={PackageCheck}
              label="Reservado"
              value={reservedTotal}
              hint="Comprometido en órdenes"
              tone="warning"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registrar entrada de stock</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 || (warehousesQuery.data ?? []).length === 0 ? (
                <Alert variant="info" title="Faltan datos previos">
                  Necesitas al menos un producto en el catálogo y una bodega para
                  registrar stock.
                </Alert>
              ) : null}
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmitEntry}>
                <FormField label="Producto" htmlFor="productId">
                  <Select
                    id="productId"
                    required
                    value={entry.productId}
                    onChange={(event) =>
                      setEntry((current) => ({
                        ...current,
                        productId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Bodega" htmlFor="warehouseId">
                  <Select
                    id="warehouseId"
                    required
                    value={entry.warehouseId}
                    onChange={(event) =>
                      setEntry((current) => ({
                        ...current,
                        warehouseId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecciona una bodega</option>
                    {(warehousesQuery.data ?? []).map((warehouse) => (
                      <option
                        key={warehouse.warehouseId}
                        value={warehouse.warehouseId}
                      >
                        {warehouse.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Cantidad (entero positivo)" htmlFor="quantity">
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={entry.quantity}
                    onChange={(event) =>
                      setEntry((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="Referencia de recibo" htmlFor="receiptReference">
                  <Input
                    id="receiptReference"
                    required
                    value={entry.receiptReference}
                    onChange={(event) =>
                      setEntry((current) => ({
                        ...current,
                        receiptReference: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    loading={stockEntry.isPending}
                    disabled={products.length === 0 || (warehousesQuery.data ?? []).length === 0}
                  >
                    <PackagePlus className="h-4 w-4" /> Registrar entrada
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Bodegas</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {warehouses.length} registradas
              </span>
            </div>
            {(warehousesQuery.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Warehouse className="h-10 w-10" />}
                title="Sin bodegas registradas"
                description="Crea una bodega para poder asociar entradas de inventario."
                action={
                  <Button onClick={() => setWarehouseDialog(true)}>Nueva bodega</Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bodega</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(warehousesQuery.data ?? []).map((warehouse) => (
                    <TableRow key={warehouse.warehouseId}>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell>
                        {warehouse.location.city}, {warehouse.location.department}
                      </TableCell>
                      <TableCell>{warehouse.capacity}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(warehouse.status)}>
                          {warehouse.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(warehouse.creationDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">
                Stock por producto y bodega
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {inventory.length} registros
              </span>
            </div>
            {(inventoryQuery.data ?? []).length === 0 ? (
              <EmptyState
                title="Sin registros de inventario"
                description="Registra una entrada de stock para ver disponibilidad real."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Bodega</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead>Reservado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inventoryQuery.data ?? []).map((item) => (
                    <TableRow key={item.inventoryId}>
                      <TableCell>{productName(item.productId)}</TableCell>
                      <TableCell>{warehouseName(item.warehouseId)}</TableCell>
                      <TableCell>{item.availableStock}</TableCell>
                      <TableCell>{item.reservedStock}</TableCell>
                      <TableCell>{item.totalStock}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.updateDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </>
      ) : null}

      <WarehouseDialog
        open={warehouseDialog}
        onClose={() => setWarehouseDialog(false)}
        onCreated={() => {
          setWarehouseDialog(false);
          void queryClient.invalidateQueries({ queryKey: ['seller', 'warehouses'] });
        }}
      />
    </div>
  );
}

function WarehouseDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    country: 'Colombia',
    department: '',
    city: '',
    address: '',
    postalCode: '',
    capacity: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createWarehouse({
        warehouseId: globalThis.crypto.randomUUID(),
        name: form.name,
        country: form.country,
        department: form.department,
        city: form.city,
        address: form.address,
        postalCode: form.postalCode,
        capacity: Number(form.capacity),
        status: 'Operational',
      }),
    onSuccess: () => {
      setError(null);
      onCreated();
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nueva bodega"
      description="El sellerId lo impone el backend a partir del token."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Crear bodega
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField label="Nombre" htmlFor="warehouseName">
            <Input
              id="warehouseName"
              required
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </FormField>
        </div>
        <FormField label="País" htmlFor="warehouseCountry">
          <Input
            id="warehouseCountry"
            required
            value={form.country}
            onChange={(event) => update('country', event.target.value)}
          />
        </FormField>
        <FormField label="Departamento" htmlFor="warehouseDepartment">
          <Input
            id="warehouseDepartment"
            required
            value={form.department}
            onChange={(event) => update('department', event.target.value)}
          />
        </FormField>
        <FormField label="Ciudad" htmlFor="warehouseCity">
          <Input
            id="warehouseCity"
            required
            value={form.city}
            onChange={(event) => update('city', event.target.value)}
          />
        </FormField>
        <FormField label="Dirección" htmlFor="warehouseAddress">
          <Input
            id="warehouseAddress"
            required
            value={form.address}
            onChange={(event) => update('address', event.target.value)}
          />
        </FormField>
        <FormField label="Código postal" htmlFor="warehousePostalCode">
          <Input
            id="warehousePostalCode"
            required
            value={form.postalCode}
            onChange={(event) => update('postalCode', event.target.value)}
          />
        </FormField>
        <FormField label="Capacidad" htmlFor="warehouseCapacity">
          <Input
            id="warehouseCapacity"
            type="number"
            min={0}
            step={1}
            required
            value={form.capacity}
            onChange={(event) => update('capacity', event.target.value)}
          />
        </FormField>
      </div>
      {error !== null ? (
        <Alert variant="error" className="mt-3">
          {error}
        </Alert>
      ) : null}
    </Dialog>
  );
}
