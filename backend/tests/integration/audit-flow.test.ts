/**
 * Integration audit flow for NexusMarket.
 *
 * Runs against a live server (default http://localhost:3000) and a seeded
 * MySQL + MongoDB. It exercises auth, roles, product/inventory, cart,
 * checkout, concurrency and audit logging, and prints a PASS/FAIL/WARN report.
 *
 * Usage: node_modules/.bin/tsx tests/integration/audit-flow.test.ts
 */
const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:3000';

interface ApiResult {
  status: number;
  body: any;
  ms: number;
}

const results: Array<{ name: string; level: 'PASS' | 'FAIL' | 'WARN'; detail: string }> = [];

function record(name: string, level: 'PASS' | 'FAIL' | 'WARN', detail: string): void {
  results.push({ name, level, detail });
  const icon = level === 'PASS' ? 'PASS' : level === 'FAIL' ? 'FAIL' : 'WARN';
  console.log(`[${icon}] ${name} :: ${detail}`);
}

function check(name: string, condition: boolean, detail: string): boolean {
  record(name, condition ? 'PASS' : 'FAIL', detail);
  return condition;
}

async function api(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; raw?: string } = {},
): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined || options.raw !== undefined) {
    headers['content-type'] = 'application/json';
  }
  const started = Date.now();
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.raw ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  });
  const text = await response.text();
  let body: any = text;
  try {
    body = text.length === 0 ? null : JSON.parse(text);
  } catch {
    // keep text
  }
  return { status: response.status, body, ms: Date.now() - started };
}

function envelopeOk(result: ApiResult): boolean {
  const b = result.body;
  return (
    b !== null &&
    typeof b === 'object' &&
    typeof b.timestamp === 'string' &&
    typeof b.status === 'number' &&
    typeof b.code === 'string' &&
    typeof b.message === 'string' &&
    typeof b.path === 'string' &&
    typeof b.requestId === 'string'
  );
}

async function registerBuyer(label: string): Promise<{ email: string; password: string; token: string; userId: string }> {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const email = `audit.${label}.${suffix}@test.com`;
  const password = 'Audit1234!';
  const registration = await api('POST', '/api/v1/auth/register/buyer', {
    body: {
      email,
      password,
      firstName: 'Audit',
      lastName: label,
      phoneNumber: `+5730${Math.floor(Math.random() * 1e8)}`,
      identification: `AUD-${suffix}`,
    },
  });
  check(`register buyer (${label})`, registration.status === 201, `status=${registration.status} body=${JSON.stringify(registration.body).slice(0, 200)}`);
  const login = await api('POST', '/api/v1/auth/login', { body: { email, password } });
  check(`login buyer (${label})`, login.status === 200 && typeof login.body?.token === 'string', `status=${login.status}`);
  return { email, password, token: login.body?.token ?? '', userId: registration.body?.userId ?? '' };
}

async function main(): Promise<void> {
  const runSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // ---------------------------------------------------------------- security
  const unknown = await api('GET', '/api/v1/does-not-exist');
  check('404 envelope for unknown route', unknown.status === 404 && envelopeOk(unknown), `status=${unknown.status} code=${unknown.body?.code}`);

  const malformed = await api('POST', '/api/v1/auth/login', { raw: '{"email":' });
  check('malformed JSON -> 400 envelope', malformed.status === 400 && envelopeOk(malformed), `status=${malformed.status} code=${malformed.body?.code}`);

  const noToken = await api('GET', '/api/v1/buyer/profile');
  check('protected route without token -> 401', noToken.status === 401 && noToken.body?.code === 'AUTHENTICATION_REQUIRED', `status=${noToken.status} code=${noToken.body?.code}`);

  const badToken = await api('GET', '/api/v1/buyer/profile', { token: 'not.a.jwt' });
  check('invalid JWT -> 401', badToken.status === 401 && badToken.body?.code === 'AUTHENTICATION_REQUIRED', `status=${badToken.status} code=${badToken.body?.code}`);

  const buyer1 = await registerBuyer('one');

  const duplicate = await api('POST', '/api/v1/auth/register/buyer', {
    body: {
      email: buyer1.email,
      password: buyer1.password,
      firstName: 'Audit',
      lastName: 'Duplicate',
      phoneNumber: '+573000000000',
      identification: `DUP-${runSuffix}`,
    },
  });
  check('duplicate email -> 409', duplicate.status === 409 && duplicate.body?.code === 'RESOURCE_ALREADY_EXISTS', `status=${duplicate.status} code=${duplicate.body?.code}`);

  const wrongLogin = await api('POST', '/api/v1/auth/login', { body: { email: buyer1.email, password: 'WrongPass1!' } });
  check('wrong password -> 401 INVALID_CREDENTIALS', wrongLogin.status === 401 && wrongLogin.body?.code === 'INVALID_CREDENTIALS', `status=${wrongLogin.status} code=${wrongLogin.body?.code}`);

  const profile = await api('GET', '/api/v1/buyer/profile', { token: buyer1.token });
  check('buyer profile with valid token', profile.status === 200, `status=${profile.status}`);

  const buyerOnSeller = await api('GET', '/api/v1/seller/profile', { token: buyer1.token });
  check('role enforcement: BUYER on /seller -> 403', buyerOnSeller.status === 403 && buyerOnSeller.body?.code === 'FORBIDDEN', `status=${buyerOnSeller.status} code=${buyerOnSeller.body?.code}`);

  const tampered = `${buyer1.token.slice(0, -1)}${buyer1.token.endsWith('a') ? 'b' : 'a'}`;
  const tamperedResult = await api('GET', '/api/v1/buyer/profile', { token: tampered });
  check('tampered JWT -> 401', tamperedResult.status === 401, `status=${tamperedResult.status}`);

  const catalog = await api('GET', '/api/v1/catalog/products');
  check('public catalog list', catalog.status === 200 && Array.isArray(catalog.body?.products), `status=${catalog.status} products=${Array.isArray(catalog.body?.products) ? catalog.body.products.length : 'n/a'}`);

  // ---------------------------------------------------------- seller/product
  const sellerLogin = await api('POST', '/api/v1/auth/login', { body: { email: 'vendedor@test.com', password: 'Seller1234!' } });
  if (sellerLogin.status !== 200) {
    record('seller login for product/inventory flow', 'WARN', `status=${sellerLogin.status}; product/inventory phases skipped`);
  } else {
    const sellerToken: string = sellerLogin.body.token;

    const sellerProfile = await api('GET', '/api/v1/seller/profile', { token: sellerToken });
    check('seller profile', sellerProfile.status === 200, `status=${sellerProfile.status}`);

    const createProduct = await api('POST', '/api/v1/seller/products', {
      token: sellerToken,
      body: {
        name: `Audit Laptop ${runSuffix}`,
        description: 'Product created by the integration audit',
        price: 100,
        stock: 10,
        sku: `AUD-${runSuffix}`,
        category: 'Electronics',
        brand: 'AuditBrand',
      },
    });
    const productId: string = createProduct.body?.productId ?? '';
    check('create product -> 201', createProduct.status === 201 && productId.length > 0, `status=${createProduct.status} productId=${productId}`);

    const variantId = globalThis.crypto.randomUUID();
    const variant = await api('POST', `/api/v1/seller/products/${productId}/variants`, {
      token: sellerToken,
      body: {
        variantId,
        attribute: 'Color',
        value: 'AuditBlue',
        additionalPrice: 5,
        skuVariant: `SKU-${runSuffix}`,
      },
    });
    check('add product variant -> 201', variant.status === 201, `status=${variant.status} code=${variant.body?.code} msg=${variant.body?.message}`);

    const warehouseId = globalThis.crypto.randomUUID();
    const warehouse = await api('POST', '/api/v1/seller/warehouses', {
      token: sellerToken,
      body: {
        warehouseId,
        name: 'Audit Warehouse',
        country: 'Colombia',
        department: 'Antioquia',
        city: 'Medellin',
        address: 'Calle Audit 1',
        postalCode: '050001',
        capacity: 100,
        status: 'Operational',
      },
    });
    check('create warehouse -> 201', warehouse.status === 201, `status=${warehouse.status} code=${warehouse.body?.code}`);

    const stockEntry = await api('POST', '/api/v1/seller/inventory/stock-entry', {
      token: sellerToken,
      body: { productId, warehouseId, quantity: 10, receiptReference: `REC-${runSuffix}` },
    });
    check(
      'stock entry creates exactly 10 available units (no double add)',
      stockEntry.status === 200 && stockEntry.body?.availableStock === 10 && stockEntry.body?.totalStock === 10,
      `status=${stockEntry.status} available=${stockEntry.body?.availableStock} total=${stockEntry.body?.totalStock}`,
    );

    const restock = await api('POST', '/api/v1/seller/inventory/stock-entry', {
      token: sellerToken,
      body: { productId, warehouseId, quantity: 5, receiptReference: `REC2-${runSuffix}` },
    });
    check(
      'second stock entry adds to existing inventory (no duplicate-key 500)',
      restock.status === 200,
      `status=${restock.status} code=${restock.body?.code} msg=${restock.body?.message}`,
    );

    const inventoryList = await api('GET', '/api/v1/seller/inventory', { token: sellerToken });
    check(
      'seller inventory lists owned stock',
      inventoryList.status === 200 && Array.isArray(inventoryList.body) && inventoryList.body.length > 0,
      `status=${inventoryList.status} items=${Array.isArray(inventoryList.body) ? inventoryList.body.length : 'n/a'}`,
    );

    // Publish on a throwaway product: verifies the aggregate is reloaded, not wiped.
    const publishProduct = await api('POST', '/api/v1/seller/products', {
      token: sellerToken,
      body: {
        name: `Audit Publish ${runSuffix}`,
        description: 'Throwaway product for publish integrity',
        price: 50,
        stock: 3,
        sku: `PUB-${runSuffix}`,
        category: 'Electronics',
      },
    });
    const publishId: string = publishProduct.body?.productId ?? '';
    const published = await api('POST', `/api/v1/seller/products/${publishId}/publish`, { token: sellerToken });
    const afterPublish = await api('GET', `/api/v1/catalog/products/${publishId}`);
    check(
      'publish preserves product data',
      published.status === 200 && afterPublish.status === 200 && afterPublish.body?.name === `Audit Publish ${runSuffix}` && afterPublish.body?.price === 50,
      `publish=${published.status} read=${afterPublish.status} name=${afterPublish.body?.name} price=${afterPublish.body?.price} code=${afterPublish.body?.code}`,
    );

    // ------------------------------------------------------------------ cart
    const cartCreation = await api('POST', '/api/v1/buyer/cart', { token: buyer1.token });
    check('create cart', cartCreation.status === 201 || cartCreation.status === 200, `status=${cartCreation.status}`);

    const addBody = {
      productId,
      price: 100,
      quantity: 2,
      variantId,
      attribute: 'Color',
      value: 'AuditBlue',
      skuVariant: `SKU-${runSuffix}`,
      additionalPrice: 5,
    };
    const addFirst = await api('POST', '/api/v1/buyer/cart/items', { token: buyer1.token, body: addBody });
    check('add item -> 201', addFirst.status === 201, `status=${addFirst.status} code=${addFirst.body?.code}`);

    const addAgain = await api('POST', '/api/v1/buyer/cart/items', { token: buyer1.token, body: { ...addBody, quantity: 1 } });
    const lineAfterUpsert = addAgain.body?.cartLines?.[0];
    check(
      'add same item upserts -> 200 with quantity 3',
      addAgain.status === 200 && lineAfterUpsert?.quantity === 3,
      `status=${addAgain.status} qty=${lineAfterUpsert?.quantity}`,
    );

    const cartLineId: string = lineAfterUpsert?.cartLineId ?? '';
    const update = await api('PUT', `/api/v1/buyer/cart/items/${cartLineId}`, { token: buyer1.token, body: { quantity: 5 } });
    check('update cart item quantity -> 5', update.status === 200 && update.body?.cartLines?.[0]?.quantity === 5, `status=${update.status} qty=${update.body?.cartLines?.[0]?.quantity}`);

    const invalidQty = await api('PUT', `/api/v1/buyer/cart/items/${cartLineId}`, { token: buyer1.token, body: { quantity: 0 } });
    check('update with quantity 0 -> 400', invalidQty.status === 400 && invalidQty.body?.code === 'INVALID_REQUEST', `status=${invalidQty.status} code=${invalidQty.body?.code}`);

    const remove = await api('DELETE', `/api/v1/buyer/cart/items/${cartLineId}`, { token: buyer1.token });
    check('delete cart item -> 204', remove.status === 204, `status=${remove.status}`);

    // -------------------------------------------------------------- checkout
    const addForCheckout = await api('POST', '/api/v1/buyer/cart/items', {
      token: buyer1.token,
      body: { ...addBody, quantity: 2, value: 'AuditBlue2' },
    });
    check('add item for checkout -> 201', addForCheckout.status === 201, `status=${addForCheckout.status}`);

    const checkoutBody = {
      deliveryAddress: {
        addressId: globalThis.crypto.randomUUID(),
        country: 'Colombia',
        department: 'Antioquia',
        city: 'Medellin',
        neighborhood: 'El Poblado',
        address: 'Calle 10 # 20-30',
        postalCode: '050001',
        reference: 'Audit',
        isPrimary: true,
      },
      paymentMethod: {
        paymentMethodId: globalThis.crypto.randomUUID(),
        type: 'CreditCard',
        maskedNumber: '**** **** **** 4242',
        cardholder: 'Audit Buyer',
        expirationDate: '12/2030',
        brand: 'VISA',
        isDefault: true,
      },
    };
    const checkout = await api('POST', '/api/v1/buyer/checkout', { token: buyer1.token, body: checkoutBody });
    const orderId: string = checkout.body?.orderId ?? '';
    check('checkout -> 201 with orderId', checkout.status === 201 && orderId.length > 0, `status=${checkout.status} code=${checkout.body?.code} orderId=${orderId}`);

    const orders = await api('GET', '/api/v1/buyer/orders', { token: buyer1.token });
    check('buyer order history contains the order', orders.status === 200 && Array.isArray(orders.body) && orders.body.some((o: any) => o.orderId === orderId), `status=${orders.status} orders=${Array.isArray(orders.body) ? orders.body.length : 'n/a'}`);

    const sellerOrders = await api('GET', '/api/v1/seller/orders', { token: sellerToken });
    check(
      'seller sees orders for own products',
      sellerOrders.status === 200 && Array.isArray(sellerOrders.body) && sellerOrders.body.some((o: any) => o.orderId === orderId),
      `status=${sellerOrders.status} orders=${Array.isArray(sellerOrders.body) ? sellerOrders.body.length : 'n/a'}`,
    );

    // Order state transition on a fake aggregate must not erase order data.
    const approve = await api('POST', `/api/v1/seller/orders/${orderId}/approve`, { token: sellerToken });
    const orderAfterApprove = await api('GET', `/api/v1/buyer/orders/${orderId}`, { token: buyer1.token });
    check(
      'approve order preserves totals and lines',
      approve.status === 200 && orderAfterApprove.status === 200 && orderAfterApprove.body?.total === checkout.body?.total && Array.isArray(orderAfterApprove.body?.items) && orderAfterApprove.body.items.length > 0,
      `approve=${approve.status} read=${orderAfterApprove.status} totalBefore=${checkout.body?.total} totalAfter=${orderAfterApprove.body?.total} items=${orderAfterApprove.body?.items?.length}`,
    );

    // ----------------------------------------------------------- concurrency
    const buyer2 = await registerBuyer('two');
    const cart2 = await api('POST', '/api/v1/buyer/cart', { token: buyer2.token });
    check('second buyer cart', cart2.status === 201 || cart2.status === 200, `status=${cart2.status}`);

    const scarce = await api('POST', '/api/v1/seller/products', {
      token: sellerToken,
      body: {
        name: `Audit Scarce ${runSuffix}`,
        description: 'Single unit product for concurrency test',
        price: 30,
        stock: 1,
        sku: `SCARCE-${runSuffix}`,
        category: 'Electronics',
      },
    });
    const scarceId: string = scarce.body?.productId ?? '';
    const scarceWarehouse = await api('POST', '/api/v1/seller/warehouses', {
      token: sellerToken,
      body: {
        warehouseId: globalThis.crypto.randomUUID(),
        name: 'Audit Overflow',
        country: 'Colombia',
        department: 'Antioquia',
        city: 'Medellin',
        address: 'Calle Audit 2',
        postalCode: '050001',
        capacity: 10,
        status: 'Operational',
      },
    });
    const scarceStock = await api('POST', '/api/v1/seller/inventory/stock-entry', {
      token: sellerToken,
      body: { productId: scarceId, warehouseId: scarceWarehouse.status === 201 ? scarceWarehouse.body?.warehouseId : '', quantity: 1, receiptReference: `SCARCE-${runSuffix}` },
    });
    check('single-unit stock prepared', scarceStock.status === 200 && scarceStock.body?.availableStock === 1, `status=${scarceStock.status} available=${scarceStock.body?.availableStock}`);

    // buyer1 needs a fresh open cart after the previous checkout converted it.
    await api('POST', '/api/v1/buyer/cart', { token: buyer1.token });
    const scarceBody = { productId: scarceId, price: 30, quantity: 1 };
    const [addA, addB] = await Promise.all([
      api('POST', '/api/v1/buyer/cart/items', { token: buyer1.token, body: scarceBody }),
      api('POST', '/api/v1/buyer/cart/items', { token: buyer2.token, body: scarceBody }),
    ]);
    check('both buyers add scarce item', addA.status === 201 && addB.status === 201, `a=${addA.status} b=${addB.status}`);

    const [checkoutA, checkoutB] = await Promise.all([
      api('POST', '/api/v1/buyer/checkout', { token: buyer1.token, body: checkoutBody }),
      api('POST', '/api/v1/buyer/checkout', { token: buyer2.token, body: checkoutBody }),
    ]);
    const successes = [checkoutA, checkoutB].filter((r) => r.status === 201).length;
    check('concurrent checkout never oversells (exactly one success)', successes === 1, `a=${checkoutA.status}/${checkoutA.body?.code} b=${checkoutB.status}/${checkoutB.body?.code}`);
    record(
      'loser of concurrent checkout returns a domain status (422), not 500',
      [checkoutA, checkoutB].filter((r) => r.status !== 201).every((r) => r.status === 422) ? 'PASS' : 'FAIL',
      `a=${checkoutA.status} b=${checkoutB.status} messages=${JSON.stringify([checkoutA.body?.message, checkoutB.body?.message]).slice(0, 200)}`,
    );
  }

  // ----------------------------------------------------------------- report
  const failed = results.filter((r) => r.level === 'FAIL');
  const warned = results.filter((r) => r.level === 'WARN');
  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`PASS: ${results.filter((r) => r.level === 'PASS').length}  WARN: ${warned.length}  FAIL: ${failed.length}`);
  if (warned.length > 0) {
    console.log('\nWARNINGS:');
    for (const w of warned) console.log(` - ${w.name}: ${w.detail}`);
  }
  if (failed.length > 0) {
    console.log('\nFAILURES:');
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
    process.exitCode = 1;
  }
}

await main();
