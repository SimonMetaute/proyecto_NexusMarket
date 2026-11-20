import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
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
    <div className="flex min-h-screen items-stretch bg-background">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-[#D9DADC]/10 bg-deep p-10 lg:flex xl:p-14">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary/[0.07] blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_14px_40px_-18px_rgba(255,201,60,0.9)]">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight">NexusMarket</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {portal.name}
            </p>
          </div>
        </div>

        <div className="relative max-w-md space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Operación en tiempo real
          </span>
          <h2 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground xl:text-[2.75rem]">
            Todo tu marketplace,
            <br />
            <span className="text-primary">en un solo lugar.</span>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Catálogo, órdenes, envíos y auditoría sobre la misma API. Ingresa con
            tu cuenta para continuar en {portal.name}.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-[#D9DADC]/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Portal
            </p>
            <p className="mt-1 font-semibold text-foreground">{portal.name}</p>
          </div>
          <div className="rounded-xl border border-[#D9DADC]/10 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Puerto
            </p>
            <p className="mt-1 font-semibold text-foreground tabular-nums">
              {portal.port}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-7 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_40px_-18px_rgba(255,201,60,0.9)] lg:hidden">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Bienvenido de nuevo
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Accede a {portal.name}
              </p>
            </div>
          </div>

          <Card className="border-[#D9DADC]/12">
            <CardContent className="pt-6">
              <form
                className="space-y-4"
                onSubmit={(event) => void onSubmit(event)}
              >
                <div className="space-y-2">
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
                <div className="space-y-2">
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

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={submitting}
                >
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              {allowRegister ? (
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  ¿No tienes cuenta?{' '}
                  <Link
                    className="font-semibold text-primary hover:text-primary-hover"
                    to="/register"
                  >
                    Regístrate
                  </Link>
                </p>
              ) : null}
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Portal {portal.name} · puerto {portal.port}
          </p>
        </div>
      </div>
    </div>
  );
}
