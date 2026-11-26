import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DEFAULT_STORE_SETTINGS, STARTER_PRODUCTS } from '../data/starterCatalog';
import type { Product, ProductFormInput, StoreSettings } from '../types/catalog';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'nicolasg20112011@gmail.com';
const SETTINGS_DOC_PATH = 'settings/store';

function timestampToMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return Date.now();
}

export async function verifyAdminAccess(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) {
    return false;
  }
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) {
    return true;
  }
  const adminDocPath = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, adminDocPath);
  }
}

export function subscribeStoreSettings(
  onData: (settings: StoreSettings, existsInDb: boolean) => void
): Unsubscribe {
  const settingsRef = doc(db, 'settings', 'store');
  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(DEFAULT_STORE_SETTINGS, false);
        return;
      }
      const data = snapshot.data();
      onData(
        {
          storeName: typeof data.storeName === 'string' && data.storeName.trim() ? data.storeName : DEFAULT_STORE_SETTINGS.storeName,
          tagline: typeof data.tagline === 'string' ? data.tagline : DEFAULT_STORE_SETTINGS.tagline,
          logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : '',
          whatsappNumber: typeof data.whatsappNumber === 'string' ? data.whatsappNumber : '',
          currency: typeof data.currency === 'string' && data.currency.trim() ? data.currency : '$',
          accentColor: typeof data.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.accentColor)
            ? data.accentColor
            : DEFAULT_STORE_SETTINGS.accentColor,
          seeded: Boolean(data.seeded),
          updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
          updatedAt: timestampToMillis(data.updatedAt),
        },
        true
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, SETTINGS_DOC_PATH);
    }
  );
}

export function subscribeProducts(
  isBootstrappedAdmin: boolean,
  onData: (products: Product[]) => void
): Unsubscribe {
  const productsRef = collection(db, 'products');
  const q = isBootstrappedAdmin
    ? query(productsRef)
    : query(productsRef, where('published', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: typeof data.name === 'string' ? data.name : '',
          description: typeof data.description === 'string' ? data.description : '',
          price: typeof data.price === 'number' ? data.price : 0,
          compareAtPrice: typeof data.compareAtPrice === 'number' ? data.compareAtPrice : 0,
          category: typeof data.category === 'string' ? data.category : 'General',
          imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
          inStock: Boolean(data.inStock),
          published: Boolean(data.published),
          featured: Boolean(data.featured),
          createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
          createdAt: timestampToMillis(data.createdAt),
          updatedAt: timestampToMillis(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    }
  );
}

export async function saveStoreSettings(
  uid: string,
  input: Pick<StoreSettings, 'storeName' | 'tagline' | 'logoUrl' | 'whatsappNumber' | 'currency' | 'accentColor'>,
  seeded: boolean
): Promise<void> {
  const payload = {
    storeName: input.storeName.trim(),
    tagline: input.tagline.trim(),
    logoUrl: input.logoUrl.trim(),
    whatsappNumber: input.whatsappNumber.trim(),
    currency: input.currency.trim(),
    accentColor: input.accentColor.trim(),
    seeded,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'settings', 'store'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC_PATH);
  }
}

export async function createProduct(uid: string, input: ProductFormInput): Promise<string> {
  const newDocRef = doc(collection(db, 'products'));
  const price = typeof input.price === 'string' ? Number(input.price) : input.price;
  const compareAtPrice =
    input.compareAtPrice === '' || input.compareAtPrice === undefined
      ? 0
      : typeof input.compareAtPrice === 'string'
        ? Number(input.compareAtPrice)
        : input.compareAtPrice;

  const payload = {
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number.isFinite(price) ? price : 0,
    compareAtPrice: Number.isFinite(compareAtPrice) ? compareAtPrice : 0,
    category: input.category.trim(),
    imageUrl: input.imageUrl.trim(),
    inStock: Boolean(input.inStock),
    published: Boolean(input.published),
    featured: Boolean(input.featured),
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(newDocRef, payload);
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `products/${newDocRef.id}`);
  }
}

export async function updateProduct(productId: string, input: ProductFormInput): Promise<void> {
  const price = typeof input.price === 'string' ? Number(input.price) : input.price;
  const compareAtPrice =
    input.compareAtPrice === '' || input.compareAtPrice === undefined
      ? 0
      : typeof input.compareAtPrice === 'string'
        ? Number(input.compareAtPrice)
        : input.compareAtPrice;

  const updates = {
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number.isFinite(price) ? price : 0,
    compareAtPrice: Number.isFinite(compareAtPrice) ? compareAtPrice : 0,
    category: input.category.trim(),
    imageUrl: input.imageUrl.trim(),
    inStock: Boolean(input.inStock),
    published: Boolean(input.published),
    featured: Boolean(input.featured),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, 'products', productId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}

export async function seedStarterCatalog(
  uid: string,
  currentSettings: StoreSettings
): Promise<void> {
  const batch = writeBatch(db);
  for (const item of STARTER_PRODUCTS) {
    const newRef = doc(collection(db, 'products'));
    batch.set(newRef, {
      name: item.name,
      description: item.description,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      category: item.category,
      imageUrl: item.imageUrl,
      inStock: item.inStock,
      published: item.published,
      featured: item.featured,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(db, 'settings', 'store'), {
    storeName: currentSettings.storeName.trim() || DEFAULT_STORE_SETTINGS.storeName,
    tagline: currentSettings.tagline.trim(),
    logoUrl: currentSettings.logoUrl.trim(),
    whatsappNumber: currentSettings.whatsappNumber.trim(),
    currency: currentSettings.currency.trim() || '$',
    accentColor: currentSettings.accentColor.trim() || DEFAULT_STORE_SETTINGS.accentColor,
    seeded: true,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products+settings/store');
  }
}
