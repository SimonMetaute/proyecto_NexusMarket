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
      <div className="w-full max-w-md rounded-2xl border border-[#D9DADC]/12 bg-card p-8 text-center shadow-[0_30px_70px_-45px_rgba(0,0,0,1)] animate-scale-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/25 bg-red-400/10">
          <ShieldX className="h-7 w-7 text-red-300" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
          403
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Acceso denegado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu sesión pertenece al rol{' '}
          <span className="font-semibold text-foreground">{role ?? 'desconocido'}</span>,
          que no tiene acceso al portal{' '}
          <span className="font-semibold text-foreground">{portal.name}</span>.
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
