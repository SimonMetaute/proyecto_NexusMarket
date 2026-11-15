import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  PORTALS,
  toApiError,
  registerBuyer,
} from '@nexus/shared';

const portal = PORTALS.buyer;

export function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    identification: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const response = await registerBuyer({
        ...form,
        email: form.email.trim(),
      });
      setSuccess(response.message);
    } catch (caught) {
      const apiError = toApiError(caught);
      setError(
        apiError.field !== undefined
          ? `${apiError.message} (campo: ${apiError.field})`
          : apiError.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-sm text-muted-foreground">NexusMarket · {portal.name}</p>
          <h1 className="text-2xl font-semibold">Crear cuenta de comprador</h1>
        </div>

        <Card>
          <CardContent className="pt-5">
            {success !== null ? (
              <div className="space-y-4">
                <Alert variant="success" title="Registro exitoso">
                  {success}
                </Alert>
                <Link to="/login">
                  <Button className="w-full">Ir a iniciar sesión</Button>
                </Link>
              </div>
            ) : (
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => void onSubmit(event)}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Nombres</Label>
                  <Input
                    id="firstName"
                    required
                    maxLength={100}
                    value={form.firstName}
                    onChange={(event) => update('firstName', event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Apellidos</Label>
                  <Input
                    id="lastName"
                    required
                    maxLength={100}
                    value={form.lastName}
                    onChange={(event) => update('lastName', event.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="password">Contraseña (mínimo 8 caracteres)</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber">Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    required
                    minLength={5}
                    maxLength={50}
                    value={form.phoneNumber}
                    onChange={(event) => update('phoneNumber', event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="identification">Identificación</Label>
                  <Input
                    id="identification"
                    required
                    maxLength={100}
                    value={form.identification}
                    onChange={(event) => update('identification', event.target.value)}
                  />
                </div>

                {error !== null ? (
                  <div className="sm:col-span-2">
                    <Alert variant="error">{error}</Alert>
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <Button type="submit" className="w-full" loading={submitting}>
                    Registrarme
                  </Button>
                </div>
              </form>
            )}

            {success === null ? (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link className="font-medium text-accent-foreground" to="/login">
                  Inicia sesión
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
