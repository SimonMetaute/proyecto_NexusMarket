import { useMutation } from '@tanstack/react-query';
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
  createUser,
  toApiError,
} from '@nexus/shared';
import type { CreateUserRequest, UserResponse } from '@nexus/shared';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function OnboardingPage() {
  const [form, setForm] = useState<CreateUserRequest>({
    userType: 'Seller',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    identityDocumentType: 'CC',
    identityDocumentNumber: '',
  });
  const [created, setCreated] = useState<UserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: (response) => {
      setCreated(response);
      setError(null);
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

  const update = <K extends keyof CreateUserRequest>(
    field: K,
    value: CreateUserRequest[K],
  ): void => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding de vendedor"
        description="Alta de la cuenta y su primera bodega."
      />

      <Alert variant="warning" title="No existe onboarding atómico">
        El contrato real no ofrece una transacción única seller + bodega. El único
        endpoint disponible es <code>POST /users</code> (rol Seller). La bodega debe
        crearla el vendedor desde su portal (5174) porque el backend exige un token
        SELLER. No se simula la parte faltante.
      </Alert>

      {created !== null ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Cuenta creada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{created.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rol</span>
              <span>{created.userType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{created.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span>{created.status}</span>
            </div>
            <Alert variant="info" className="mt-3">
              Siguiente paso: el vendedor inicia sesión en{' '}
              <a
                className="font-medium underline"
                href="http://localhost:5174"
              >
                localhost:5174
              </a>{' '}
              y registra su bodega en Inventario. Un administrador puede aprobarlo desde
              Usuarios con su sellerId.
            </Alert>
            <Button
              variant="outline"
              onClick={() => {
                setCreated(null);
                setForm((current) => ({
                  ...current,
                  firstName: '',
                  lastName: '',
                  email: '',
                  password: '',
                  phone: '',
                  identityDocumentNumber: '',
                }));
              }}
            >
              Crear otra cuenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setError(null);
                mutation.mutate();
              }}
            >
              <FormField label="Tipo de usuario" htmlFor="userType">
                <Select
                  id="userType"
                  value={form.userType}
                  onChange={(event) =>
                    update(
                      'userType',
                      event.target.value as CreateUserRequest['userType'],
                    )
                  }
                >
                  <option value="Seller">Seller</option>
                  <option value="Buyer">Buyer</option>
                  <option value="Administrator">Administrator</option>
                </Select>
              </FormField>
              <FormField label="Teléfono" htmlFor="phone">
                <Input
                  id="phone"
                  required
                  minLength={5}
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
              </FormField>
              <FormField label="Nombres" htmlFor="firstName">
                <Input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(event) => update('firstName', event.target.value)}
                />
              </FormField>
              <FormField label="Apellidos" htmlFor="lastName">
                <Input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(event) => update('lastName', event.target.value)}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Correo electrónico" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Contraseña (mínimo 8)" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                />
              </FormField>
              <FormField label="Tipo de documento" htmlFor="identityDocumentType">
                <Input
                  id="identityDocumentType"
                  required
                  value={form.identityDocumentType}
                  onChange={(event) =>
                    update('identityDocumentType', event.target.value)
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
                    value={form.identityDocumentNumber}
                    onChange={(event) =>
                      update('identityDocumentNumber', event.target.value)
                    }
                  />
                </FormField>
              </div>

              {error !== null ? (
                <div className="sm:col-span-2">
                  <Alert variant="error">{error}</Alert>
                </div>
              ) : null}

              <div className="sm:col-span-2">
                <Button type="submit" loading={mutation.isPending}>
                  Crear cuenta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
