/**
 * End-to-end business cycle:
 *   checkout (BUYER) -> approve/prepare (SELLER) -> automatic shipment ->
 *   dispatch/confirm-delivery (LOGISTICS) -> DELIVERED order -> return window.
 *
 * Runs against a live server (default http://localhost:3000).
 *
 * Usage: node_modules/.bin/tsx tests/integration/shipment-lifecycle.test.ts
 */
const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:3000';

interface ApiResult {
  status: number;
  body: any;
}

const results: Array<{ name: string; level: 'PASS' | 'FAIL'; detail: string }> = [];

function record(name: string, level: 'PASS' | 'FAIL', detail: string): void {
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

async function main(): Promise<void> {
  const runSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const sellerToken = await login('vendedor@test.com', 'Seller1234!');
  const logisticsToken = await login('logistics@test.com', 'Logistics1234!');
  const adminToken = await login('admin@test.com', 'Admin1234!');
  check(
    'seed logins (seller, logistics, admin)',
    sellerToken.length > 0 && logisticsToken.length > 0 && adminToken.length > 0,
    `seller=${sellerToken.length > 0} logistics=${logisticsToken.length > 0} admin=${adminToken.length > 0}`,
  );

  // --------------------------------------------------------------- fixture
  const product = await api('POST', '/api/v1/seller/products', {
    token: sellerToken,
    body: {
      name: `Lifecycle Product ${runSuffix}`,
      description: 'Full shipment lifecycle',
      price: 30,
      stock: 3,
      sku: `LIFE-${runSuffix}`,
      category: 'Home',
    },
  });
  const productId: string = product.body?.productId ?? '';
  const warehouseId = globalThis.crypto.randomUUID();
  const warehouse = await api('POST', '/api/v1/seller/warehouses', {
    token: sellerToken,
    body: {
      warehouseId,
      name: `Lifecycle WH ${runSuffix}`,
      country: 'Colombia',
      department: 'Antioquia',
      city: 'Medellin',
      address: 'Calle Ciclo 1',
      postalCode: '050001',
      capacity: 30,
      status: 'Operational',
    },
  });
  const stock = await api('POST', '/api/v1/seller/inventory/stock-entry', {
    token: sellerToken,
    body: { productId, warehouseId, quantity: 3, receiptReference: `LIFE-${runSuffix}` },
  });
  check(
    'product + warehouse + stock fixture',
    product.status === 201 && warehouse.status === 201 && stock.status === 200,
    `product=${product.status} warehouse=${warehouse.status} stock=${stock.status}`,
  );

  const buyerEmail = `lifecycle.${runSuffix}@test.com`;
  const registration = await api('POST', '/api/v1/auth/register/buyer', {
    body: {
      email: buyerEmail,
      password: 'Buyer1234!',
      firstName: 'Lifecycle',
      lastName: 'Buyer',
      phoneNumber: `+5732${Math.floor(Math.random() * 1e8)}`,
      identification: `LIFE-${runSuffix}`,
    },
  });
  const buyerToken = await login(buyerEmail, 'Buyer1234!');
  check(
    'buyer registration + login',
    registration.status === 201 && buyerToken.length > 0,
    `status=${registration.status}`,
  );

  // --------------------------------------------------- 1. buyer checkout
  await api('POST', '/api/v1/buyer/cart', { token: buyerToken });
  const cartItem = await api('POST', '/api/v1/buyer/cart/items', {
    token: buyerToken,
    body: { productId, quantity: 1 },
  });
  const checkout = await api('POST', '/api/v1/buyer/checkout', {
    token: buyerToken,
    body: {
      deliveryAddress: {
        addressId: globalThis.crypto.randomUUID(),
        country: 'Colombia',
        department: 'Antioquia',
        city: 'Medellin',
        neighborhood: 'Laureles',
        address: 'Carrera 70 # 10-20',
        postalCode: '050001',
        reference: 'Portón azul',
        isPrimary: true,
      },
      paymentMethod: {
        paymentMethodId: globalThis.crypto.randomUUID(),
        type: 'CreditCard',
        maskedNumber: '**** **** **** 7777',
        cardholder: 'Lifecycle Buyer',
        expirationDate: '12/2030',
        brand: 'VISA',
        isDefault: true,
      },
    },
  });
  const orderId: string = checkout.body?.orderId ?? '';
  check(
    '1. buyer checkout creates the order',
    cartItem.status === 201 && checkout.status === 201 && orderId.length > 0,
    `cart=${cartItem.status} checkout=${checkout.status} orderId=${orderId}`,
  );

  // ---------------------------------- 2. seller approve + prepare
  const approved = await api(`POST`, `/api/v1/seller/orders/${orderId}/approve`, {
    token: sellerToken,
  });
  check(
    '2a. seller approves the order -> Confirmed',
    approved.status === 200 && approved.body?.orderStatus === 'Confirmed',
    `status=${approved.status} orderStatus=${approved.body?.orderStatus}`,
  );

  const prepared = await api('POST', `/api/v1/seller/orders/${orderId}/prepare`, {
    token: sellerToken,
  });
  check(
    '2b. seller prepares the order -> Preparing',
    prepared.status === 200 && prepared.body?.orderStatus === 'Preparing',
    `status=${prepared.status} orderStatus=${prepared.body?.orderStatus}`,
  );

  // Idempotency: repeating prepare must not duplicate the shipment.
  const preparedAgain = await api(
    'POST',
    `/api/v1/seller/orders/${orderId}/prepare`,
    { token: sellerToken },
  );
  check(
    '2c. repeated prepare is idempotent (200)',
    preparedAgain.status === 200,
    `status=${preparedAgain.status}`,
  );

  // ---------------------------------- 3. shipment visible to logistics
  const queue = await api('GET', '/api/v1/logistics/shipments', {
    token: logisticsToken,
  });
  const shipmentsForOrder = Array.isArray(queue.body)
    ? queue.body.filter((candidate: any) => candidate.orderId === orderId)
    : [];
  const shipment = shipmentsForOrder[0];
  check(
    '3a. shipment appears automatically in the logistics queue',
    queue.status === 200 && shipmentsForOrder.length === 1,
    `status=${queue.status} matches=${shipmentsForOrder.length}`,
  );
  check(
    '3b. shipment carries the expected contract fields',
    shipment !== undefined &&
      typeof shipment.shipmentId === 'string' &&
      shipment.warehouseId === warehouseId &&
      shipment.shipmentStatus === 'InPreparation' &&
      typeof shipment.trackingCode === 'string' &&
      shipment.trackingCode.length > 0 &&
      shipment.carrier?.name !== undefined &&
      shipment.deliveryAddress?.city === 'Medellin' &&
      shipment.deliveryAddress?.address === 'Carrera 70 # 10-20',
    `shipment=${JSON.stringify(shipment)}`,
  );

  const filteredQueue = await api(
    'GET',
    '/api/v1/logistics/shipments?status=InPreparation',
    { token: logisticsToken },
  );
  check(
    '3c. queue filters by InPreparation',
    filteredQueue.status === 200 &&
      Array.isArray(filteredQueue.body) &&
      filteredQueue.body.some((candidate: any) => candidate.orderId === orderId),
    `status=${filteredQueue.status} count=${filteredQueue.body?.length}`,
  );

  const shipmentId: string = shipment?.shipmentId ?? '';
  if (shipmentId.length === 0) {
    record('lifecycle aborted', 'FAIL', 'shipmentId missing');
    return;
  }

  // -------------------------------- 4. logistics dispatch + delivery
  const dispatched = await api(
    'POST',
    `/api/v1/logistics/shipments/${shipmentId}/dispatch`,
    { token: logisticsToken },
  );
  check(
    '4a. dispatch -> InTransit',
    dispatched.status === 200 && dispatched.body?.shipmentStatus === 'InTransit',
    `status=${dispatched.status} shipmentStatus=${dispatched.body?.shipmentStatus}`,
  );

  const delivered = await api(
    'POST',
    `/api/v1/logistics/shipments/${shipmentId}/confirm-delivery`,
    { token: logisticsToken },
  );
  check(
    '4b. confirm-delivery -> Delivered',
    delivered.status === 200 && delivered.body?.shipmentStatus === 'Delivered',
    `status=${delivered.status} shipmentStatus=${delivered.body?.shipmentStatus}`,
  );

  // ----------------------------- 5. buyer order DELIVERED + return window
  const afterDelivery = await api('GET', '/api/v1/logistics/shipments', {
    token: logisticsToken,
  });
  const deliveredShipment = Array.isArray(afterDelivery.body)
    ? afterDelivery.body.find((candidate: any) => candidate.orderId === orderId)
    : undefined;
  const deliveredShippingDate: string | undefined = deliveredShipment?.deliveryDate;
  check(
    '4c. delivery date is persisted for the return window',
    deliveredShipment?.shipmentStatus === 'Delivered' &&
      typeof deliveredShippingDate === 'string' &&
      !Number.isNaN(Date.parse(deliveredShippingDate)),
    `shipmentStatus=${deliveredShipment?.shipmentStatus} deliveryDate=${deliveredShippingDate}`,
  );
  const orderDetail = await api('GET', `/api/v1/buyer/orders/${orderId}`, {
    token: buyerToken,
  });
  check(
    '5a. buyer order is DELIVERED',
    orderDetail.status === 200 && orderDetail.body?.orderStatus === 'Delivered',
    `status=${orderDetail.status} orderStatus=${orderDetail.body?.orderStatus}`,
  );

  const returnRequest = await api(
    'POST',
    `/api/v1/buyer/orders/${orderId}/returns`,
    {
      token: buyerToken,
      body: { reason: 'Damage', evidence: 'Box arrived crushed' },
    },
  );
  const probeQueue = await api('GET', '/api/v1/logistics/shipments', {
    token: logisticsToken,
  });
  const probe = Array.isArray(probeQueue.body)
    ? probeQueue.body.find((candidate: any) => candidate.orderId === orderId)
    : undefined;
  // The delivery instant is stored with second precision, so it may be rounded
  // up by at most one second; never further.
  const deliverySkewMs =
    typeof probe?.deliveryDate === 'string'
      ? Date.parse(probe.deliveryDate) - Date.now()
      : Number.NaN;
  check(
    '5b. delivery timestamp is not in the future beyond storage precision',
    Number.isFinite(deliverySkewMs) && deliverySkewMs <= 1000,
    `deliveryDate=${probe?.deliveryDate} skewMs=${deliverySkewMs}`,
  );
  const returnId: string = returnRequest.body?.returnId ?? '';
  check(
    '5c. delivered order accepts a return within 30 days',
    returnRequest.status === 201 &&
      returnRequest.body?.returnStatus === 'Requested' &&
      returnId.length > 0,
    `status=${returnRequest.status} returnStatus=${returnRequest.body?.returnStatus} message=${returnRequest.body?.message}`,
  );

  const duplicateReturn = await api(
    'POST',
    `/api/v1/buyer/orders/${orderId}/returns`,
    { token: buyerToken, body: { reason: 'Other' } },
  );
  check(
    '5d. duplicate active return -> 409',
    duplicateReturn.status === 409 && duplicateReturn.body?.code === 'RESOURCE_ALREADY_EXISTS',
    `status=${duplicateReturn.status} code=${duplicateReturn.body?.code}`,
  );

  const logisticsReturns = await api(
    'GET',
    '/api/v1/logistics/returns?status=Requested',
    { token: logisticsToken },
  );
  check(
    '5e. return is visible in the logistics inbox',
    logisticsReturns.status === 200 &&
      Array.isArray(logisticsReturns.body) &&
      logisticsReturns.body.some((candidate: any) => candidate.returnId === returnId),
    `status=${logisticsReturns.status} count=${logisticsReturns.body?.length}`,
  );

  const received = await api(
    'PATCH',
    `/api/v1/logistics/returns/${returnId}/receive`,
    { token: logisticsToken },
  );
  check(
    '5f. logistics receives the return -> Completed',
    received.status === 200 &&
      received.body?.returnStatus === 'Completed' &&
      typeof received.body?.receivedDate === 'string',
    `status=${received.status} returnStatus=${received.body?.returnStatus}`,
  );

  // ------------------------------------------------------- audit evidence
  const audit = await api('GET', '/api/v1/admin/audit-logs?action=SHIPMENT_CREATED&limit=5', {
    token: adminToken,
  });
  const auditHit = Array.isArray(audit.body?.items)
    ? audit.body.items.some((entry: any) => entry.details?.orderId === orderId)
    : false;
  check(
    '6. SHIPMENT_CREATED audit event was recorded',
    audit.status === 200 && auditHit,
    `status=${audit.status} total=${audit.body?.total} hit=${auditHit}`,
  );
}

await main();

const failures = results.filter((entry) => entry.level === 'FAIL');
console.log('\n========== LIFECYCLE SUMMARY ==========');
console.log(`PASS: ${results.filter((entry) => entry.level === 'PASS').length}  FAIL: ${failures.length}`);
if (failures.length > 0) {
  console.log('\nFAILURES:');
  for (const failure of failures) console.log(` - ${failure.name}: ${failure.detail}`);
  process.exitCode = 1;
}
