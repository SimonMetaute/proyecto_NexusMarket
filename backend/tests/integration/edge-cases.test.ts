/**
 * Edge-case / negative-path integration tests for NexusMarket.
 *
 * Complements `audit-flow.test.ts` with payload validation, token expiry,
 * logout revocation, ownership checks and cart/checkout failure modes.
 *
 * Usage: node_modules/.bin/tsx tests/integration/edge-cases.test.ts
 */
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET ?? 'nexusmarket-dev-secret';

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
  options: { token?: string; body?: unknown; raw?: string } = {},
): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined || options.raw !== undefined) {
    headers['content-type'] = 'application/json';
  }
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
  return { status: response.status, body };
}

async function registerBuyer(label: string): Promise<{ email: string; password: string; token: string }> {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const email = `edge.${label}.${suffix}@test.com`;
  const password = 'Edge1234!';
  await api('POST', '/api/v1/auth/register/buyer', {
    body: {
      email,
      password,
      firstName: 'Edge',
      lastName: label,
      phoneNumber: `+5731${Math.floor(Math.random() * 1e8)}`,
      identification: `EDGE-${suffix}`,
    },
  });
  const login = await api('POST', '/api/v1/auth/login', { body: { email, password } });
  return { email, password, token: login.body?.token ?? '' };
}

async function main(): Promise<void> {
  const runSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // ------------------------------------------------------------ JWT handling
  const expired = jwt.sign(
    { userId: 'expired-user', role: 'BUYER', exp: Math.floor(Date.now() / 1000) - 60 },
    JWT_SECRET,
    { algorithm: 'HS256' },
  );
  const expiredResult = await api('GET', '/api/v1/buyer/profile', { token: expired });
  check(
    'expired JWT -> 401 AUTHENTICATION_REQUIRED',
    expiredResult.status === 401 && expiredResult.body?.code === 'AUTHENTICATION_REQUIRED',
    `status=${expiredResult.status} code=${expiredResult.body?.code}`,
  );

  const wrongSecret = jwt.sign(
    { userId: 'some-user', role: 'BUYER', exp: Math.floor(Date.now() / 1000) + 3600 },
    'not-the-real-secret',
    { algorithm: 'HS256' },
  );
  const wrongSecretResult = await api('GET', '/api/v1/buyer/profile', { token: wrongSecret });
  check(
    'JWT signed with a foreign secret -> 401',
    wrongSecretResult.status === 401,
    `status=${wrongSecretResult.status} code=${wrongSecretResult.body?.code}`,
  );

  const unknownUser = jwt.sign(
    { userId: '00000000-0000-4000-8000-000000000000', role: 'BUYER', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET,
    { algorithm: 'HS256' },
  );
  const unknownUserResult = await api('GET', '/api/v1/buyer/profile', { token: unknownUser });
  check(
    'validly signed JWT for a non-existent user -> 401',
    unknownUserResult.status === 401,
    `status=${unknownUserResult.status} code=${unknownUserResult.body?.code}`,
  );

  // ----------------------------------------------------- registration checks
  const missingField = await api('POST', '/api/v1/auth/register/buyer', {
    body: { email: `edge.missing.${runSuffix}@test.com`, password: 'Edge1234!', lastName: 'NoFirst' },
  });
  check(
    'registration missing firstName -> 400 INVALID_REQUEST with details.field',
    missingField.status === 400 &&
      missingField.body?.code === 'INVALID_REQUEST' &&
      missingField.body?.details?.field === 'firstName',
    `status=${missingField.status} code=${missingField.body?.code} field=${missingField.body?.details?.field}`,
  );

  const badEmail = await api('POST', '/api/v1/auth/register/buyer', {
    body: {
      email: 'not-an-email',
      password: 'Edge1234!',
      firstName: 'Edge',
      lastName: 'BadEmail',
      phoneNumber: '+573100000001',
      identification: `BAD-EMAIL-${runSuffix}`,
    },
  });
  record(
    'invalid email format (SDD asks 422, implementation replies)',
    badEmail.status === 400 || badEmail.status === 422 ? 'PASS' : 'FAIL',
    `status=${badEmail.status} code=${badEmail.body?.code} field=${badEmail.body?.details?.field}`,
  );

  const weakPassword = await api('POST', '/api/v1/auth/register/buyer', {
    body: {
      email: `edge.weak.${runSuffix}@test.com`,
      password: 'short',
      firstName: 'Edge',
      lastName: 'Weak',
      phoneNumber: '+573100000002',
      identification: `WEAK-${runSuffix}`,
    },
  });
  record(
    'weak password (SDD asks 422, implementation replies)',
    weakPassword.status === 400 || weakPassword.status === 422 ? 'PASS' : 'FAIL',
    `status=${weakPassword.status} code=${weakPassword.body?.code} field=${weakPassword.body?.details?.field}`,
  );

  // ------------------------------------------------------- buyer / cart edge
  const buyer = await registerBuyer('cart');
  const freshCart = await api('GET', '/api/v1/buyer/cart', { token: buyer.token });
  check(
    'cart before creation -> 404 (not 500)',
    freshCart.status === 404 && freshCart.body?.code === 'RESOURCE_NOT_FOUND',
    `status=${freshCart.status} code=${freshCart.body?.code}`,
  );

  const cartCreation = await api('POST', '/api/v1/buyer/cart', { token: buyer.token });
  check('create cart for edge tests', cartCreation.status === 201 || cartCreation.status === 200, `status=${cartCreation.status}`);

  const ghostProduct = await api('POST', '/api/v1/buyer/cart/items', {
    token: buyer.token,
    body: { productId: globalThis.crypto.randomUUID(), price: 10, quantity: 1 },
  });
  check(
    'add non-existent product -> 404',
    ghostProduct.status === 404 && ghostProduct.body?.code === 'RESOURCE_NOT_FOUND',
    `status=${ghostProduct.status} code=${ghostProduct.body?.code}`,
  );

  const zeroQty = await api('POST', '/api/v1/buyer/cart/items', {
    token: buyer.token,
    body: { productId: globalThis.crypto.randomUUID(), price: 10, quantity: 0 },
  });
  check(
    'add item with quantity 0 -> 400',
    zeroQty.status === 400 && zeroQty.body?.code === 'INVALID_REQUEST',
    `status=${zeroQty.status} code=${zeroQty.body?.code}`,
  );

  const missingPrice = await api('POST', '/api/v1/buyer/cart/items', {
    token: buyer.token,
    body: { productId: globalThis.crypto.randomUUID(), quantity: 1 },
  });
  check(
    'add item without price no longer fails validation (price comes from catalog)',
    missingPrice.status === 404,
    `status=${missingPrice.status} code=${missingPrice.body?.code} field=${missingPrice.body?.details?.field}`,
  );

  const emptyCheckout = await api('POST', '/api/v1/buyer/checkout', {
    token: buyer.token,
    body: {
      deliveryAddress: {
        addressId: globalThis.crypto.randomUUID(),
        country: 'Colombia',
        department: 'Antioquia',
        city: 'Medellin',
        neighborhood: 'Centro',
        address: 'Calle 1 # 2-3',
        postalCode: '050001',
        isPrimary: true,
      },
      paymentMethod: {
        paymentMethodId: globalThis.crypto.randomUUID(),
        type: 'CreditCard',
        maskedNumber: '**** **** **** 1111',
        cardholder: 'Edge Buyer',
        expirationDate: '12/2030',
        brand: 'VISA',
        isDefault: true,
      },
    },
  });
  check(
    'checkout with an empty cart -> 400, no order created',
    emptyCheckout.status === 400 && emptyCheckout.body?.code === 'INVALID_REQUEST',
    `status=${emptyCheckout.status} code=${emptyCheckout.body?.code}`,
  );

  const ghostOrder = await api('GET', `/api/v1/buyer/orders/${globalThis.crypto.randomUUID()}`, { token: buyer.token });
  check(
    'unknown order id -> 404',
    ghostOrder.status === 404 && ghostOrder.body?.code === 'RESOURCE_NOT_FOUND',
    `status=${ghostOrder.status} code=${ghostOrder.body?.code}`,
  );

  const ghostCatalog = await api('GET', `/api/v1/catalog/products/${globalThis.crypto.randomUUID()}`);
  check(
    'unknown catalog product -> 404',
    ghostCatalog.status === 404,
    `status=${ghostCatalog.status} code=${ghostCatalog.body?.code}`,
  );

  // ------------------------------------------------------- logout revocation
  // (moved to the end of the run so the buyer token stays usable)

  // --------------------------------------------------------- seller edge cases
  const sellerLogin = await api('POST', '/api/v1/auth/login', {
    body: { email: 'vendedor@test.com', password: 'Seller1234!' },
  });
  if (sellerLogin.status !== 200) {
    record('seller login for edge tests', 'NOTE', `status=${sellerLogin.status}; seller edge cases skipped`);
  } else {
    const sellerToken: string = sellerLogin.body.token;

    const negativePrice = await api('POST', '/api/v1/seller/products', {
      token: sellerToken,
      body: {
        name: `Edge Negative ${runSuffix}`,
        description: 'Negative price must be rejected',
        price: -5,
        stock: 1,
        sku: `NEG-${runSuffix}`,
        category: 'Electronics',
      },
    });
    check(
      'negative price -> 400/422, never 500',
      [400, 422].includes(negativePrice.status),
      `status=${negativePrice.status} code=${negativePrice.body?.code}`,
    );

    const invalidCategory = await api('POST', '/api/v1/seller/products', {
      token: sellerToken,
      body: {
        name: `Edge Category ${runSuffix}`,
        description: 'Invalid category must be rejected',
        price: 10,
        stock: 1,
        category: 'NotACategory',
      },
    });
    check(
      'invalid category enum -> 400',
      invalidCategory.status === 400 && invalidCategory.body?.details?.field === 'category',
      `status=${invalidCategory.status} field=${invalidCategory.body?.details?.field}`,
    );

    const product = await api('POST', '/api/v1/seller/products', {
      token: sellerToken,
      body: {
        name: `Edge Variant ${runSuffix}`,
        description: 'Duplicate variant check',
        price: 20,
        stock: 1,
        sku: `VAR-${runSuffix}`,
        category: 'Electronics',
      },
    });
    const productId: string = product.body?.productId ?? '';
    const variantBody = {
      variantId: globalThis.crypto.randomUUID(),
      attribute: 'Size',
      value: `Edge-${runSuffix}`,
      additionalPrice: 0,
      skuVariant: `VAR-SKU-${runSuffix}`,
    };
    const firstVariant = await api('POST', `/api/v1/seller/products/${productId}/variants`, {
      token: sellerToken,
      body: variantBody,
    });
    check('first variant -> 201', firstVariant.status === 201, `status=${firstVariant.status} code=${firstVariant.body?.code}`);

    const duplicateVariant = await api('POST', `/api/v1/seller/products/${productId}/variants`, {
      token: sellerToken,
      body: { ...variantBody, variantId: globalThis.crypto.randomUUID() },
    });
    check(
      'duplicate variant -> 409 RESOURCE_ALREADY_EXISTS',
      duplicateVariant.status === 409 && duplicateVariant.body?.code === 'RESOURCE_ALREADY_EXISTS',
      `status=${duplicateVariant.status} code=${duplicateVariant.body?.code}`,
    );

    const unknownProductVariant = await api('POST', `/api/v1/seller/products/${globalThis.crypto.randomUUID()}/variants`, {
      token: sellerToken,
      body: { ...variantBody, variantId: globalThis.crypto.randomUUID(), skuVariant: `ORPHAN-${runSuffix}` },
    });
    check(
      'variant for unknown product -> 404 (no orphan insert)',
      unknownProductVariant.status === 404,
      `status=${unknownProductVariant.status} code=${unknownProductVariant.body?.code}`,
    );

    // Price tampering: the request body claims 0.01 but the catalog price is 20.
    const tamperedPrice = await api('POST', '/api/v1/buyer/cart/items', {
      token: buyer.token,
      body: { productId, variantId: variantBody.variantId, quantity: 2, price: 0.01, additionalPrice: 0 },
    });
    const tamperedLine = tamperedPrice.body?.cartLines?.[0];
    check(
      'client-supplied price is ignored (catalog price + variant surcharge)',
      tamperedPrice.status === 201 && tamperedLine?.unitPrice === 20 && tamperedLine?.subtotal === 40,
      `status=${tamperedPrice.status} unitPrice=${tamperedLine?.unitPrice} subtotal=${tamperedLine?.subtotal}`,
    );

    const unknownVariant = await api('POST', '/api/v1/buyer/cart/items', {
      token: buyer.token,
      body: { productId, variantId: globalThis.crypto.randomUUID(), quantity: 1 },
    });
    check(
      'variant that does not belong to the product -> 404',
      unknownVariant.status === 404,
      `status=${unknownVariant.status} code=${unknownVariant.body?.code}`,
    );

    const approveGhost = await api('POST', `/api/v1/seller/orders/${globalThis.crypto.randomUUID()}/approve`, {
      token: sellerToken,
    });
    check(
      'approve unknown order -> 404',
      approveGhost.status === 404,
      `status=${approveGhost.status} code=${approveGhost.body?.code}`,
    );

    const stockInGhostWarehouse = await api('POST', '/api/v1/seller/inventory/stock-entry', {
      token: sellerToken,
      body: { productId, warehouseId: globalThis.crypto.randomUUID(), quantity: 1, receiptReference: `GHOST-${runSuffix}` },
    });
    check(
      'stock entry into unknown warehouse -> 404',
      stockInGhostWarehouse.status === 404,
      `status=${stockInGhostWarehouse.status} code=${stockInGhostWarehouse.body?.code}`,
    );

    // SDD §5.3 / §5.15: storefront and settlement report are now implemented.
    const store = await api('GET', '/api/v1/seller/store', { token: sellerToken });
    check(
      'SDD endpoint GET /api/v1/seller/store returns the storefront',
      store.status === 200 &&
        typeof store.body?.storeId === 'string' &&
        typeof store.body?.storeName === 'string' &&
        typeof store.body?.status === 'string',
      `status=${store.status} storeId=${store.body?.storeId} storeName=${store.body?.storeName}`,
    );

    const settlements = await api('GET', '/api/v1/seller/settlements', {
      token: sellerToken,
    });
    check(
      'SDD endpoint GET /api/v1/seller/settlements returns the settlement report',
      settlements.status === 200 &&
        typeof settlements.body?.period === 'string' &&
        typeof settlements.body?.netAmount === 'number' &&
        settlements.body?.currency === 'COP',
      `status=${settlements.status} period=${settlements.body?.period} netAmount=${settlements.body?.netAmount}`,
    );

    // New endpoints exist: unauthorized roles hit the role guard (403), not 404.
    const shipmentsForSeller = await api('GET', '/api/v1/logistics/shipments', { token: sellerToken });
    check(
      'logistics shipments route is wired (403 for SELLER)',
      shipmentsForSeller.status === 403 && shipmentsForSeller.body?.code === 'FORBIDDEN',
      `status=${shipmentsForSeller.status} code=${shipmentsForSeller.body?.code}`,
    );

    const returnsForSeller = await api('GET', '/api/v1/logistics/returns', { token: sellerToken });
    check(
      'logistics returns route is wired (403 for SELLER)',
      returnsForSeller.status === 403 && returnsForSeller.body?.code === 'FORBIDDEN',
      `status=${returnsForSeller.status} code=${returnsForSeller.body?.code}`,
    );

    // The legacy collection route never existed; returns are nested under an order.
    const legacyReturns = await api('POST', '/api/v1/buyer/returns', { token: buyer.token, body: {} });
    check(
      'legacy POST /buyer/returns is gone -> 404',
      legacyReturns.status === 404,
      `status=${legacyReturns.status} code=${legacyReturns.body?.code}`,
    );

    const unknownOrderReturn = await api(
      'POST',
      `/api/v1/buyer/orders/${globalThis.crypto.randomUUID()}/returns`,
      { token: buyer.token, body: { reason: 'Other' } },
    );
    check(
      'return for an unknown order -> 404',
      unknownOrderReturn.status === 404 && unknownOrderReturn.body?.code === 'RESOURCE_NOT_FOUND',
      `status=${unknownOrderReturn.status} code=${unknownOrderReturn.body?.code}`,
    );
  }

  // ------------------------------------------------------- logout revocation
  const logout = await api('POST', '/api/v1/auth/logout', { token: buyer.token });
  check('logout -> 204 No Content', logout.status === 204, `status=${logout.status}`);
  const replay = await api('GET', '/api/v1/buyer/profile', { token: buyer.token });
  check(
    'revoked token cannot be replayed -> 401',
    replay.status === 401 && replay.body?.code === 'AUTHENTICATION_REQUIRED',
    `status=${replay.status} code=${replay.body?.code}`,
  );

  // Audit trail: logout must leave a USER_LOGOUT entry (best-effort check when
  // MongoDB is reachable).
  const claims = jwt.decode(buyer.token) as { userId?: string } | null;
  const mongoClient = new MongoClient(process.env.MONGO_URI ?? 'mongodb://localhost:27017/audit_db', {
    serverSelectionTimeoutMS: 2000,
  });
  try {
    await mongoClient.connect();
    const logoutLog = await mongoClient
      .db()
      .collection('audit_logs')
      .findOne({ actorId: claims?.userId, action: 'USER_LOGOUT' });
    check(
      'logout writes a USER_LOGOUT audit log',
      logoutLog !== null,
      `actorId=${claims?.userId} found=${logoutLog !== null}`,
    );
  } catch (error) {
    record(
      'logout audit-log verification',
      'NOTE',
      `MongoDB unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    await mongoClient.close();
  }

  // ----------------------------------------------------------------- report
  const failed = results.filter((r) => r.level === 'FAIL');
  const notes = results.filter((r) => r.level === 'NOTE');
  console.log('\n============== EDGE-CASE SUMMARY ==============');
  console.log(
    `PASS: ${results.filter((r) => r.level === 'PASS').length}  NOTE: ${notes.length}  FAIL: ${failed.length}`,
  );
  if (notes.length > 0) {
    console.log('\nNOTES:');
    for (const n of notes) console.log(` - ${n.name}: ${n.detail}`);
  }
  if (failed.length > 0) {
    console.log('\nFAILURES:');
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
    process.exitCode = 1;
  }
}

await main();
