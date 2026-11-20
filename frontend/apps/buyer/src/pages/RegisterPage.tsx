import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-primary/[0.08] blur-3xl" />
      <div className="relative w-full max-w-lg animate-fade-up">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_40px_-18px_rgba(255,201,60,0.9)]">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              NexusMarket · {portal.name}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Crear cuenta de comprador
            </h1>
          </div>
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
                <Link className="font-semibold text-primary hover:text-primary-hover" to="/login">
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
