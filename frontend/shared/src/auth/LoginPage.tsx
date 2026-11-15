import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import type { PortalDefinition } from '../portal';
import { toApiError } from '../api/errors';
import { useAuth } from './AuthProvider';
import { AccessDenied } from './AccessDenied';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, Input, Label } from '../ui/primitives';

interface LocationState {
  from?: string;
}

export function LoginPage({
  portal,
  allowRegister = false,
}: {
  portal: PortalDefinition;
  allowRegister?: boolean;
}) {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session !== null) {
    if (!portal.allowedRoles.includes(session.user.role)) {
      return <AccessDenied portal={portal} />;
    }
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(toApiError(caught).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">NexusMarket</p>
            <p className="text-sm text-muted-foreground">{portal.name}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@test.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error !== null ? <Alert variant="error">{error}</Alert> : null}

              <Button type="submit" className="w-full" loading={submitting}>
                Iniciar sesión
              </Button>
            </form>

            {allowRegister ? (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link className="font-medium text-accent-foreground" to="/register">
                  Regístrate
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Portal {portal.name} · puerto {portal.port}
        </p>
      </div>
    </div>
  );
}
