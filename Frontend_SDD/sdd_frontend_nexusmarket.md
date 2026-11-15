# Software Design Document (SDD) — Frontend NexusMarket

**Versión:** 1.0  
**Estado:** Aprobado para implementación  
**Backend de Referencia:** Node.js + TypeScript + Express (`http://localhost:3000/api/v1`)  
**Persistencia Subyacente:** MySQL (transaccional) + MongoDB (auditoría)

---

## 1. Visión General y Topología de Puertos

El frontend de **NexusMarket** se diseña como un monorepo/workspace modular construido en **React + TypeScript + Vite**, dividido en **4 portales independientes por rol** que operan de forma concurrente y consumen exclusivamente la API REST real del backend en el puerto `3000`.

| Puerto | Aplicación / Portal | Rol(es) Permitido(s) | Responsabilidad Principal |
| :--- | :--- | :--- | :--- |
| **`5173`** | **Buyer Storefront** | `BUYER` (y acceso público a catálogo) | Exploración de catálogo, detalle de producto, gestión de carrito, proceso de checkout, historial de órdenes y solicitud de devoluciones ($\le 30$ días). |
| **`5174`** | **Seller Center** | `SELLER` | Gestión de catálogo propio (borrador, SKU, imágenes, publicación), registro de entradas de inventario por bodega (`Warehouse`) y seguimiento de ventas. |
| **`5175`** | **Admin & Audit Console** | `ADMIN`, `SUPERVISOR` | Onboarding atómico de Vendedor + primera Bodega, gestión de usuarios/roles, supervisión operativa y consulta de trazabilidad (`AuditLogs`). |
| **`5176`** | **Logistics Ops** | `LOGISTICS` | Cola de pedidos confirmados para despacho, actualización de estados logísticos de envío y recepción de devoluciones aprobadas. |

---

## 2. Arquitectura del Workspace Frontend

Para evitar duplicación de código, desincronización de tipos y conflictos entre agentes o desarrolladores, el directorio `frontend/` se organizará bajo una estructura compartida con 4 puntos de entrada independientes:

```text
frontend/
├── package.json                 # Scripts unificados (dev:all, build:all, typecheck:all)
├── packages/
│   └── shared/                  # Código compartido entre los 4 portales
│       ├── api/                 # Instancia Axios, interceptores JWT y manejo de errores HTTP
│       ├── auth/                # Contexto de sesión, decodificación de rol y componente RoleGuard
│       ├── types/               # Contratos DTO estrictos alineados con backend/src
│       └── ui/                  # Componentes base (shadcn/ui, Tailwind, layouts, skeletons)
└── apps/
    ├── buyer/                   # Configuración Vite en puerto 5173
    ├── seller/                  # Configuración Vite en puerto 5174
    ├── admin/                   # Configuración Vite en puerto 5175
    └── logistics/               # Configuración Vite en puerto 5176
```

---

## 3. Stack Tecnológico y Librerías Recomendadas

Para garantizar una interfaz moderna, accesible, consistente y fácil de mantener, se adoptan las siguientes tecnologías:

* **Core & Bundler:** React 18+, **TypeScript (`strict: true`)** y **Vite**.
* **Sistema de Diseño y UI:** **Tailwind CSS** + **shadcn/ui** (primitivas accesibles de Radix UI) + **Lucide React** (iconografía).
  * *Justificación:* Permite construir tablas densas con filtros, *drawers* laterales (carrito de compras), modales de confirmación, *badges* de estado y notificaciones *toast* con alta calidad visual y sin colisiones de hojas de estilo.
* **Gestión de Estado Asíncrono:** **TanStack Query (React Query v5)**.
  * *Justificación:* Centraliza el ciclo de vida de las peticiones (`isLoading`, `isError`, `data`), caché e invalidación automática tras mutaciones críticas (ej. creación de entrada de stock o cambio de estado de un pedido).
* **Formularios y Validación UX:** **React Hook Form** + **Zod**.
  * *Justificación:* Ofrece retroalimentación inmediata en formularios (campos obligatorios, formato de SKU, cantidades enteras positivas) mejorando la experiencia de usuario sin duplicar reglas de negocio del servidor.
* **Cliente HTTP:** **Axios** con interceptores para inyección de token `Bearer` y normalización de errores de dominio (`401`, `403`, `404`, `422`).

---

## 4. Principios y Restricciones Innegociables

1. **Cero Autoridad de Negocio en el Cliente:**
   * El frontend **nunca** calcula precios finales, recargos, impuestos, disponibilidad real de inventario ni valida transiciones de estado por su cuenta.
   * Toda cifra monetaria (`unitPrice`, subtotales, totales) y estado operativo se renderiza directamente desde la respuesta del backend.
2. **Alineación Estricta con el Contrato Real:**
   * Antes de codificar vistas, se debe auditar `backend/src` para mapear las rutas exactas bajo `/api/v1`, sus parámetros (`sellerId`, `WarehouseLocation`, etc.) y formatos de respuesta.
   * No se permite inventar campos, endpoints ni utilizar datos simulados (*mocks*) en los flujos conectados.
3. **Aislamiento de Seguridad por Puerto (`RoleGuard`):**
   * Cada portal valida el rol del usuario autenticado al iniciar y en cada cambio de ruta.
   * Si un usuario con sesión válida intenta acceder a un puerto que no corresponde a su rol (ej. un `BUYER` ingresando a `localhost:5175`), la aplicación bloquea el renderizado y muestra una pantalla explícita de **`403 Acceso Denegado`** con opción de cerrar sesión.
4. **Cobertura Obligatoria de Estados de Interfaz:**
   * **Loading:** *Skeletons* estructurales mientras se resuelven las consultas.
   * **Empty State:** Pantallas informativas con llamado a la acción cuando las listas estén vacías.
   * **Error de Dominio (`422` / `404`):** Renderizado claro del mensaje devuelto por el backend (ej. conflicto de concurrencia de stock o recurso no encontrado).
   * **Estados del Puerto de Pago Simulado:** En el flujo de checkout se deben distinguir visualmente tres desenlaces posibles:
     1. *Pago Aprobado* (confirmación de orden).
     2. *Pago Rechazado* (permite reintentar).
     3. *Timeout / Resultado Desconocido* (estado pendiente de verificación; nunca declarar éxito sin confirmación explícita del servidor).

---

## 5. Especificación Funcional por Portal

### 5.1. Portal Comprador (`localhost:5173`)
* **Rutas:** `/`, `/products/:id`, `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/login`, `/register`.
* **Requerimientos Funcionales:**
  * **Catálogo:** Listado paginado/filtrable de productos publicados (`PUBLISHED`), mostrando imagen, SKU, precio unitario real y disponibilidad.
  * **Carrito:** Sincronización directa con los endpoints de carrito del backend. Manejo controlado si un ítem deja de existir (`404 RESOURCE_NOT_FOUND`) o supera el stock disponible (`422 INVALID_DOMAIN_VALUE`).
  * **Checkout:** Resumen de ítems, selección de dirección/bodega aplicable y ejecución del pago simulado respetando los 3 estados de respuesta.
  * **Órdenes y Devoluciones:** Visualización del historial de pedidos y detalle de estados. El botón **"Solicitar Devolución"** solo se habilita si la orden está en estado `DELIVERED` y dentro de la ventana de $\le 30$ días desde la entrega.

### 5.2. Portal Vendedor (`localhost:5174`)
* **Rutas:** `/login`, `/dashboard`, `/products`, `/products/new`, `/products/:id/edit`, `/inventory`, `/orders`, `/store`, `/settlements`.
* **Requerimientos Funcionales:**
  * **Gestión de Productos:** Creación y edición de productos en estado `DRAFT`. Acción de **Publicar** condicionada a la existencia de SKU e imagen asociada según las reglas del dominio.
  * **Gestión de Inventario:** Formulario para registrar entradas de stock (`StockEntry`) asociadas a una `WarehouseLocation` válida, bloqueando cantidades negativas o cero en UX y manejando errores `404`/`422` del servidor.
  * **Pedidos del Vendedor:** Vista de lectura de órdenes que contienen productos pertenecientes al vendedor autenticado.
  * **Tienda (`/store`):** `GET /seller/store` expone la tienda derivada del perfil verificado (`storeId`, `storeName`, `storeCategory`, `status`, `rating`); no se inventan reseñas (`reviewCount = 0`).
  * **Liquidaciones (`/settlements`):** `GET /seller/settlements?startDate&endDate` (alias `/seller/settlement/preview`) muestra ventas brutas, comisión 10 %, IVA 19 % sobre comisión, deducciones por devoluciones aprobadas y neto. Por defecto, mes en curso.

### 5.3. Portal Administrador y Supervisor (`localhost:5175`)
* **Rutas:** `/login`, `/dashboard`, `/sellers/onboarding`, `/users`, `/audit-logs`.
* **Requerimientos Funcionales:**
  * **Onboarding Atómico de Vendedor:** Formulario unificado que captura los datos del nuevo `Seller` junto con los datos de su primera `Warehouse` en una única transacción hacia el backend (todo o nada).
  * **Administración de Usuarios:** Listado de cuentas del sistema con capacidad de activar, suspender o revisar perfiles y roles asignados.
  * **Consola de Auditoría (`AuditLogs`):** Tabla filtrable por actor, tipo de evento (ej. `USER_LOGOUT`, creación de productos, movimientos de stock) y rango de fechas, conectada a los registros persistidos en MongoDB.

### 5.4. Portal Logística (`localhost:5176`)
* **Rutas:** `/login`, `/dispatch-queue`, `/shipments/:orderId`, `/returns`.
* **Requerimientos Funcionales:**
  * **Cola de Despacho:** Listado de órdenes pagadas/aprobadas pendientes de preparación y envío por bodega.
  * **Gestión de Envío:** Control de avance de estado logístico respetando el flujo secuencial permitido por el backend (`PREPARING` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED`).
  * **Devoluciones:** Bandeja de solicitudes de devolución para registrar su recepción física.

---

## 6. Configuración de Conectividad y CORS

Para permitir la comunicación fluida desde los 4 orígenes locales durante el desarrollo e integración:

* **URL Base API (Variable de entorno `VITE_API_URL`):** `http://localhost:3000/api/v1`
* **Orígenes CORS requeridos en Express (`backend/src`):**
  * `http://localhost:5173`
  * `http://localhost:5174`
  * `http://localhost:5175`
  * `http://localhost:5176`

---

## 7. Criterios de Aceptación (Gate de Calidad Frontend)

Para considerar completada la implementación del frontend, se deben verificar los siguientes puntos:

- [x] **Arranque Concurrente:** Los 4 servidores Vite levantan simultáneamente en los puertos `5173`, `5174`, `5175` y `5176` sin conflictos.
- [x] **Integridad de Tipos y Build:** `npm run typecheck` y `npm run build` finalizan con `0` errores en los 4 portales y en el paquete `shared`.
- [x] **Seguridad de Roles:** Ningún rol puede visualizar vistas operativas de otro puerto; el `RoleGuard` redirige o renderiza `403` correctamente.
- [x] **Trazabilidad End-to-End (E2E):** Flujo verificado contra el servidor en puerto `3000`:
  1. Onboarding de vendedor + bodega desde Admin (`5175`).
  2. Creación, carga de stock y publicación de producto desde Seller (`5174`).
  3. Compra y checkout exitoso desde Buyer (`5173`).
  4. Preparación de la orden desde Seller (`5174`): el `Shipment` aparece automáticamente en la cola de Logistics (`5176`).
  5. Despacho y entrega desde Logistics (`5176`), con la orden del comprador en `Delivered` y devolución habilitada ≤ 30 días.
  6. Verificación de eventos registrados (`SHIPMENT_CREATED`, `SHIPMENT_DISPATCH`, `SHIPMENT_DELIVERED`, `RETURN_REQUEST`) en la consola de `AuditLogs` (`5175`).

---

## 8. Estado final del sistema (v1 — 100 %)

| Área | Estado | Evidencia |
|---|---|---|
| Backend TypeScript | ✅ | `npx tsc --noEmit` sin errores |
| Tests unitarios | ✅ | `npm run test:unit` (9 + 19) |
| Tests de integración | ✅ | 4 suites: 120 PASS / 0 FAIL / 2 NOTE |
| Ciclo de negocio E2E | ✅ | `tests/integration/shipment-lifecycle.test.ts` (20 checks) |
| Frontend typecheck | ✅ | `shared` + `admin` + `buyer` + `logistics` + `seller` |
| Frontend build | ✅ | 4 apps con `vite build` correcto |
| Contrato SDD v1 | ✅ | Todos los endpoints de §2 implementados, incluidos `GET /seller/store`, `GET /seller/settlements` y el alias `GET /seller/settlement/preview` |
| Persistencia | ✅ | MySQL transaccional (órdenes, envíos, devoluciones) + MongoDB (`audit_logs`) |

Brechas conscientes de v1 (sin mocks en la UI): variantes en el catálogo público, KPIs del dashboard de supervisor, pasarela de pago real y reseñas de tienda.