import type { CartItem, Product, ProductFormInput, SortOption, StoreSettings } from '../types/catalog';

/**
 * Synchronized verbatim with firebase-blueprint.json & firestore.rules.
 */
export const BLUEPRINT_LIMITS = {
  storeNameMin: 1,
  storeNameMax: 80,
  taglineMax: 160,
  logoUrlMax: 250000,
  whatsappMax: 25,
  whatsappPattern: /^[0-9+\s\-()]*$/,
  currencyMin: 1,
  currencyMax: 8,
  accentColorPattern: /^#[0-9a-fA-F]{6}$/,
  productNameMin: 1,
  productNameMax: 120,
  productDescriptionMax: 1000,
  productCategoryMin: 1,
  productCategoryMax: 60,
  productImageUrlMax: 250000,
  priceMin: 0,
  priceMax: 1000000000,
  idPattern: /^[a-zA-Z0-9_\-]+$/,
  idMax: 128,
} as const;

export const CURATED_ACCENT_COLORS = [
  { label: 'Verde Pino', hex: '#115E59' },
  { label: 'Azul Marino', hex: '#1E3A8A' },
  { label: 'Carbón', hex: '#18181B' },
  { label: 'Burdeos', hex: '#881337' },
  { label: 'Oliva Oscuro', hex: '#3F6212' },
] as const;

export const CURRENCY_OPTIONS = ['$', 'USD', 'MXN', 'COP', 'ARS', 'EUR', 'S/'] as const;

export function formatPrice(price: number, currency: string = '$'): string {
  const safePrice = Number.isFinite(price) ? Math.max(0, price) : 0;
  const hasDecimals = Math.round(safePrice * 100) % 100 !== 0;
  const formattedNumber = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(safePrice);

  const trimmedCurrency = (currency || '$').trim();
  if (trimmedCurrency === '$' || trimmedCurrency === '€' || trimmedCurrency === 'S/') {
    return `${trimmedCurrency}${formattedNumber}`;
  }
  return `${trimmedCurrency} ${formattedNumber}`;
}

export function normalizePhoneNumber(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

export function buildWhatsAppProductUrl(
  phone: string,
  storeName: string,
  product: Pick<Product, 'name' | 'price' | 'category'>,
  currency: string,
  quantity: number = 1
): string | null {
  const digits = normalizePhoneNumber(phone);
  if (digits.length < 7) {
    return null;
  }
  const safeQty = Math.max(1, Math.floor(quantity));
  const unitPrice = formatPrice(product.price, currency);
  const totalPrice = formatPrice(product.price * safeQty, currency);
  const lines = [
    `Hola *${storeName.trim() || 'Tienda'}*, me interesa comprar:`,
    `• Producto: ${product.name}`,
    `• Categoría: ${product.category}`,
    `• Cantidad: ${safeQty}`,
    `• Precio unitario: ${unitPrice}`,
  ];
  if (safeQty > 1) {
    lines.push(`• Total estimado: ${totalPrice}`);
  }
  lines.push('¿Me confirmas disponibilidad y envío?');

  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildWhatsAppCartUrl(
  phone: string,
  storeName: string,
  items: CartItem[],
  currency: string,
  customerNote?: string
): string | null {
  const digits = normalizePhoneNumber(phone);
  if (digits.length < 7 || items.length === 0) {
    return null;
  }
  const { subtotal } = calculateCartTotals(items);
  const lines = [`Hola *${storeName.trim() || 'Tienda'}*, quiero realizar este pedido:`];
  for (const item of items) {
    const qty = Math.max(1, Math.floor(item.quantity));
    const lineTotal = formatPrice(item.product.price * qty, currency);
    lines.push(`• ${qty}x ${item.product.name} (${lineTotal})`);
  }
  lines.push(`Total: *${formatPrice(subtotal, currency)}*`);
  if (customerNote && customerNote.trim().length > 0) {
    lines.push(`Nota: ${customerNote.trim()}`);
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function calculateCartTotals(items: CartItem[]): { totalItems: number; subtotal: number } {
  let totalItems = 0;
  let subtotal = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    if (qty > 0) {
      totalItems += qty;
      subtotal += (Number.isFinite(item.product.price) ? item.product.price : 0) * qty;
    }
  }
  return { totalItems, subtotal };
}

export function extractCategories(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const cat = p.category.trim();
    if (cat.length > 0) {
      set.add(cat);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export function filterAndSortProducts(
  products: Product[],
  options: {
    search: string;
    category: string;
    sort: SortOption;
    includeUnpublished?: boolean;
  }
): Product[] {
  const searchLower = options.search.trim().toLowerCase();
  const selectedCategory = options.category.trim();

  const filtered = products.filter((item) => {
    if (!options.includeUnpublished && !item.published) {
      return false;
    }
    if (selectedCategory && selectedCategory !== 'Todas' && item.category.trim() !== selectedCategory) {
      return false;
    }
    if (searchLower.length > 0) {
      const haystack = `${item.name} ${item.description} ${item.category}`.toLowerCase();
      if (!haystack.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (options.sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name, 'es');
      case 'newest':
      default:
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }
        return b.createdAt - a.createdAt;
    }
  });
}

export function validateProductInput(input: ProductFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const description = input.description.trim();
  const category = input.category.trim();
  const imageUrl = input.imageUrl.trim();
  const price = typeof input.price === 'string' ? Number(input.price) : input.price;
  const compareAtPrice =
    input.compareAtPrice === '' || input.compareAtPrice === undefined
      ? 0
      : typeof input.compareAtPrice === 'string'
        ? Number(input.compareAtPrice)
        : input.compareAtPrice;

  if (name.length < BLUEPRINT_LIMITS.productNameMin) {
    errors.name = 'El nombre del producto es obligatorio.';
  } else if (name.length > BLUEPRINT_LIMITS.productNameMax) {
    errors.name = `Máximo ${BLUEPRINT_LIMITS.productNameMax} caracteres.`;
  }

  if (description.length > BLUEPRINT_LIMITS.productDescriptionMax) {
    errors.description = `Máximo ${BLUEPRINT_LIMITS.productDescriptionMax} caracteres.`;
  }

  if (category.length < BLUEPRINT_LIMITS.productCategoryMin) {
    errors.category = 'La categoría es obligatoria.';
  } else if (category.length > BLUEPRINT_LIMITS.productCategoryMax) {
    errors.category = `Máximo ${BLUEPRINT_LIMITS.productCategoryMax} caracteres.`;
  }

  if (!Number.isFinite(price) || price < BLUEPRINT_LIMITS.priceMin || price > BLUEPRINT_LIMITS.priceMax) {
    errors.price = 'Ingresa un precio válido mayor o igual a 0.';
  }

  if (
    !Number.isFinite(compareAtPrice) ||
    compareAtPrice < BLUEPRINT_LIMITS.priceMin ||
    compareAtPrice > BLUEPRINT_LIMITS.priceMax
  ) {
    errors.compareAtPrice = 'El precio anterior debe ser válido.';
  }

  if (imageUrl.length > BLUEPRINT_LIMITS.productImageUrlMax) {
    errors.imageUrl = 'La imagen supera el tamaño permitido. Usa una foto más liviana o un enlace URL.';
  }

  return errors;
}

export function validateStoreSettingsInput(
  input: Pick<StoreSettings, 'storeName' | 'tagline' | 'logoUrl' | 'whatsappNumber' | 'currency' | 'accentColor'>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const storeName = input.storeName.trim();
  const tagline = input.tagline.trim();
  const whatsappNumber = input.whatsappNumber.trim();
  const currency = input.currency.trim();
  const logoUrl = input.logoUrl.trim();
  const accentColor = input.accentColor.trim();

  if (storeName.length < BLUEPRINT_LIMITS.storeNameMin) {
    errors.storeName = 'El nombre del sitio web es obligatorio.';
  } else if (storeName.length > BLUEPRINT_LIMITS.storeNameMax) {
    errors.storeName = `Máximo ${BLUEPRINT_LIMITS.storeNameMax} caracteres.`;
  }

  if (tagline.length > BLUEPRINT_LIMITS.taglineMax) {
    errors.tagline = `Máximo ${BLUEPRINT_LIMITS.taglineMax} caracteres.`;
  }

  if (whatsappNumber.length > BLUEPRINT_LIMITS.whatsappMax) {
    errors.whatsappNumber = `Máximo ${BLUEPRINT_LIMITS.whatsappMax} caracteres.`;
  } else if (!BLUEPRINT_LIMITS.whatsappPattern.test(whatsappNumber)) {
    errors.whatsappNumber = 'Solo se permiten números, espacios, +, - y paréntesis.';
  }

  if (currency.length < BLUEPRINT_LIMITS.currencyMin || currency.length > BLUEPRINT_LIMITS.currencyMax) {
    errors.currency = 'Ingresa una moneda válida (ej. $, USD, COP).';
  }

  if (!BLUEPRINT_LIMITS.accentColorPattern.test(accentColor)) {
    errors.accentColor = 'Selecciona un color hexadecimal válido.';
  }

  if (logoUrl.length > BLUEPRINT_LIMITS.logoUrlMax) {
    errors.logoUrl = 'El logo supera el tamaño máximo permitido.';
  }

  return errors;
}
