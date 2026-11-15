# Contrato API real — NexusMarket Backend

**Base URL:** `http://localhost:3000/api/v1`
**Auditado contra:** `backend/src` (rutas, controladores y DTOs reales), commit `eebdd1a` + cambios de Fase 1.
**Persistencia:** MySQL (transaccional) + MongoDB (`audit_db.audit_logs`).

> Este documento es la fuente de verdad para el frontend. Refleja lo que el backend **devuelve hoy**, no lo que el SDD ideal describe. Las diferencias se listan en la sección 5.

---

## 1. Convenciones transversales

### 1.1 Envelope de error

Todos los errores (incluido 404 de ruta inexistente) usan:

```json
{
  "timestamp": "2026-11-15T22:10:00.000Z",
  "status": 422,
  "code": "INVALID_DOMAIN_VALUE",
  "message": "Insufficient inventory to reserve requested quantity.",
  "path": "/api/v1/buyer/checkout",
  "requestId": "e5fca67e-...",
  "details": { "field": "email", "error": "..." }
}
```

`details` es opcional y, en errores de validación, contiene `field` y `error`.

| HTTP | `code` | Uso |
|---|---|---|
| 400 | `INVALID_REQUEST` | Payload inválido, JSON malformado, campo faltante (`details.field`) |
| 401 | `AUTHENTICATION_REQUIRED` | Token ausente, inválido, expirado o revocado |
| 401 | `INVALID_CREDENTIALS` | Email/contraseña incorrectos en login |
| 403 | `FORBIDDEN` | Rol insuficiente o recurso de otro usuario |
| 404 | `RESOURCE_NOT_FOUND` | Ruta, producto, pedido, bodega, variante o dirección inexistente |
| 409 | `RESOURCE_ALREADY_EXISTS` | Email duplicado, variante duplicada |
| 422 | `INVALID_DOMAIN_VALUE` | Violación de regla de dominio (stock insuficiente, precio negativo, carrito multi-vendedor) |
| 500 | `INTERNAL_ERROR` | Fallo no controlado (nunca expone stack) |

### 1.2 Autenticación

`Authorization: Bearer <token>` en todas las rutas protegidas. JWT HS256, `expiresIn` por defecto 3600 s.

Respuesta de login:

```json
{
  "token": "eyJhbGciOi...",
  "user": { "userId": "uuid", "email": "user@test.com", "role": "BUYER", "username": "user" },
  "expiresIn": 3600
}
```

Roles canónicos: `BUYER`, `SELLER`, `ADMINISTRATOR`, `SUPERVISOR`, `LOGISTICS_OPERATOR`.
El token se puede decodificar en el cliente solo para UX; la autorización real la impone el backend.

### 1.3 CORS

Orígenes permitidos por defecto (Fase 1): `http://localhost:5173`, `:5174`, `:5175`, `:5176`.
Configurable con `CORS_ALLOWED_ORIGINS` (lista separada por comas). Métodos: `GET,POST,PUT,PATCH,DELETE,OPTIONS`; headers: `Content-Type,Authorization,X-Request-ID`; header expuesto: `X-Request-ID`.

---

## 2. Endpoints por portal

### 2.1 Público / autenticación (todos los portales)

| Método | Ruta | Auth | Request | Response OK |
|---|---|---|---|---|
| POST | `/auth/login` | — | `{ email, password }` | `200` login (ver 1.2) |
| POST | `/auth/register/buyer` | — | `{ email, password, firstName, lastName, phoneNumber, identification }` | `201 { userId, email, role, status, message }` |
| POST | `/auth/logout` | Bearer | — | `204` (revoca token y audita `USER_LOGOUT`) |
| GET | `/catalog/products` | — | query: `category?`, `search?`, `minPrice?`, `maxPrice?`, `page=1`, `limit=20` | `200 { total, page, limit, products[] }` |
| GET | `/catalog/products/:productId` | — | — | `200` detalle (ver abajo) |

Producto de catálogo:

```json
{
  "productId": "uuid",
  "name": "Laptop",
  "description": "…",
  "category": "Electronics",
  "price": 100,
  "currency": "USD",
  "seller": { "sellerId": "uuid" },
  "brand": "…",
  "sku": "SKU-1",
  "productStatus": "Published",
  "publicationDate": "…",
  "stock": 15,
  "createdAt": "…"
}
```

> `stock` es el campo del producto; la disponibilidad real por bodega vive en inventario. El catálogo no expone imágenes ni variantes.

### 2.2 Portal Comprador (`5173`)

| Método | Ruta | Request | Response OK |
|---|---|---|---|
| GET | `/buyer/profile` | — | `200 { buyerId, userId, trustLevel, lastPurchaseDate, deliveryAddresses[], paymentMethods[] }` |
| PUT | `/buyer/profile` | `{ trustLevel?, lastPurchaseDate? }` | `200 { buyerId, userId, trustLevel }` |
| GET | `/buyer/addresses` | — | `200 DeliveryAddress[]` |
| POST | `/buyer/addresses` | `DeliveryAddress` | `201 DeliveryAddress` |
| PUT | `/buyer/addresses/:addressId/primary` | — | `200 DeliveryAddress` |
| DELETE | `/buyer/addresses/:addressId` | — | `204` |
| GET | `/buyer/payment-methods` | — | `200 PaymentMethod[]` |
| POST | `/buyer/payment-methods` | `PaymentMethod` | `201 PaymentMethod` |
| POST | `/buyer/cart` | — | `201 { cartId, buyerId, status, subtotal, total, cartLines: [] }` |
| GET | `/buyer/cart` | — | `200 { cartId, buyerId, status, subtotal, total, updateDate, cartLines[] }` |
| POST | `/buyer/cart/items` | `{ productId, quantity, variantId? }` | `201` línea nueva / `200` upsert; `{ cartId, cartLines[], subtotal, total }` |
| PUT | `/buyer/cart/items/:cartLineId` | `{ quantity }` | `200 { cartId, cartLines[] }` |
| DELETE | `/buyer/cart/items/:cartLineId` | — | `204` |
| DELETE | `/buyer/cart` | — | `204` |
| POST | `/buyer/checkout` | `{ deliveryAddress, paymentMethod }` | `201 { orderId, buyerId, sellerId, total, orderStatus, creationDate }` |
| GET | `/buyer/orders` | — | `200 [{ orderId, buyerId, sellerId, total, orderStatus, creationDate }]` |
| GET | `/buyer/orders/:orderId` | — | `200 { orderId, total, status, orderStatus, items[] }` |
| POST | `/buyer/orders/:orderId/returns` | `{ reason, evidence? }` | `201 { returnId, orderId, invoiceId, reason, returnStatus, status, requestDate, refundAmount, evidence?, receivedDate? }` |
| GET | `/buyer/returns` | — | `200 Return[]` propias |

`DeliveryAddress` (todos obligatorios salvo `reference`):

```json
{
  "addressId": "uuid", "country": "Colombia", "department": "Antioquia",
  "city": "Medellin", "neighborhood": "El Poblado", "address": "Calle 10 # 20-30",
  "postalCode": "050001", "reference": "…", "isPrimary": true
}
```

`PaymentMethod`:

```json
{
  "paymentMethodId": "uuid", "type": "CreditCard",
  "maskedNumber": "**** **** **** 4242", "cardholder": "Nombre",
  "expirationDate": "12/2030", "brand": "VISA", "isDefault": true
}
```

`cartLines[]`: `{ cartLineId, productId, variantId?, quantity, unitPrice, subtotal }`.
`unitPrice` y `subtotal` provienen del backend (precio de catálogo + recargo de variante); el cliente **no** envía precio.

`order details.items[]`: `{ lineId, product: { productId }, variantId?, quantity, price, subtotal }`.
`orderStatus` ∈ `Pending | Confirmed | Preparing | Shipped | Delivered | Cancelled`.

Reglas relevantes:
- Sin carrito abierto, `GET /buyer/cart` → `404`. Crear con `POST /buyer/cart` antes de agregar ítems.
- `POST /buyer/cart/items` es upsert: `201` línea nueva, `200` si ya existía, **nunca 409**.
- `subtotal`/`total` se recalculan desde las líneas en cada alta, incremento y merge (`ShoppingCart.recalculate()`); una respuesta ya no puede devolver totales obsoletos.
- `PUT /buyer/cart/items/:cartLineId` devuelve sólo `{ cartId, cartLines[] }`. La UI invalida la query y reconsulta `GET /buyer/cart` para obtener los totales vigentes.
- `GET`/`PUT /buyer/profile` serializan `deliveryAddresses[]` y `paymentMethods[]` en camelCase (`addressId`, `maskedNumber`, `isDefault`, ...) mediante `http/mappers/BuyerMapper.ts`; no se exponen campos internos (`_addressId`, ...).
- Carrito con productos de varios vendedores → `422`; carrito vacío en checkout → `400`.
- Stock insuficiente en checkout → `422 INVALID_DOMAIN_VALUE`.
- Checkout no es idempotente de forma explícita: un segundo checkout del mismo carrito devuelve `422`/`400` (nunca duplica el pedido en la práctica).
- El checkout emite la `Invoice` de la orden (`invoiceId` es obligatorio en toda devolución).
- Devoluciones: solo para órdenes `Delivered` y dentro de los **30 días** posteriores a la `deliveryDate` del envío entregado. Orden no entregada → `422`; ventana vencida → `422` (con `details.deliveryDate`); orden ajena → `403`; devolución activa duplicada → `409`. `evidence` es opcional (texto libre).

### 2.3 Portal Vendedor (`5174`)

| Método | Ruta | Request | Response OK |
|---|---|---|---|
| GET | `/seller/profile` | — | `200 { sellerId, userId, commercialName, personType, verificationStatus, reputation, approvalDate }` |
| PUT | `/seller/profile` | `{ commercialName? }` | `200 { sellerId, commercialName, verificationStatus }` |
| GET | `/seller/warehouses` | — | `200 [{ warehouseId, sellerId, name, location, capacity, status, creationDate }]` |
| POST | `/seller/warehouses` | `{ warehouseId, name, country, department, city, address, postalCode, capacity, status }` | `201 { warehouseId, name, status }` |
| POST | `/seller/products` | `{ name, description, price, stock, sku?, brand?, category?, productStatus?, basePrice? }` | `201 { productId, name, status, sku, price }` |
| GET | `/seller/products` | — | `200 Product[]` propios (incluye borradores) |
| PUT | `/seller/products/:productId` | `{ name?, description?, price?, stock?, sku?, brand?, category?, basePrice? }` | `200 Product` |
| GET | `/seller/products/:productId/images` | — | `200 ProductImage[]` |
| POST | `/seller/products/:productId/images` | `{ url, altText?, position? }` | `201 ProductImage` |
| DELETE | `/seller/products/:productId/images/:imageId` | — | `204` |
| POST | `/seller/products/:productId/publish` | — | `200 { productId, status: "PUBLISHED", message }` |
| POST | `/seller/products/:productId/variants` | `{ variantId, attribute, value, additionalPrice, skuVariant }` | `201 { variantId, attribute, value, skuVariant }` |
| GET | `/seller/inventory` | — | `200 [{ inventoryId, productId, warehouseId, availableStock, reservedStock, totalStock, updateDate }]` |
| POST | `/seller/inventory/stock-entry` | `{ productId, warehouseId, quantity, receiptReference }` | `200 { inventoryId, availableStock, totalStock }` |
| GET | `/seller/orders` | — | `200 [{ orderId, buyerId, total, orderStatus, creationDate }]` |
| POST | `/seller/orders/:orderId/approve` | — | `200 { orderId, orderStatus }` |
| POST | `/seller/orders/:orderId/prepare` | — | `200 { orderId, orderStatus }` |
| GET | `/seller/dashboard` | — | `200 { activeOrders, totalSales, totalOrders, totalProducts, publishedProducts, totalStock, pendingReturns, sellerId, commercialName, verificationStatus }` |

`Product`: `{ productId, name, description, category?, sku?, sellerId, basePrice?, price, stock, productStatus, status, publicationDate?, brand?, createdAt }`.

`ProductImage`: `{ imageId, productId, url, altText?, position, createdAt }`.

Notas:
- `status` de bodega ∈ `Operational | Closed | Maintenance` (case-sensitive).
- `category` ∈ `Electronics, Home, Clothing and Accessories, Beauty, Sports, Toys, Office, Hardware, Automotive, Other`.
- `productStatus` ∈ `Draft, Published, Inactive, Suspended, OutOfStock`; por defecto `Draft`.
- Publicar exige vendedor verificado, producto propio, **SKU** y **al menos una imagen**; `403` si no es propio/verificado y `422 INVALID_DOMAIN_VALUE` (con `details.field = "sku" | "images"`) si falta el prerrequisito.
- `GET/PUT /seller/products` y las imágenes se filtran por el `sellerId` del token: producto ajeno → `403`, inexistente → `404`.
- Stock entry verifica producto y bodega propios: `404` si no existen, `403` si pertenecen a otro vendedor.

### 2.4 Portal Administrador (`5175`)

| Método | Ruta | Request | Response OK |
|---|---|---|---|
| GET | `/admin/users` | query: `role?`, `status?` | `200 [{ userId, userType, role, firstName, lastName, email, phone, identityDocument, registrationDate, status, updateDate }]` |
| POST | `/admin/sellers/onboarding` | `{ account: { firstName, lastName, email, password, phone, identityDocumentType, identityDocumentNumber }, seller: { commercialName, personType }, warehouse: { name, country, department, city, address, postalCode, capacity } }` | `201 { userId, sellerId, warehouseId, email, role: "SELLER", status, sellerVerificationStatus }` |
| POST | `/admin/sellers/:sellerId/approve` | — | `200 { sellerId, verificationStatus }` |
| POST | `/admin/sellers/:sellerId/reject` | `{ reason }` | `200 { sellerId, verificationStatus }` |
| GET | `/admin/audit-logs` | query: `actorId?`, `action?`, `from?` (ISO), `to?` (ISO), `page=1`, `limit=20` | `200 { items: [{ id, actorId, action, timestamp, details }], total, page, limit }` |
| GET | `/admin/dashboard` | — | `200 { activeOrders, totalSales, totalOrders, totalUsers, totalSellers, totalProducts, publishedProducts, pendingReturns }` |
| GET | `/supervisor/dashboard` | — | `200 { activeOrders, totalSales }` (rol `SUPERVISOR`) |
| GET | `/supervisor/health` | — | `200 { status, uptime }` (rol `SUPERVISOR`) |

Reglas relevantes:
- Lecturas (`GET /admin/users`, `/admin/audit-logs`, `/admin/dashboard`) admiten `ADMINISTRATOR` y `SUPERVISOR`; las mutaciones exigen `ADMINISTRATOR`.
- `approve`/`reject` reciben sólo `sellerId` en la ruta; el servicio recarga el agregado desde el repositorio antes de aplicar la transición, de modo que `approvalDate` y el resto de campos persistidos no se pierden.
- `sellerId` inexistente → `404 RESOURCE_NOT_FOUND`.
- **Onboarding atómico:** usuario + perfil de vendedor + primera bodega se guardan dentro de una única transacción MySQL (`runInTransaction`). Si falla cualquier paso, se revierte todo; nunca queda un vendedor a medio provisionar. Email o nombre comercial duplicado → `409`. La auditoría (`SELLER_REGISTRATION`) se escribe en MongoDB después del `COMMIT` y es resiliente a fallos de Mongo.
- `role` en `/admin/users` se resuelve al rol canónico (`BUYER`, `SELLER`, `ADMINISTRATOR`, `SUPERVISOR`, `LOGISTICS_OPERATOR`); `status` ∈ `Active | Inactive | Blocked | PendingVerification`. Valores desconocidos → `400`.
- `audit-logs` se ordena por `timestamp` descendente y limita `limit` a 200.
- Los KPIs del dashboard son agregaciones reales sobre `orders`, `users`, `sellers`, `products` y `product_returns` (sin valores fijos).

### 2.5 Portal Logística (`5176`)

| Método | Ruta | Request | Response OK |
|---|---|---|---|
| GET | `/logistics/warehouses` | — | `200 [{ warehouseId, sellerId, name, location, capacity, status, creationDate }]` |
| GET | `/logistics/shipments` | query: `status?`, `warehouseId?` | `200 [{ shipmentId, orderId, warehouseId, trackingCode, carrier, shipmentStatus, status, deliveryAddress, departureDate?, deliveryDate? }]` |
| GET | `/logistics/returns` | query: `status?` | `200 [{ returnId, orderId, invoiceId, reason, returnStatus, status, requestDate, refundAmount, evidence?, receivedDate? }]` |
| PATCH | `/logistics/returns/:returnId/receive` | — | `200 Return` con `receivedDate` y `returnStatus: "Completed"` |
| POST | `/logistics/inventory/stock-entry` | `{ productId, warehouseId, quantity, receiptReference }` | `200 { inventoryId, availableStock, totalStock }` |
| POST | `/logistics/shipments/:shipmentId/dispatch` | — | `200 { shipmentId, shipmentStatus }` (`404` si no existe) |
| POST | `/logistics/shipments/:shipmentId/confirm-delivery` | — | `200 { shipmentId, shipmentStatus }` (`404` si no existe) |

Reglas relevantes:
- `dispatch` marca el envío `InTransit` y la orden asociada `Sent`; `confirm-delivery` marca el envío `Delivered`, fija `deliveryDate` y la orden `Delivered` (habilita la ventana de devolución de 30 días).
- `status` de envío ∈ `Scheduled | InPreparation | InTransit | Delivered | Failed | Retained`; de devolución ∈ `Requested | InReview | Approved | Rejected | Completed`. Valor desconocido → `400`.
- `receive` solo admite devoluciones no `Completed` ni `Rejected`; repetir la recepción → `422`. Devolución inexistente → `404`.

### 2.6 Endpoints legacy (no usar en el frontend nuevo)

| Método | Ruta | Auth | Nota |
|---|---|---|---|
| POST | `/users` | ADMINISTRATOR | Alta de usuario por rol (`userType`); no crea bodega |
| POST | `/products` | SELLER | Alias de creación de producto |
| GET | `/products` | — | Alias del catálogo |

---

## 3. Mapa de consumo por portal

### Buyer (`5173`)

| Vista | Endpoints |
|---|---|
| Catálogo `/` | `GET /catalog/products` (filtros `search`, `category`, `minPrice`, `maxPrice`, `page`, `limit`) |
| Detalle `/products/:id` | `GET /catalog/products/:productId` |
| Login/Registro | `POST /auth/login`, `POST /auth/register/buyer` |
| Carrito `/cart` | `GET /buyer/cart`, `POST /buyer/cart` (si 404), `POST/PUT/DELETE /buyer/cart/items…` |
| Checkout `/checkout` | `GET /buyer/addresses`, `POST /buyer/addresses`, `GET /buyer/payment-methods`, `POST /buyer/payment-methods`, `POST /buyer/checkout` |
| Órdenes `/orders` | `GET /buyer/orders` |
| Detalle orden `/orders/:id` | `GET /buyer/orders/:orderId`, `POST /buyer/orders/:orderId/returns` (orden `Delivered`, ≤30 días), `GET /buyer/returns` |
| Perfil (drawer) | `GET /buyer/profile`, `PUT /buyer/profile` |
| Logout | `POST /auth/logout` |

### Seller (`5174`)

| Vista | Endpoints |
|---|---|
| Login | `POST /auth/login` |
| Dashboard `/dashboard` | `GET /seller/dashboard`, `GET /seller/profile`, `GET /seller/orders`, `GET /seller/inventory` |
| Productos `/products` | `GET /seller/products` (propios, incluidos borradores), `POST /seller/products/:id/publish` |
| Editar producto `/products/:id/edit` | `PUT /seller/products/:id`, `GET/POST /seller/products/:id/images`, `DELETE /seller/products/:id/images/:imageId`, `POST /seller/products/:id/publish` |
| Nuevo producto `/products/new` | `POST /seller/products`, `POST /seller/products/:id/variants`, `POST /seller/products/:id/images`, `POST /seller/products/:id/publish` |
| Inventario `/inventory` | `GET /seller/warehouses`, `POST /seller/warehouses`, `GET /seller/inventory`, `POST /seller/inventory/stock-entry` |
| Órdenes `/orders` | `GET /seller/orders`, `POST /seller/orders/:id/approve`, `POST /seller/orders/:id/prepare` |

### Admin/Supervisor (`5175`)

| Vista | Endpoints |
|---|---|
| Login | `POST /auth/login` |
| Dashboard `/dashboard` | `GET /admin/dashboard`, `GET /supervisor/dashboard`, `GET /supervisor/health` |
| Onboarding `/sellers/onboarding` | `POST /admin/sellers/onboarding` (atómico: usuario + vendedor + bodega) |
| Usuarios `/users` | `GET /admin/users` (filtros `role`, `status`), `POST /admin/sellers/:id/approve`, `POST /admin/sellers/:id/reject` |
| Auditoría `/audit-logs` | `GET /admin/audit-logs` (filtros `actorId`, `action`, `from`, `to`, paginación) |

### Logistics (`5176`)

| Vista | Endpoints |
|---|---|
| Login | `POST /auth/login` |
| Cola de despacho `/dispatch-queue` | `GET /logistics/shipments` (filtros `status`, `warehouseId`) |
| Envío `/shipments/:orderId` | `GET /logistics/shipments`, `POST /logistics/shipments/:shipmentId/dispatch`, `POST /logistics/shipments/:shipmentId/confirm-delivery` |
| Devoluciones `/returns` | `GET /logistics/returns` (filtro `status`), `PATCH /logistics/returns/:returnId/receive` |

---

## 4. Payloads de error esperados por flujo

| Flujo | Condición | HTTP / `code` |
|---|---|---|
| Login | credenciales inválidas | `401 INVALID_CREDENTIALS` |
| Registro | email existente | `409 RESOURCE_ALREADY_EXISTS` |
| Registro | campo faltante / email inválido / password < 8 | `400 INVALID_REQUEST` + `details.field` |
| Cualquier ruta protegida | sin token / token inválido o expirado | `401 AUTHENTICATION_REQUIRED` |
| Cualquier ruta de rol | rol incorrecto | `403 FORBIDDEN` |
| Catálogo | producto inexistente | `404 RESOURCE_NOT_FOUND` |
| Carrito | sin carrito abierto | `404 RESOURCE_NOT_FOUND` |
| Carrito | producto/variante inexistente o de otro producto | `404 RESOURCE_NOT_FOUND` |
| Carrito | `quantity <= 0` | `400 INVALID_REQUEST` |
| Checkout | carrito vacío | `400 INVALID_REQUEST` |
| Checkout | stock insuficiente | `422 INVALID_DOMAIN_VALUE` |
| Checkout | carrito multi-vendedor | `422 INVALID_DOMAIN_VALUE` |
| Producto | precio/stock negativo | `422 INVALID_DOMAIN_VALUE` |
| Variante | duplicada | `409 RESOURCE_ALREADY_EXISTS` |
| Variante | producto inexistente | `404 RESOURCE_NOT_FOUND` |
| Stock entry | bodega/producto inexistente | `404 RESOURCE_NOT_FOUND` |
| Orden seller | pedido inexistente o de otro vendedor | `404` / `403` |
| Admin approve/reject | `sellerId` inexistente | `404 RESOURCE_NOT_FOUND` |
| Admin onboarding | email o nombre comercial duplicado | `409 RESOURCE_ALREADY_EXISTS` |
| Admin onboarding | fallo en cualquier paso | rollback completo (sin usuario/vendedor/bodega parcial) |
| Imágenes producto | producto ajeno / imagen de otro producto | `403` / `404 RESOURCE_NOT_FOUND` |
| Publicar producto | sin SKU o sin imágenes | `422 INVALID_DOMAIN_VALUE` (`details.field`) |
| Devolución | orden no `Delivered` o ventana > 30 días | `422 INVALID_DOMAIN_VALUE` |
| Devolución | devolución activa duplicada | `409 RESOURCE_ALREADY_EXISTS` |
| Devolución | orden de otro comprador | `403 FORBIDDEN` |
| Devolución logística | devolución inexistente / ya recibida | `404` / `422` |
| Envíos logística | `status` desconocido | `400 INVALID_REQUEST` |
| Filtros admin | `role`/`status`/fechas inválidas | `400 INVALID_REQUEST` + `details.field` |

---

## 5. Brechas del backend que afectan al frontend (sin mocks)

Las siguientes brechas fueron resueltas en esta fase (los endpoints ya son reales y están documentados en §2):

1. **Audit logs:** `GET /admin/audit-logs` pagina y filtra sobre `audit_db.audit_logs` (`MongoAuditLogRepository.query`).
2. **Gestión de usuarios:** `GET /admin/users` lista usuarios reales con `role`/`status` (`UserRepository.findAll`).
3. **Onboarding atómico seller+bodega:** `POST /admin/sellers/onboarding` ejecuta usuario + vendedor + bodega en una transacción MySQL con rollback completo.
4. **Productos del vendedor:** `GET/PUT /seller/products` operan sobre los productos propios, incluidos borradores.
5. **Imágenes de producto:** entidad `ProductImage`, tabla `product_images` y endpoints `GET/POST/DELETE`.
6. **Cola de despacho y envíos:** `GET /logistics/shipments` con filtros por `status` y `warehouseId`.
7. **Devoluciones:** `POST /buyer/orders/:orderId/returns`, `GET /buyer/returns`, `GET /logistics/returns` y `PATCH /logistics/returns/:returnId/receive`.
8. **Dashboards reales:** `GET /admin/dashboard` y `GET /seller/dashboard` son agregaciones SQL reales.

Brechas que **permanecen** (fuera del alcance de esta fase; la UI las trata con estados vacíos o deshabilitados, nunca con datos inventados):

1. **Variantes en catálogo:** el detalle público no incluye variantes y no hay `GET` de variantes; sólo se pueden crear desde seller.
2. **Settlements / tienda:** `GET /seller/store` y `GET /seller/settlements` no existen.
3. **Dashboard de supervisor:** `GET /supervisor/dashboard` sigue devolviendo `{ activeOrders: 0, totalSales: 0 }`; el portal admin usa `/admin/dashboard` para los KPIs reales.
4. **Pago simulado:** no hay pasarela ni endpoint de pago. El checkout responde `201` (orden creada) o un error de dominio. Los tres estados del SDD se mapean así: `201` → aprobado; `4xx` (400/409/422) → rechazado con mensaje del backend; timeout de red o `5xx` → resultado desconocido / pendiente de verificación. Nunca se declara éxito sin `201`.
5. **Serialización de entidades:** `GET /seller/inventory`, `GET /seller/warehouses`, `GET /logistics/warehouses` (`WarehouseMapper`), `GET/PUT /buyer/profile`, `GET /buyer/addresses`, `GET /buyer/payment-methods` (`BuyerMapper`) y `GET /admin/users` (`UserMapper`, sin `_password`) están mapeados explícitamente.

---

## 6. Verificación de CORS (Fase 1)

Solicitud de preflight por cada origen:

```bash
curl -i -X OPTIONS http://localhost:3000/api/v1/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Respuesta esperada: `204` + `Access-Control-Allow-Origin: <origen>` para `5173`, `5174`, `5175` y `5176`; sin el header para orígenes no listados.
