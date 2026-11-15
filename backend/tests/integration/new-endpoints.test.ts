/**
 * Integration coverage for the endpoints delivered in this phase:
 * admin users/audit/dashboard/onboarding, seller products/images/publish gate,
 * buyer returns and logistics queues.
 *
 * Runs against a live server (default http://localhost:3000) with seeded
 * MySQL + MongoDB.
 *
 * Usage: node_modules/.bin/tsx tests/integration/new-endpoints.test.ts
 */
const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:3000';

interface ApiResult {
  status: number;
  body: any;
}

const results: Array<{ name: string; level: 'PASS' | 'FAIL' | 'NOTE'; detail: string }> = [];

function record(name: string, level: 'PASS' | 'FAIL' | 'NOTE', detail: string): void {
  results.push({ name, level, detail });
  console.log(`[${level}] ${name} :: ${detail}`);
}

function check(name: string, condition: boolean, detail: string): boolean {
  record(name, condition ? 'PASS' : 'FAIL', detail);
  return condition;
}

async function api(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body: any = text;
  try {
    body = text.length === 0 ? null : JSON.parse(text);
  } catch {
    // keep text
  }
  return { status: response.status, body };
}

async function login(email: string, password: string): Promise<string> {
  const response = await api('POST', '/api/v1/auth/login', { body: { email, password } });
  return response.status === 200 ? (response.body?.token ?? '') : '';
}

const ADDRESS = {
  addressId: globalThis.crypto.randomUUID(),
  country: 'Colombia',
  department: 'Antioquia',
  city: 'Medellin',
  neighborhood: 'Centro',
  address: 'Calle Fase 5 # 1-2',
  postalCode: '050001',
  isPrimary: true,
};

const PAYMENT = {
  paymentMethodId: globalThis.crypto.randomUUID(),
  type: 'CreditCard',
  maskedNumber: '**** **** **** 4242',
  cardholder: 'Fase Cinco',
  expirationDate: '12/2030',
  brand: 'VISA',
  isDefault: true,
};

async function main(): Promise<void> {
  const runSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // ------------------------------------------------------------- admin reads
  const adminToken = await login('admin@test.com', 'Admin1234!');
  if (adminToken.length === 0) {
    record('admin login', 'FAIL', 'could not authenticate admin@test.com');
    return;
  }

  const users = await api('GET', '/api/v1/admin/users', { token: adminToken });
  check(
    'GET /admin/users returns real users',
    users.status === 200 && Array.isArray(users.body) && users.body.length > 0,
    `status=${users.status} count=${Array.isArray(users.body) ? users.body.length : 'n/a'}`,
  );
  const firstUser = Array.isArray(users.body) ? users.body[0] : undefined;
  check(
    'admin user payload exposes role + status',
    firstUser !== undefined &&
      typeof firstUser.role === 'string' &&
      typeof firstUser.status === 'string' &&
      typeof firstUser.userId === 'string',
    `role=${firstUser?.role} status=${firstUser?.status}`,
  );

  const sellersOnly = await api('GET', '/api/v1/admin/users?role=SELLER', { token: adminToken });
  check(
    'GET /admin/users?role=SELLER filters by role',
    sellersOnly.status === 200 &&
      Array.isArray(sellersOnly.body) &&
      sellersOnly.body.every((candidate: any) => candidate.role === 'SELLER'),
    `status=${sellersOnly.status} count=${Array.isArray(sellersOnly.body) ? sellersOnly.body.length : 'n/a'}`,
  );

  const badRole = await api('GET', '/api/v1/admin/users?role=NOPE', { token: adminToken });
  check(
    'unknown role filter -> 400 with details.field',
    badRole.status === 400 && badRole.body?.details?.field === 'role',
    `status=${badRole.status} field=${badRole.body?.details?.field}`,
  );

  const audit = await api('GET', '/api/v1/admin/audit-logs?page=1&limit=3', { token: adminToken });
  check(
    'GET /admin/audit-logs paginates',
    audit.status === 200 &&
      Array.isArray(audit.body?.items) &&
      audit.body.items.length <= 3 &&
      typeof audit.body.total === 'number' &&
      audit.body.page === 1 &&
      audit.body.limit === 3,
    `status=${audit.status} items=${audit.body?.items?.length} total=${audit.body?.total}`,
  );

  const filteredAudit = await api(
    'GET',
    '/api/v1/admin/audit-logs?action=USER_LOGIN&limit=5',
    { token: adminToken },
  );
  check(
    'GET /admin/audit-logs filters by action',
    filteredAudit.status === 200 &&
      Array.isArray(filteredAudit.body?.items) &&
      filteredAudit.body.items.every((entry: any) => entry.action === 'USER_LOGIN'),
    `status=${filteredAudit.status} items=${filteredAudit.body?.items?.length}`,
  );

  const dashboard = await api('GET', '/api/v1/admin/dashboard', { token: adminToken });
  check(
    'GET /admin/dashboard returns numeric KPIs',
    dashboard.status === 200 &&
      [
        'activeOrders',
        'totalSales',
        'totalOrders',
        'totalUsers',
        'totalSellers',
        'totalProducts',
        'publishedProducts',
        'pendingReturns',
      ].every((key) => typeof dashboard.body?.[key] === 'number'),
    `status=${dashboard.status} body=${JSON.stringify(dashboard.body)}`,
  );

  // -------------------------------------------------- atomic seller onboarding
  const duplicateEmail = await api('POST', '/api/v1/admin/sellers/onboarding', {
    token: adminToken,
    body: {
      account: {
        firstName: 'Dup',
        lastName: 'Email',
        email: 'vendedor@test.com',
        password: 'Onboard1234!',
        phone: '3001234567',
        identityDocumentType: 'CC',
        identityDocumentNumber: `DUP-${runSuffix}`,
      },
      seller: { commercialName: `Dup Email ${runSuffix}`, personType: 'Natural' },
      warehouse: {
        name: `Dup Email WH ${runSuffix}`,
        country: 'Colombia',
        department: 'Antioquia',
        city: 'Medellin',
        address: 'Calle Dup 1',
        postalCode: '050001',
        capacity: 10,
      },
    },
  });
  check(
    'onboarding with an existing email -> 409',
    duplicateEmail.status === 409 && duplicateEmail.body?.code === 'RESOURCE_ALREADY_EXISTS',
    `status=${duplicateEmail.status} code=${duplicateEmail.body?.code}`,
  );

  const rolledBackEmail = `rollback.${runSuffix}@test.com`;
  const rolledBackName = `Rollback Seller ${runSuffix}`;
  const onboardingPayload = (capacity: number): Record<string, unknown> => ({
    account: {
      firstName: 'Rollback',
      lastName: 'Seller',
      email: rolledBackEmail,
      password: 'Onboard1234!',
      phone: '3001234568',
      identityDocumentType: 'CC',
      identityDocumentNumber: `RB-${runSuffix}`,
    },
    seller: { commercialName: rolledBackName, personType: 'Natural' },
    warehouse: {
      name: `Rollback WH ${runSuffix}`,
      country: 'Colombia',
      department: 'Antioquia',
      city: 'Medellin',
      address: 'Calle Rollback 1',
      postalCode: '050001',
      // Out of INT range: the warehouse insert fails after user + seller were
      // written, so the whole transaction must roll back.
      capacity,
    },
  });

  const forcedFailure = await api('POST', '/api/v1/admin/sellers/onboarding', {
    token: adminToken,
    body: onboardingPayload(99999999999),
  });
  check(
    'warehouse failure surfaces as an error (never 201)',
    forcedFailure.status >= 400,
    `status=${forcedFailure.status} code=${forcedFailure.body?.code}`,
  );

  // Replaying the exact same email + commercial name only succeeds if the
  // failed transaction left no orphan rows.
  const retry = await api('POST', '/api/v1/admin/sellers/onboarding', {
    token: adminToken,
    body: onboardingPayload(20),
  });
  check(
    'failed warehouse step rolls back user + seller (retry succeeds)',
    retry.status === 201 && typeof retry.body?.sellerId === 'string',
    `status=${retry.status} body=${JSON.stringify(retry.body)}`,
  );

  if (retry.status === 201) {
    const listed = await api('GET', '/api/v1/admin/users?role=SELLER', { token: adminToken });
    const created = Array.isArray(listed.body)
      ? listed.body.find((candidate: any) => candidate.email === rolledBackEmail)
      : undefined;
    check(
      'onboarded seller is listed by GET /admin/users',
      created !== undefined && created.role === 'SELLER',
      `found=${created !== undefined}`,
    );

    const approved = await api(
      'POST',
      `/api/v1/admin/sellers/${retry.body.sellerId}/approve`,
      { token: adminToken },
    );
    check(
      'new seller can be approved',
      approved.status === 200 && approved.body?.verificationStatus === 'Verified',
      `status=${approved.status} verification=${approved.body?.verificationStatus}`,
    );
  }

  // -------------------------------------------- seller products + publish gate
  const sellerToken = await login('vendedor@test.com', 'Seller1234!');
  const productList = await api('GET', '/api/v1/seller/products', { token: sellerToken });
  check(
    'GET /seller/products lists owned products',
    productList.status === 200 &&
      Array.isArray(productList.body) &&
      productList.body.every((candidate: any) => typeof candidate.productId === 'string'),
    `status=${productList.status} count=${Array.isArray(productList.body) ? productList.body.length : 'n/a'}`,
  );

  const created = await api('POST', '/api/v1/seller/products', {
    token: sellerToken,
    body: {
      name: `Gate Product ${runSuffix}`,
      description: 'Publish gate coverage',
      price: 15,
      stock: 4,
      category: 'Electronics',
    },
  });
  const gateId: string = created.body?.productId ?? '';
  check('create draft product without SKU -> 201', created.status === 201 && gateId.length > 0, `status=${created.status}`);

  const publishNoSku = await api('POST', `/api/v1/seller/products/${gateId}/publish`, {
    token: sellerToken,
  });
  check(
    'publish without SKU -> 422 field=sku',
    publishNoSku.status === 422 && publishNoSku.body?.details?.field === 'sku',
    `status=${publishNoSku.status} field=${publishNoSku.body?.details?.field}`,
  );

  const image = await api('POST', `/api/v1/seller/products/${gateId}/images`, {
    token: sellerToken,
    body: { url: 'https://cdn.example.com/gate.png', altText: 'Gate' },
  });
  check('add product image -> 201', image.status === 201, `status=${image.status}`);

  const updated = await api('PUT', `/api/v1/seller/products/${gateId}`, {
    token: sellerToken,
    body: { sku: `GATE-${runSuffix}` },
  });
  check('PUT /seller/products/:id updates fields', updated.status === 200 && updated.body?.sku === `GATE-${runSuffix}`, `status=${updated.status} sku=${updated.body?.sku}`);

  const published = await api('POST', `/api/v1/seller/products/${gateId}/publish`, {
    token: sellerToken,
  });
  check(
    'publish with SKU + image -> 200 Published',
    published.status === 200 &&
      String(published.body?.status ?? '').toUpperCase() === 'PUBLISHED',
    `status=${published.status} body=${JSON.stringify(published.body)}`,
  );

  const images = await api('GET', `/api/v1/seller/products/${gateId}/images`, { token: sellerToken });
  check(
    'GET product images lists the uploaded image',
    images.status === 200 && Array.isArray(images.body) && images.body.length === 1,
    `status=${images.status} count=${Array.isArray(images.body) ? images.body.length : 'n/a'}`,
  );

  if (Array.isArray(images.body) && images.body.length > 0) {
    const removed = await api(
      'DELETE',
      `/api/v1/seller/products/${gateId}/images/${images.body[0].imageId}`,
      { token: sellerToken },
    );
    check('DELETE product image -> 204', removed.status === 204, `status=${removed.status}`);
  }

  const sellerDashboard = await api('GET', '/api/v1/seller/dashboard', { token: sellerToken });
  check(
    'GET /seller/dashboard returns numeric KPIs',
    sellerDashboard.status === 200 &&
      typeof sellerDashboard.body?.totalProducts === 'number' &&
      typeof sellerDashboard.body?.totalSales === 'number' &&
      typeof sellerDashboard.body?.pendingReturns === 'number',
    `status=${sellerDashboard.status} body=${JSON.stringify(sellerDashboard.body)}`,
  );

  // --------------------------------------------------- returns + logistics
  const buyerSuffix = `${runSuffix}${Math.floor(Math.random() * 1000)}`;
  const buyerEmail = `phase5.buyer.${buyerSuffix}@test.com`;
  const registration = await api('POST', '/api/v1/auth/register/buyer', {
    body: {
      email: buyerEmail,
      password: 'Buyer1234!',
      firstName: 'Phase',
      lastName: 'Five',
      phoneNumber: `+5731${Math.floor(Math.random() * 1e8)}`,
      identification: `P5-${buyerSuffix}`,
    },
  });
  const buyerToken = await login(buyerEmail, 'Buyer1234!');
  check('register + login phase-5 buyer', registration.status === 201 && buyerToken.length > 0, `status=${registration.status}`);

  // A sellable product with stock is required to create a real (not delivered)
  // order and exercise the return gate.
  const sellable = await api('POST', '/api/v1/seller/products', {
    token: sellerToken,
    body: {
      name: `Return Product ${runSuffix}`,
      description: 'Return gate coverage',
      price: 25,
      stock: 5,
      sku: `RET-${runSuffix}`,
      category: 'Home',
    },
  });
  const sellableId: string = sellable.body?.productId ?? '';
  const warehouseId = globalThis.crypto.randomUUID();
  const warehouse = await api('POST', '/api/v1/seller/warehouses', {
    token: sellerToken,
    body: {
      warehouseId,
      name: `Return WH ${runSuffix}`,
      country: 'Colombia',
      department: 'Antioquia',
      city: 'Medellin',
      address: 'Calle Return 1',
      postalCode: '050001',
      capacity: 20,
      status: 'Operational',
    },
  });
  const stock = await api('POST', '/api/v1/seller/inventory/stock-entry', {
    token: sellerToken,
    body: {
      productId: sellableId,
      warehouseId,
      quantity: 5,
      receiptReference: `RET-${runSuffix}`,
    },
  });
  check(
    'return fixture has warehouse + stock',
    warehouse.status === 201 && stock.status === 200,
    `warehouse=${warehouse.status} stock=${stock.status}`,
  );

  await api('POST', '/api/v1/buyer/cart', { token: buyerToken });
  const cartItem = await api('POST', '/api/v1/buyer/cart/items', {
    token: buyerToken,
    body: { productId: sellableId, quantity: 1 },
  });
  check('add sellable item to cart', cartItem.status === 201 || cartItem.status === 200, `status=${cartItem.status}`);

  const checkout = await api('POST', '/api/v1/buyer/checkout', {
    token: buyerToken,
    body: { deliveryAddress: ADDRESS, paymentMethod: PAYMENT },
  });
  const orderId: string = checkout.body?.orderId ?? '';
  check('checkout creates an order', checkout.status === 201 && orderId.length > 0, `status=${checkout.status} orderId=${orderId}`);

  if (orderId.length > 0) {
    const prematureReturn = await api('POST', `/api/v1/buyer/orders/${orderId}/returns`, {
      token: buyerToken,
      body: { reason: 'Other', evidence: 'Not delivered yet' },
    });
    check(
      'return on a non-delivered order -> 422',
      prematureReturn.status === 422 && prematureReturn.body?.code === 'INVALID_DOMAIN_VALUE',
      `status=${prematureReturn.status} code=${prematureReturn.body?.code}`,
    );

    const buyerReturns = await api('GET', '/api/v1/buyer/returns', { token: buyerToken });
    check(
      'GET /buyer/returns returns the buyer collection',
      buyerReturns.status === 200 && Array.isArray(buyerReturns.body),
      `status=${buyerReturns.status} count=${Array.isArray(buyerReturns.body) ? buyerReturns.body.length : 'n/a'}`,
    );
  }

  const logisticsToken = await login('logistics@test.com', 'Logistics1234!');
  const shipments = await api('GET', '/api/v1/logistics/shipments', {
    token: logisticsToken,
  });
  check(
    'GET /logistics/shipments returns an array',
    shipments.status === 200 && Array.isArray(shipments.body),
    `status=${shipments.status} count=${Array.isArray(shipments.body) ? shipments.body.length : 'n/a'}`,
  );

  const badShipmentStatus = await api('GET', '/api/v1/logistics/shipments?status=Bogus', {
    token: logisticsToken,
  });
  check(
    'unknown shipment status -> 400 field=status',
    badShipmentStatus.status === 400 && badShipmentStatus.body?.details?.field === 'status',
    `status=${badShipmentStatus.status} field=${badShipmentStatus.body?.details?.field}`,
  );

  const returns = await api('GET', '/api/v1/logistics/returns', { token: logisticsToken });
  check(
    'GET /logistics/returns returns an array',
    returns.status === 200 && Array.isArray(returns.body),
    `status=${returns.status} count=${Array.isArray(returns.body) ? returns.body.length : 'n/a'}`,
  );

  const missingReturn = await api(
    'PATCH',
    `/api/v1/logistics/returns/${globalThis.crypto.randomUUID()}/receive`,
    { token: logisticsToken },
  );
  check(
    'receive unknown return -> 404',
    missingReturn.status === 404 && missingReturn.body?.code === 'RESOURCE_NOT_FOUND',
    `status=${missingReturn.status} code=${missingReturn.body?.code}`,
  );
}

function preliminaryStatus(result: ApiResult): number {
  return result.status;
}

await main();

const failures = results.filter((entry) => entry.level === 'FAIL');
const notes = results.filter((entry) => entry.level === 'NOTE');
console.log('\n=========== NEW ENDPOINT SUMMARY ===========');
console.log(`PASS: ${results.filter((entry) => entry.level === 'PASS').length}  NOTE: ${notes.length}  FAIL: ${failures.length}`);
if (failures.length > 0) {
  console.log('\nFAILURES:');
  for (const failure of failures) console.log(` - ${failure.name}: ${failure.detail}`);
  process.exitCode = 1;
}
