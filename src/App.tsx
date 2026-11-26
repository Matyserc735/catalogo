import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { DEFAULT_STORE_SETTINGS, STARTER_PRODUCTS } from './data/starterCatalog';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  createProduct,
  deleteProduct,
  saveStoreSettings,
  seedStarterCatalog,
  subscribeProducts,
  subscribeStoreSettings,
  updateProduct,
  verifyAdminAccess,
} from './services/catalogService';
import type { AppView, CartItem, Product, ProductFormInput, StoreSettings } from './types/catalog';
import { calculateCartTotals } from './utils/catalogLogic';
import { AdminView } from './components/AdminView';
import { CartDrawer } from './components/CartDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProductDetailModal } from './components/ProductDetailModal';
import { StorefrontView } from './components/StorefrontView';

function CatalogApp() {
  const [activeView, setActiveView] = useState<AppView>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      return 'admin';
    }
    return 'store';
  });

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('catalogo_vivo_cart');
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Sync browser tab title with customizable store name
  useEffect(() => {
    document.title = `${settings.storeName} — Catálogo`;
  }, [settings.storeName]);

  // Persist order bag locally
  useEffect(() => {
    try {
      localStorage.setItem('catalogo_vivo_cart', JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  // Monitor auth state & admin privileges
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const allowed = await verifyAdminAccess(nextUser);
          setIsAdmin(allowed);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to storefront configuration
  useEffect(() => {
    const unsub = subscribeStoreSettings((nextSettings) => {
      setSettings(nextSettings);
    });
    return () => unsub();
  }, []);

  // Subscribe to unlimited Firestore products
  useEffect(() => {
    if (!authReady) return;
    const isBootstrapped = Boolean(
      user?.emailVerified && user.email === BOOTSTRAPPED_ADMIN_EMAIL
    );
    const unsub = subscribeProducts(isBootstrapped, (items) => {
      setFirestoreProducts(items);
      setProductsLoaded(true);
    });
    return () => unsub();
  }, [authReady, user?.email, user?.emailVerified]);

  const isShowingDemoData =
    productsLoaded && firestoreProducts.length === 0 && !settings.seeded;

  const displayedProducts = useMemo(
    () => (isShowingDemoData ? STARTER_PRODUCTS : firestoreProducts),
    [isShowingDemoData, firestoreProducts]
  );

  const { totalItems: cartCount } = useMemo(
    () => calculateCartTotals(cartItems),
    [cartItems]
  );

  const handleChangeView = (view: AppView) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', view === 'admin' ? '#admin' : '#catalogo-inicio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, product, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSaveSettings = async (
    input: Pick<
      StoreSettings,
      'storeName' | 'tagline' | 'logoUrl' | 'whatsappNumber' | 'currency' | 'accentColor'
    >
  ) => {
    if (!user) return;
    await saveStoreSettings(user.uid, input, settings.seeded);
  };

  const handleCreateProduct = async (input: ProductFormInput) => {
    if (!user) return;
    await createProduct(user.uid, input);
    if (!settings.seeded) {
      await saveStoreSettings(
        user.uid,
        {
          storeName: settings.storeName,
          tagline: settings.tagline,
          logoUrl: settings.logoUrl,
          whatsappNumber: settings.whatsappNumber,
          currency: settings.currency,
          accentColor: settings.accentColor,
        },
        true
      );
    }
  };

  const handleUpdateProduct = async (productId: string, input: ProductFormInput) => {
    await updateProduct(productId, input);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId);
  };

  const handleSeedStarter = async () => {
    if (!user) return;
    await seedStarterCatalog(user.uid, settings);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B]">
      <Header
        settings={settings}
        activeView={activeView}
        cartCount={cartCount}
        onChangeView={handleChangeView}
        onOpenCart={() => setCartOpen(true)}
      />

      {activeView === 'store' ? (
        <StorefrontView
          settings={settings}
          products={displayedProducts}
          loading={!productsLoaded}
          isShowingDemoData={isShowingDemoData}
          onSelectProduct={setSelectedProduct}
          onAddToCart={(product) => handleAddToCart(product, 1)}
          onGoToAdmin={() => handleChangeView('admin')}
        />
      ) : (
        <AdminView
          user={user}
          authReady={authReady}
          isAdmin={isAdmin}
          settings={settings}
          products={displayedProducts}
          isShowingDemoData={isShowingDemoData}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onSaveSettings={handleSaveSettings}
          onCreateProduct={handleCreateProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onSeedStarterCatalog={handleSeedStarter}
          onGoToStore={() => handleChangeView('store')}
        />
      )}

      <MobileBottomNav
        activeView={activeView}
        cartCount={cartCount}
        accentColor={settings.accentColor}
        onChangeView={handleChangeView}
        onOpenCart={() => setCartOpen(true)}
      />

      <ProductDetailModal
        product={selectedProduct}
        settings={settings}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={cartOpen}
        items={cartItems}
        settings={settings}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CatalogApp />
    </ErrorBoundary>
  );
}
