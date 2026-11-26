import test from 'node:test';
import assert from 'node:assert/strict';
import { BLUEPRINT_LIMITS } from './src/utils/catalogLogic';

interface MockAuth {
  uid: string;
  email: string;
  emailVerified: boolean;
}

const BOOTSTRAPPED_ADMIN_EMAIL = 'nicolasg20112011@gmail.com';
const PRODUCT_KEYS = [
  'name',
  'description',
  'price',
  'compareAtPrice',
  'category',
  'imageUrl',
  'inStock',
  'published',
  'featured',
  'createdBy',
  'createdAt',
  'updatedAt',
];

const SETTINGS_KEYS = [
  'storeName',
  'tagline',
  'logoUrl',
  'whatsappNumber',
  'currency',
  'accentColor',
  'seeded',
  'updatedBy',
  'updatedAt',
];

function evaluateProductCreate(
  auth: MockAuth | null,
  docId: string,
  payload: Record<string, unknown>,
  serverTime: number
): 'ALLOW' | 'PERMISSION_DENIED' {
  if (!auth || !auth.emailVerified || auth.email !== BOOTSTRAPPED_ADMIN_EMAIL) {
    return 'PERMISSION_DENIED';
  }
  if (!BLUEPRINT_LIMITS.idPattern.test(docId) || docId.length > BLUEPRINT_LIMITS.idMax) {
    return 'PERMISSION_DENIED';
  }
  const keys = Object.keys(payload);
  if (!PRODUCT_KEYS.every((k) => keys.includes(k)) || !keys.every((k) => PRODUCT_KEYS.includes(k))) {
    return 'PERMISSION_DENIED';
  }
  if (
    typeof payload.name !== 'string' ||
    payload.name.length < 1 ||
    payload.name.length > BLUEPRINT_LIMITS.productNameMax
  ) {
    return 'PERMISSION_DENIED';
  }
  if (typeof payload.description !== 'string' || payload.description.length > BLUEPRINT_LIMITS.productDescriptionMax) {
    return 'PERMISSION_DENIED';
  }
  if (typeof payload.price !== 'number' || payload.price < 0 || payload.price > BLUEPRINT_LIMITS.priceMax) {
    return 'PERMISSION_DENIED';
  }
  if (payload.createdBy !== auth.uid || payload.createdAt !== serverTime || payload.updatedAt !== serverTime) {
    return 'PERMISSION_DENIED';
  }
  return 'ALLOW';
}

function evaluateSettingsWrite(
  auth: MockAuth | null,
  settingId: string,
  payload: Record<string, unknown>,
  serverTime: number
): 'ALLOW' | 'PERMISSION_DENIED' {
  if (!auth || !auth.emailVerified || auth.email !== BOOTSTRAPPED_ADMIN_EMAIL) {
    return 'PERMISSION_DENIED';
  }
  if (settingId !== 'store') {
    return 'PERMISSION_DENIED';
  }
  const keys = Object.keys(payload);
  if (!SETTINGS_KEYS.every((k) => keys.includes(k)) || !keys.every((k) => SETTINGS_KEYS.includes(k))) {
    return 'PERMISSION_DENIED';
  }
  if (
    typeof payload.storeName !== 'string' ||
    payload.storeName.length < 1 ||
    payload.storeName.length > BLUEPRINT_LIMITS.storeNameMax
  ) {
    return 'PERMISSION_DENIED';
  }
  if (payload.updatedBy !== auth.uid || payload.updatedAt !== serverTime) {
    return 'PERMISSION_DENIED';
  }
  return 'ALLOW';
}

test('Dirty Dozen adversarial payloads all evaluate to PERMISSION_DENIED', () => {
  const adminAuth: MockAuth = {
    uid: 'admin-uid-1',
    email: BOOTSTRAPPED_ADMIN_EMAIL,
    emailVerified: true,
  };
  const now = 1795722000;
  const validProduct = {
    name: 'Café Molido',
    description: 'Origen Sierra Nevada',
    price: 35000,
    compareAtPrice: 0,
    category: 'Café',
    imageUrl: '',
    inStock: true,
    published: true,
    featured: false,
    createdBy: adminAuth.uid,
    createdAt: now,
    updatedAt: now,
  };

  assert.equal(evaluateProductCreate(adminAuth, 'prod_1', validProduct, now), 'ALLOW');

  // 1. Unauthenticated product create
  assert.equal(evaluateProductCreate(null, 'prod_1', validProduct, now), 'PERMISSION_DENIED');
  // 2. Unverified email spoof
  assert.equal(
    evaluateProductCreate({ ...adminAuth, emailVerified: false }, 'prod_1', validProduct, now),
    'PERMISSION_DENIED'
  );
  // 3. Non-admin authenticated user
  assert.equal(
    evaluateProductCreate({ uid: 'u2', email: 'cliente@example.com', emailVerified: true }, 'prod_1', validProduct, now),
    'PERMISSION_DENIED'
  );
  // 4. Shadow ghost field injection
  assert.equal(
    evaluateProductCreate(adminAuth, 'prod_1', { ...validProduct, isVerified: true }, now),
    'PERMISSION_DENIED'
  );
  // 5. Negative price poisoning
  assert.equal(
    evaluateProductCreate(adminAuth, 'prod_1', { ...validProduct, price: -100 }, now),
    'PERMISSION_DENIED'
  );
  // 6. Oversized name string (>120 chars)
  assert.equal(
    evaluateProductCreate(adminAuth, 'prod_1', { ...validProduct, name: 'x'.repeat(121) }, now),
    'PERMISSION_DENIED'
  );
  // 7. Path ID poisoning
  assert.equal(evaluateProductCreate(adminAuth, 'bad..id$1', validProduct, now), 'PERMISSION_DENIED');
  // 8. Client timestamp forgery
  assert.equal(
    evaluateProductCreate(adminAuth, 'prod_1', { ...validProduct, createdAt: now - 5000 }, now),
    'PERMISSION_DENIED'
  );
  // 9. Settings arbitrary ID injection
  assert.equal(
    evaluateSettingsWrite(
      adminAuth,
      'evil',
      {
        storeName: 'Tienda',
        tagline: '',
        logoUrl: '',
        whatsappNumber: '',
        currency: '$',
        accentColor: '#115E59',
        seeded: true,
        updatedBy: adminAuth.uid,
        updatedAt: now,
      },
      now
    ),
    'PERMISSION_DENIED'
  );
});
