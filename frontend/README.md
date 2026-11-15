# NexusMarket — Frontend

Monorepo de 4 portales React + TypeScript + Vite conectados al backend real
`http://localhost:3000/api/v1`.

| Workspace | Portal | Puerto | Roles |
| --- | --- | --- | --- |
| `@nexus/buyer` | Buyer Storefront | 5173 | `BUYER` (catálogo público) |
| `@nexus/seller` | Seller Center | 5174 | `SELLER` |
| `@nexus/admin` | Admin Console | 5175 | `ADMINISTRATOR`, `SUPERVISOR` |
| `@nexus/logistics` | Logistics Console | 5176 | `LOGISTICS_OPERATOR` |
| `@nexus/shared` | Cliente Axios/JWT, tipos, TanStack Query, UI | — | — |

## Requisitos

- Node.js 20+
- Backend NexusMarket escuchando en el puerto `3000`
- Dependencias instaladas: `npm install` dentro de `frontend/`

## Scripts

```bash
npm install                # instala el workspace completo
npm run dev                # levanta los 4 portales en paralelo (5173-5176)
npm run dev:buyer          # sólo Buyer  (5173)
npm run dev:seller         # sólo Seller (5174)
npm run dev:admin          # sólo Admin  (5175)
npm run dev:logistics      # sólo Logistics (5176)
npm run typecheck          # tsc --noEmit en shared + 4 apps
npm run build              # tsc + vite build en shared + 4 apps
```

La URL de la API se toma de `VITE_API_URL` (ver `.env.example`). Si no está
definida, el cliente usa `http://localhost:3000/api/v1`.

## Autenticación y aislamiento por puerto

- `POST /auth/login` guarda la sesión en `localStorage` del origen (cada puerto
  tiene su propia sesión).
- `RoleGuard` valida el rol en cada ruta protegida. Un rol ajeno al portal ve la
  pantalla **403 Acceso Denegado** con opción de cerrar sesión e ir al portal
  correcto.
- Un `401` del backend limpia la sesión y redirige a `/login`.

## Estructura

```text
frontend/
  shared/src/
    api/        cliente Axios, interceptores JWT, tipos del contrato y endpoints
    auth/       sesión, AuthProvider, RoleGuard, LoginPage
    query/      QueryClient (reintentos sólo para fallos de red/5xx)
    ui/         componentes base estilo shadcn/ui + Tailwind
  apps/
    buyer/ seller/ admin/ logistics/
```

## Estados de interfaz

Todas las vistas usan el contrato real (`docs/api-contract-summary.md`):

- **Loading:** skeletons estructurales.
- **Empty:** `EmptyState` con explicación y acción.
- **Error de dominio:** mensaje literal del backend (`422`/`404`) con código y
  `requestId` cuando existe.
- **Checkout:** `201` → aprobado, `4xx` → rechazado (reintentable),
  timeout/`5xx` → resultado desconocido (nunca se declara éxito).

## Brechas conocidas (sin mocks)

El frontend no inventa endpoints ni datos. Las vistas afectadas muestran su
estado real y una explicación:

- `GET /admin/users` siempre devuelve `[]`.
- No hay endpoint de auditoría, devoluciones, envíos/listado de órdenes para
  logística, onboarding atómico seller+bodega, edición/borrado de productos ni
  imágenes de producto.
- `GET /seller/inventory`, `GET /seller/warehouses` y
  `GET /logistics/warehouses` fueron normalizados a camelCase en el backend
  (Fase 1).
