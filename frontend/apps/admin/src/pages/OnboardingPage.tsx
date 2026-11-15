import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  PageHeader,
  Select,
  onboardSeller,
  toApiError,
} from '@nexus/shared';
import type { OnboardSellerRequest, OnboardSellerResponse } from '@nexus/shared';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const EMPTY_FORM: OnboardSellerRequest = {
  account: {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    identityDocumentType: 'CC',
    identityDocumentNumber: '',
  },
  seller: {
    commercialName: '',
    personType: 'Natural',
  },
  warehouse: {
    name: '',
    country: 'Colombia',
    department: '',
    city: '',
    address: '',
    postalCode: '',
    capacity: 100,
  },
};

export function OnboardingPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OnboardSellerRequest>(EMPTY_FORM);
  const [created, setCreated] = useState<OnboardSellerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => onboardSeller(form),
    onSuccess: (response) => {
      setCreated(response);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
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

  const updateAccount = <K extends keyof OnboardSellerRequest['account']>(
    field: K,
    value: OnboardSellerRequest['account'][K],
  ): void =>
    setForm((current) => ({
      ...current,
      account: { ...current.account, [field]: value },
    }));

  const updateSeller = <K extends keyof OnboardSellerRequest['seller']>(
    field: K,
    value: OnboardSellerRequest['seller'][K],
  ): void =>
    setForm((current) => ({
      ...current,
      seller: { ...current.seller, [field]: value },
    }));

  const updateWarehouse = <K extends keyof OnboardSellerRequest['warehouse']>(
    field: K,
    value: OnboardSellerRequest['warehouse'][K],
  ): void =>
    setForm((current) => ({
      ...current,
      warehouse: { ...current.warehouse, [field]: value },
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding de vendedor"
        description="Cuenta, perfil de vendedor y primera bodega en una sola transacción atómica."
      />

      {created !== null ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Vendedor
              provisionado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{created.userId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Seller ID</span>
              <span className="font-mono text-xs">{created.sellerId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Warehouse ID</span>
              <span className="font-mono text-xs">{created.warehouseId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span>{created.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Verificación</span>
              <span>{created.sellerVerificationStatus}</span>
            </div>
            <Alert variant="info" className="mt-3">
              Usuario, vendedor y bodega se confirmaron en la misma transacción.
              Si cualquier paso hubiera fallado, no se habría creado ninguno. El
              vendedor queda pendiente de aprobación en la vista de Usuarios.
            </Alert>
            <Button
              variant="outline"
              onClick={() => {
                setCreated(null);
                setForm(EMPTY_FORM);
              }}
            >
              Crear otro vendedor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            mutation.mutate();
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Cuenta de acceso</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nombres" htmlFor="firstName">
                <Input
                  id="firstName"
                  required
                  value={form.account.firstName}
                  onChange={(event) =>
                    updateAccount('firstName', event.target.value)
                  }
                />
              </FormField>
              <FormField label="Apellidos" htmlFor="lastName">
                <Input
                  id="lastName"
                  required
                  value={form.account.lastName}
                  onChange={(event) =>
                    updateAccount('lastName', event.target.value)
                  }
                />
              </FormField>
              <FormField label="Correo electrónico" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.account.email}
                  onChange={(event) => updateAccount('email', event.target.value)}
                />
              </FormField>
              <FormField label="Contraseña (mínimo 8)" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.account.password}
                  onChange={(event) =>
                    updateAccount('password', event.target.value)
                  }
                />
              </FormField>
              <FormField label="Teléfono" htmlFor="phone">
                <Input
                  id="phone"
                  required
                  minLength={5}
                  value={form.account.phone}
                  onChange={(event) => updateAccount('phone', event.target.value)}
                />
              </FormField>
              <FormField
                label="Tipo de documento"
                htmlFor="identityDocumentType"
              >
                <Input
                  id="identityDocumentType"
                  required
                  value={form.account.identityDocumentType}
                  onChange={(event) =>
                    updateAccount('identityDocumentType', event.target.value)
                  }
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField
                  label="Número de documento"
                  htmlFor="identityDocumentNumber"
                >
                  <Input
                    id="identityDocumentNumber"
                    required
                    value={form.account.identityDocumentNumber}
                    onChange={(event) =>
                      updateAccount('identityDocumentNumber', event.target.value)
                    }
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perfil de vendedor</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nombre comercial" htmlFor="commercialName">
                <Input
                  id="commercialName"
                  required
                  value={form.seller.commercialName}
                  onChange={(event) =>
                    updateSeller('commercialName', event.target.value)
                  }
                />
              </FormField>
              <FormField label="Tipo de persona" htmlFor="personType">
                <Select
                  id="personType"
                  value={form.seller.personType}
                  onChange={(event) =>
                    updateSeller(
                      'personType',
                      event.target.value as 'Natural' | 'Legal',
                    )
                  }
                >
                  <option value="Natural">Natural</option>
                  <option value="Legal">Legal</option>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Primera bodega</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nombre" htmlFor="warehouseName">
                <Input
                  id="warehouseName"
                  required
                  value={form.warehouse.name}
                  onChange={(event) =>
                    updateWarehouse('name', event.target.value)
                  }
                />
              </FormField>
              <FormField label="País" htmlFor="country">
                <Input
                  id="country"
                  required
                  value={form.warehouse.country}
                  onChange={(event) =>
                    updateWarehouse('country', event.target.value)
                  }
                />
              </FormField>
              <FormField label="Departamento" htmlFor="department">
                <Input
                  id="department"
                  required
                  value={form.warehouse.department}
                  onChange={(event) =>
                    updateWarehouse('department', event.target.value)
                  }
                />
              </FormField>
              <FormField label="Ciudad" htmlFor="city">
                <Input
                  id="city"
                  required
                  value={form.warehouse.city}
                  onChange={(event) =>
                    updateWarehouse('city', event.target.value)
                  }
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Dirección" htmlFor="address">
                  <Input
                    id="address"
                    required
                    value={form.warehouse.address}
                    onChange={(event) =>
                      updateWarehouse('address', event.target.value)
                    }
                  />
                </FormField>
              </div>
              <FormField label="Código postal" htmlFor="postalCode">
                <Input
                  id="postalCode"
                  required
                  value={form.warehouse.postalCode}
                  onChange={(event) =>
                    updateWarehouse('postalCode', event.target.value)
                  }
                />
              </FormField>
              <FormField label="Capacidad" htmlFor="capacity">
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  required
                  value={form.warehouse.capacity}
                  onChange={(event) =>
                    updateWarehouse(
                      'capacity',
                      Number.parseInt(event.target.value, 10) || 1,
                    )
                  }
                />
              </FormField>
            </CardContent>
          </Card>

          {error !== null ? <Alert variant="error">{error}</Alert> : null}

          <Button type="submit" loading={mutation.isPending}>
            Provisionar vendedor
          </Button>
        </form>
      )}
    </div>
  );
}
