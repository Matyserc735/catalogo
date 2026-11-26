import type { Product, StoreSettings } from '../types/catalog';

export const HERO_BANNER_IMAGE = '/src/assets/images/hero_catalog_showcase_1795722017014.jpg';
export const DEFAULT_LOGO_IMAGE = '/src/assets/images/store_default_logo_1795722017814.jpg';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Atelier Norte',
  tagline: 'Objetos esenciales para el hogar y tu día a día. Pide directo por WhatsApp.',
  logoUrl: DEFAULT_LOGO_IMAGE,
  whatsappNumber: '573001234567',
  currency: '$',
  accentColor: '#115E59',
  seeded: false,
};

export const STARTER_PRODUCTS: Product[] = [
  {
    id: 'demo-cafetera-gres',
    name: 'Cafetera Pour-Over en Gres',
    description:
      'Jarra artesanal de gres mate con collarín de madera de nogal y taza a juego. Ideal para extracciones limpias de café de especialidad.',
    price: 145000,
    compareAtPrice: 170000,
    category: 'Hogar',
    imageUrl: '/src/assets/images/product_ceramic_carafe_1795722016634.jpg',
    inStock: true,
    published: true,
    featured: true,
    createdBy: 'demo',
    createdAt: 1795722003,
    updatedAt: 1795722003,
  },
  {
    id: 'demo-mochila-lona',
    name: 'Mochila Urbana Lona y Cuero',
    description:
      'Mochila estructurada en lona encerada repelente al agua con bolsillo frontal en cuero natural y compartimento acolchado para portátil.',
    price: 289000,
    compareAtPrice: 0,
    category: 'Accesorios',
    imageUrl: '/src/assets/images/product_canvas_backpack_1795722017054.jpg',
    inStock: true,
    published: true,
    featured: true,
    createdBy: 'demo',
    createdAt: 1795722002,
    updatedAt: 1795722002,
  },
  {
    id: 'demo-altavoz-aluminio',
    name: 'Altavoz Portátil Aluminio',
    description:
      'Sonido envolvente de 360 grados en cuerpo de aluminio cepillado y tejido acústico. Batería de 14 horas y correa tejida.',
    price: 320000,
    compareAtPrice: 365000,
    category: 'Audio',
    imageUrl: '/src/assets/images/product_wireless_speaker_1795722018128.jpg',
    inStock: true,
    published: true,
    featured: true,
    createdBy: 'demo',
    createdAt: 1795722001,
    updatedAt: 1795722001,
  },
];
