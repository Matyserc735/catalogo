export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl: string;
  whatsappNumber: string;
  currency: string;
  accentColor: string;
  seeded: boolean;
  updatedBy?: string;
  updatedAt?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  published: boolean;
  featured: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProductFormInput {
  name: string;
  description: string;
  price: string | number;
  compareAtPrice: string | number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  published: boolean;
  featured: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name';

export type AppView = 'store' | 'admin';
