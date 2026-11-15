import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { PortalDefinition } from '../portal';
import { AccessDenied } from './AccessDenied';
import { useAuth } from './AuthProvider';

/**
 * Guard estricto por portal.
 * - Sin sesión → redirige a /login conservando el destino.
 * - Sesión con rol fuera de `portal.allowedRoles` → pantalla 403.
 * - `allowAnonymous` deja pasar sin sesión (catálogo público); con sesión de
 *   otro rol igualmente se bloquea.
 */
export function RoleGuard({
  portal,
  allowAnonymous = false,
}: {
  portal: PortalDefinition;
  allowAnonymous?: boolean;
}) {
  const { session } = useAuth();
  const location = useLocation();

  if (session === null) {
    if (allowAnonymous) {
      return <Outlet />;
    }
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  const role = session.user.role;
  if (!portal.allowedRoles.includes(role)) {
    return <AccessDenied portal={portal} />;
  }

  return <Outlet />;
}

/** Variante para rutas públicas que sólo exigen sesión (cualquier rol permitido). */
export function RequireSession({ portal }: { portal: PortalDefinition }) {
  return <RoleGuard portal={portal} />;
}
