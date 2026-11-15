import { ShieldX } from 'lucide-react';
import type { PortalDefinition } from '../portal';
import { PORTAL_BY_ROLE, portalUrl } from '../portal';
import { useAuth } from './AuthProvider';
import { Button } from '../ui/button';

export function AccessDenied({ portal }: { portal: PortalDefinition }) {
  const { session, logout } = useAuth();
  const role = session?.user.role;
  const correctPortal = role !== undefined ? PORTAL_BY_ROLE[role] : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-7 w-7 text-destructive" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-destructive">
          403
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Acceso Denegado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu sesión pertenece al rol{' '}
          <span className="font-medium text-foreground">{role ?? 'desconocido'}</span>,
          que no tiene acceso al portal{' '}
          <span className="font-medium text-foreground">{portal.name}</span>.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Roles permitidos en este portal: {portal.allowedRoles.join(', ')}.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {correctPortal !== undefined ? (
            <Button
              type="button"
              onClick={() => {
                globalThis.location.assign(portalUrl(correctPortal.port));
              }}
            >
              Ir a {correctPortal.name} (:{correctPortal.port})
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void logout()}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
