import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Dialog,
  FormField,
  Input,
  createAddress,
  createPaymentMethod,
  toApiError,
} from '@nexus/shared';
import { useState } from 'react';

export function AddressDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    country: 'Colombia',
    department: '',
    city: '',
    neighborhood: '',
    address: '',
    postalCode: '',
    reference: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createAddress({
        addressId: globalThis.crypto.randomUUID(),
        country: form.country,
        department: form.department,
        city: form.city,
        neighborhood: form.neighborhood,
        address: form.address,
        postalCode: form.postalCode,
        ...(form.reference.length > 0 ? { reference: form.reference } : {}),
        isPrimary: false,
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
      title="Nueva dirección"
      description="Los datos se envían tal cual al backend."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Guardar dirección
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="País" htmlFor="country">
          <Input
            id="country"
            required
            value={form.country}
            onChange={(event) => update('country', event.target.value)}
          />
        </FormField>
        <FormField label="Departamento" htmlFor="department">
          <Input
            id="department"
            required
            value={form.department}
            onChange={(event) => update('department', event.target.value)}
          />
        </FormField>
        <FormField label="Ciudad" htmlFor="city">
          <Input
            id="city"
            required
            value={form.city}
            onChange={(event) => update('city', event.target.value)}
          />
        </FormField>
        <FormField label="Barrio" htmlFor="neighborhood">
          <Input
            id="neighborhood"
            required
            value={form.neighborhood}
            onChange={(event) => update('neighborhood', event.target.value)}
          />
        </FormField>
        <FormField label="Dirección" htmlFor="address">
          <Input
            id="address"
            required
            value={form.address}
            onChange={(event) => update('address', event.target.value)}
          />
        </FormField>
        <FormField label="Código postal" htmlFor="postalCode">
          <Input
            id="postalCode"
            required
            value={form.postalCode}
            onChange={(event) => update('postalCode', event.target.value)}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Referencia (opcional)" htmlFor="reference">
            <Input
              id="reference"
              value={form.reference}
              onChange={(event) => update('reference', event.target.value)}
            />
          </FormField>
        </div>
      </div>
      {error !== null ? (
        <Alert variant="error" className="mt-3">
          {error}
        </Alert>
      ) : null}
    </Dialog>
  );
}

export function PaymentDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    type: 'CreditCard',
    maskedNumber: '',
    cardholder: '',
    expirationDate: '',
    brand: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createPaymentMethod({
        paymentMethodId: globalThis.crypto.randomUUID(),
        type: form.type,
        maskedNumber: form.maskedNumber,
        cardholder: form.cardholder,
        expirationDate: form.expirationDate,
        brand: form.brand,
        isDefault: false,
      }),
    onSuccess: () => {
      setError(null);
      onCreated();
    },
    onError: (caught) => setError(toApiError(caught).message),
  });

  const update = (field: keyof typeof form, value: string): void =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nuevo método de pago"
      description="El backend sólo almacena el número enmascarado; no hay pasarela real."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Guardar método
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Tipo" htmlFor="type">
          <select
            id="type"
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            value={form.type}
            onChange={(event) => update('type', event.target.value)}
          >
            <option value="CreditCard">CreditCard</option>
            <option value="DebitCard">DebitCard</option>
          </select>
        </FormField>
        <FormField label="Marca" htmlFor="brand">
          <Input
            id="brand"
            required
            placeholder="VISA"
            value={form.brand}
            onChange={(event) => update('brand', event.target.value)}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Número enmascarado" htmlFor="maskedNumber">
            <Input
              id="maskedNumber"
              required
              placeholder="**** **** **** 4242"
              value={form.maskedNumber}
              onChange={(event) => update('maskedNumber', event.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Titular" htmlFor="cardholder">
          <Input
            id="cardholder"
            required
            value={form.cardholder}
            onChange={(event) => update('cardholder', event.target.value)}
          />
        </FormField>
        <FormField label="Vencimiento" htmlFor="expirationDate">
          <Input
            id="expirationDate"
            required
            placeholder="12/2030"
            value={form.expirationDate}
            onChange={(event) => update('expirationDate', event.target.value)}
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
