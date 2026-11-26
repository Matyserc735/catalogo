import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppCartUrl,
  buildWhatsAppProductUrl,
  calculateCartTotals,
  extractCategories,
  filterAndSortProducts,
  formatPrice,
  normalizePhoneNumber,
  validateProductInput,
  validateStoreSettingsInput,
} from './catalogLogic';
import type { Product } from '../types/catalog';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Cafetera Cerámica',
    description: 'Hecha a mano en gres mate.',
    price: 45000,
    compareAtPrice: 52000,
    category: 'Hogar',
    imageUrl: '/src/assets/images/product_ceramic_carafe_1795722016634.jpg',
    inStock: true,
    published: true,
    featured: true,
    createdBy: 'admin-1',
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'p2',
    name: 'Mochila Lona',
    description: 'Lona encerada resistente al agua.',
    price: 120000,
    compareAtPrice: 0,
    category: 'Accesorios',
    imageUrl: '/src/assets/images/product_canvas_backpack_1795722017054.jpg',
    inStock: true,
    published: true,
    featured: false,
    createdBy: 'admin-1',
    createdAt: 2000,
    updatedAt: 2000,
  },
  {
    id: 'p3',
    name: 'Borrador Interno',
    description: 'No visible al público.',
    price: 9900,
    compareAtPrice: 0,
    category: 'Audio',
    imageUrl: '',
    inStock: false,
    published: false,
    featured: false,
    createdBy: 'admin-1',
    createdAt: 3000,
    updatedAt: 3000,
  },
];

test('formatPrice formats prefix and code currencies properly', () => {
  assert.equal(formatPrice(45000, '$'), '$45.000');
  assert.equal(formatPrice(19.5, 'USD'), 'USD 19,50');
  assert.equal(formatPrice(-10, '$'), '$0');
});

test('normalizePhoneNumber strips non-numeric characters', () => {
  assert.equal(normalizePhoneNumber('+57 (300) 123-4567'), '573001234567');
  assert.equal(normalizePhoneNumber('abc'), '');
});

test('buildWhatsAppProductUrl builds encoded wa.me link and rejects invalid phones', () => {
  assert.equal(
    buildWhatsAppProductUrl('123', 'Mi Tienda', SAMPLE_PRODUCTS[0], '$', 1),
    null
  );
  const url = buildWhatsAppProductUrl('+57 300 123 4567', 'Atelier Norte', SAMPLE_PRODUCTS[0], '$', 2);
  assert.ok(url?.startsWith('https://wa.me/573001234567?text='));
  const decoded = decodeURIComponent(url!.split('?text=')[1]);
  assert.match(decoded, /Atelier Norte/);
  assert.match(decoded, /Cafetera Cerámica/);
  assert.match(decoded, /Cantidad: 2/);
  assert.match(decoded, /\$90\.000/);
});

test('buildWhatsAppCartUrl and calculateCartTotals compute itemized order correctly', () => {
  const items = [
    { product: SAMPLE_PRODUCTS[0], quantity: 2 },
    { product: SAMPLE_PRODUCTS[1], quantity: 1 },
  ];
  const totals = calculateCartTotals(items);
  assert.equal(totals.totalItems, 3);
  assert.equal(totals.subtotal, 210000);

  const url = buildWhatsAppCartUrl('+52 55 1234 5678', 'Bazar Sur', items, '$', 'Envío express');
  assert.ok(url?.startsWith('https://wa.me/525512345678?text='));
  const decoded = decodeURIComponent(url!.split('?text=')[1]);
  assert.match(decoded, /2x Cafetera Cerámica/);
  assert.match(decoded, /1x Mochila Lona/);
  assert.match(decoded, /\$210\.000/);
  assert.match(decoded, /Envío express/);
});

test('filterAndSortProducts hides unpublished items for customers and supports unlimited search/sort', () => {
  const publicList = filterAndSortProducts(SAMPLE_PRODUCTS, {
    search: '',
    category: 'Todas',
    sort: 'newest',
  });
  assert.equal(publicList.length, 2);

  const adminList = filterAndSortProducts(SAMPLE_PRODUCTS, {
    search: '',
    category: 'Todas',
    sort: 'price-asc',
    includeUnpublished: true,
  });
  assert.equal(adminList.length, 3);
  assert.equal(adminList[0].id, 'p3');

  const searchList = filterAndSortProducts(SAMPLE_PRODUCTS, {
    search: 'lona',
    category: 'Accesorios',
    sort: 'name',
  });
  assert.equal(searchList.length, 1);
  assert.equal(searchList[0].id, 'p2');
});

test('extractCategories returns sorted unique categories', () => {
  assert.deepEqual(extractCategories(SAMPLE_PRODUCTS), ['Accesorios', 'Audio', 'Hogar']);
});

test('validateProductInput and validateStoreSettingsInput enforce blueprint limits', () => {
  const badProductErrors = validateProductInput({
    name: '',
    description: 'ok',
    price: -5,
    compareAtPrice: 0,
    category: '',
    imageUrl: '',
    inStock: true,
    published: true,
    featured: false,
  });
  assert.ok(badProductErrors.name);
  assert.ok(badProductErrors.price);
  assert.ok(badProductErrors.category);

  const validProductErrors = validateProductInput({
    name: 'Lámpara',
    description: 'Latón cepillado',
    price: 89,
    compareAtPrice: 110,
    category: 'Iluminación',
    imageUrl: '',
    inStock: true,
    published: true,
    featured: true,
  });
  assert.deepEqual(validProductErrors, {});

  const badSettingsErrors = validateStoreSettingsInput({
    storeName: '',
    tagline: 'Hola',
    logoUrl: '',
    whatsappNumber: '57-abc',
    currency: '',
    accentColor: 'red',
  });
  assert.ok(badSettingsErrors.storeName);
  assert.ok(badSettingsErrors.whatsappNumber);
  assert.ok(badSettingsErrors.currency);
  assert.ok(badSettingsErrors.accentColor);
});
