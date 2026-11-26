import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Store,
  Trash2,
} from 'lucide-react';
import type { Product, ProductFormInput, StoreSettings } from '../types/catalog';
import {
  BLUEPRINT_LIMITS,
  CURATED_ACCENT_COLORS,
  CURRENCY_OPTIONS,
  extractCategories,
  filterAndSortProducts,
  formatPrice,
  normalizePhoneNumber,
  validateStoreSettingsInput,
} from '../utils/catalogLogic';
import { compressImageFile } from '../utils/imageUtils';
import { ProductFormModal } from './ProductFormModal';
import { ProductImage } from './ProductImage';

interface AdminViewProps {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  settings: StoreSettings;
  products: Product[];
  isShowingDemoData: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSaveSettings: (
    input: Pick<
      StoreSettings,
      'storeName' | 'tagline' | 'logoUrl' | 'whatsappNumber' | 'currency' | 'accentColor'
    >
  ) => Promise<void>;
  onCreateProduct: (input: ProductFormInput) => Promise<void>;
  onUpdateProduct: (productId: string, input: ProductFormInput) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSeedStarterCatalog: () => Promise<void>;
  onGoToStore: () => void;
}

type AdminTab = 'products' | 'branding';

export function AdminView({
  user,
  authReady,
  isAdmin,
  settings,
  products,
  isShowingDemoData,
  onSignIn,
  onSignOut,
  onSaveSettings,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSeedStarterCatalog,
  onGoToStore,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Store settings form state
  const [storeForm, setStoreForm] = useState({
    storeName: settings.storeName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    whatsappNumber: settings.whatsappNumber,
    currency: settings.currency,
    accentColor: settings.accentColor,
  });
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);
  const [logoCompressing, setLogoCompressing] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStoreForm({
      storeName: settings.storeName,
      tagline: settings.tagline,
      logoUrl: settings.logoUrl,
      whatsappNumber: settings.whatsappNumber,
      currency: settings.currency,
      accentColor: settings.accentColor,
    });
  }, [settings]);

  const realProducts = useMemo(
    () => (isShowingDemoData ? [] : products),
    [products, isShowingDemoData]
  );

  const categories = useMemo(
    () => extractCategories(realProducts),
    [realProducts]
  );

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(realProducts, {
        search,
        category: categoryFilter,
        sort: 'newest',
        includeUnpublished: true,
      }),
    [realProducts, search, categoryFilter]
  );

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await onSignIn();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoCompressing(true);
    try {
      const dataUrl = await compressImageFile(file, 320, 180000);
      setStoreForm((p) => ({ ...p, logoUrl: dataUrl }));
      setSettingsErrors((p) => ({ ...p, logoUrl: '' }));
    } catch (err) {
      setSettingsErrors((p) => ({
        ...p,
        logoUrl: err instanceof Error ? err.message : 'No se pudo cargar el logo.',
      }));
    } finally {
      setLogoCompressing(false);
      if (logoFileRef.current) {
        logoFileRef.current.value = '';
      }
    }
  };

  const handleSettingsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateStoreSettingsInput(storeForm);
    if (Object.keys(errs).length > 0) {
      setSettingsErrors(errs);
      return;
    }
    setSavingSettings(true);
    setSettingsSavedMsg(false);
    try {
      await onSaveSettings(storeForm);
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 2600);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleProductSubmit = async (input: ProductFormInput) => {
    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, input);
    } else {
      await onCreateProduct(input);
    }
  };

  const handleToggleStock = async (product: Product) => {
    await onUpdateProduct(product.id, {
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      category: product.category,
      imageUrl: product.imageUrl,
      inStock: !product.inStock,
      published: product.published,
      featured: product.featured,
    });
  };

  const handleTogglePublished = async (product: Product) => {
    await onUpdateProduct(product.id, {
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      category: product.category,
      imageUrl: product.imageUrl,
      inStock: product.inStock,
      published: !product.published,
      featured: product.featured,
    });
  };

  if (!authReady) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 className="w-7 h-7 animate-spin text-zinc-500 mx-auto" />
        <p className="text-sm text-zinc-500 mt-3">Verificando sesión de encargado...</p>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-12 pb-28">
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-5 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Store className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              Panel de Encargado
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {user
                ? `Iniciaste sesión como ${user.email}, pero esta cuenta no tiene permisos de administración para editar el catálogo.`
                : 'Inicia sesión con tu cuenta autorizada de Google para agregar productos ilimitados, editar precios, cambiar el nombre del sitio, subir tu logo y configurar tu número de WhatsApp.'}
            </p>
          </div>

          {authError ? (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {authError}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            {!user ? (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={authLoading}
                style={{ backgroundColor: settings.accentColor }}
                className="inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 transition-all"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Iniciar sesión con Google</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cambiar de cuenta</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoToStore}
              className="inline-flex items-center justify-center px-5 min-h-[48px] rounded-xl border border-stone-300 bg-white text-sm font-medium text-zinc-800 hover:bg-stone-50 transition-colors"
            >
              Volver al catálogo
            </button>
          </div>
        </div>
      </main>
    );
  }

  const previewPhoneDigits = normalizePhoneNumber(storeForm.whatsappNumber);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 md:pb-16 space-y-6">
      {/* Admin Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-4 sm:p-5">
        <div className="space-y-0.5">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-zinc-900">
            Administración del Catálogo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Conectado como {user.email} · {realProducts.length}{' '}
            {realProducts.length === 1 ? 'producto guardado' : 'productos guardados'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-stone-100 rounded-xl" role="tablist" aria-label="Secciones de administración">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              className={`min-h-[40px] px-4 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Productos ({realProducts.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'branding'}
              onClick={() => setActiveTab('branding')}
              className={`min-h-[40px] px-4 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'branding'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Sitio, Logo y WhatsApp
            </button>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[44px] px-3.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-stone-50 inline-flex items-center gap-1.5"
            aria-label="Cerrar sesión de administrador"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Unlimited Products Manager */}
      {activeTab === 'products' ? (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <label htmlFor="admin-search" className="sr-only">
                  Buscar en tus productos
                </label>
                <input
                  id="admin-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o categoría..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              {categories.length > 0 ? (
                <select
                  aria-label="Filtrar por categoría"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="min-h-[44px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  <option value="Todas">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              style={{ backgroundColor: settings.accentColor }}
              className="min-h-[46px] px-5 rounded-xl text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo producto</span>
            </button>
          </div>

          {realProducts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4">
              <div className="space-y-1.5">
                <h2 className="font-display text-lg font-bold text-zinc-900">
                  Tu catálogo aún no tiene productos propios
                </h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Puedes agregar tantos productos como quieras sin límite, o importar los 3 artículos de ejemplo para editarlos a tu gusto.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setModalOpen(true);
                  }}
                  style={{ backgroundColor: settings.accentColor }}
                  className="min-h-[44px] px-5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear primer producto</span>
                </button>
                <button
                  type="button"
                  disabled={seeding}
                  onClick={async () => {
                    setSeeding(true);
                    try {
                      await onSeedStarterCatalog();
                    } finally {
                      setSeeding(false);
                    }
                  }}
                  className="min-h-[44px] px-5 rounded-xl border border-stone-300 bg-white text-sm font-medium text-zinc-800 hover:bg-stone-50 inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {seeding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Importar 3 productos de ejemplo</span>
                </button>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-sm text-zinc-500">
              No hay productos que coincidan con tu búsqueda.
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-stone-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-16 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        fallbackLabel={product.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="truncate">{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.inStock ? 'En stock' : 'Agotado'}</span>
                        {!product.published ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-700 font-medium">Oculto</span>
                          </>
                        ) : null}
                      </div>
                      <p className="font-display text-sm sm:text-base font-semibold text-zinc-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold text-zinc-900 tabular-nums">
                        {formatPrice(product.price, settings.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(product)}
                      className={`min-h-[40px] px-3 rounded-xl border text-xs font-medium transition-colors ${
                        product.inStock
                          ? 'border-stone-200 bg-white text-zinc-700 hover:bg-stone-100'
                          : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                      aria-label={`Cambiar disponibilidad de ${product.name}`}
                    >
                      {product.inStock ? 'Disponible' : 'Agotado'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePublished(product)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-stone-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-stone-100 transition-colors"
                      aria-label={
                        product.published
                          ? `Ocultar ${product.name} del catálogo`
                          : `Publicar ${product.name} en el catálogo`
                      }
                      title={product.published ? 'Visible' : 'Oculto'}
                    >
                      {product.published ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(product);
                        setModalOpen(true);
                      }}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-stone-200 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-stone-100 transition-colors"
                      aria-label={`Editar ${product.name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteProduct(product)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-stone-200 bg-white text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Tab 2: Store Name, Logo & WhatsApp Phone Number */
        <section className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-7 max-w-3xl">
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-zinc-900">
                Personalización de tu sitio web
              </h2>
              <p className="text-sm text-zinc-500">
                Cambia el nombre de tu tienda, sube tu logo y define el número de celular donde llegarán los pedidos de WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="store-name" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nombre del sitio web *
                </label>
                <input
                  id="store-name"
                  type="text"
                  required
                  maxLength={BLUEPRINT_LIMITS.storeNameMax}
                  value={storeForm.storeName}
                  onChange={(e) => {
                    setStoreForm((p) => ({ ...p, storeName: e.target.value }));
                    setSettingsErrors((p) => ({ ...p, storeName: '' }));
                  }}
                  placeholder="Ej. Tienda Aurora"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
                {settingsErrors.storeName ? (
                  <p className="text-xs text-red-600 mt-1">{settingsErrors.storeName}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="store-whatsapp" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Número de celular / WhatsApp (con código de país)
                </label>
                <input
                  id="store-whatsapp"
                  type="tel"
                  maxLength={BLUEPRINT_LIMITS.whatsappMax}
                  value={storeForm.whatsappNumber}
                  onChange={(e) => {
                    setStoreForm((p) => ({ ...p, whatsappNumber: e.target.value }));
                    setSettingsErrors((p) => ({ ...p, whatsappNumber: '' }));
                  }}
                  placeholder="Ej. +57 300 123 4567"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm text-zinc-900 tabular-nums focus:outline-none focus:border-zinc-900"
                />
                {settingsErrors.whatsappNumber ? (
                  <p className="text-xs text-red-600 mt-1">{settingsErrors.whatsappNumber}</p>
                ) : previewPhoneDigits.length >= 7 ? (
                  <p className="text-[11px] text-zinc-500 mt-1 tabular-nums">
                    Enlace activo: wa.me/{previewPhoneDigits}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Incluye el código de país (ej. 57 para Colombia, 52 para México, 34 para España).
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="store-tagline" className="block text-xs font-semibold text-zinc-700 mb-1">
                Descripción corta de la tienda
              </label>
              <input
                id="store-tagline"
                type="text"
                maxLength={BLUEPRINT_LIMITS.taglineMax}
                value={storeForm.tagline}
                onChange={(e) => setStoreForm((p) => ({ ...p, tagline: e.target.value }))}
                placeholder="Ej. Envíos a todo el país · Atención inmediata por WhatsApp"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            {/* Logo uploader */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-zinc-700">
                Logo del sitio web
              </span>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-2xl border border-stone-200 bg-stone-50/70">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-stone-200 flex items-center justify-center shrink-0">
                  {storeForm.logoUrl ? (
                    <img
                      src={storeForm.logoUrl}
                      alt="Vista previa del logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-zinc-400" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="sr-only"
                      id="store-logo-file"
                    />
                    <label
                      htmlFor="store-logo-file"
                      className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-medium text-zinc-800 hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      {logoCompressing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4" />
                      )}
                      <span>{logoCompressing ? 'Procesando...' : 'Subir logo'}</span>
                    </label>
                    {storeForm.logoUrl ? (
                      <button
                        type="button"
                        onClick={() => setStoreForm((p) => ({ ...p, logoUrl: '' }))}
                        className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Quitar logo</span>
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="url"
                    value={storeForm.logoUrl.startsWith('data:') ? '' : storeForm.logoUrl}
                    onChange={(e) => setStoreForm((p) => ({ ...p, logoUrl: e.target.value }))}
                    placeholder="O pega un enlace URL del logo (https://...)"
                    className="w-full min-h-[40px] px-3 rounded-xl border border-stone-200 bg-white text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                  />
                  {settingsErrors.logoUrl ? (
                    <p className="text-xs text-red-600">{settingsErrors.logoUrl}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Currency & Brand Accent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="store-currency" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Moneda de los precios
                </label>
                <select
                  id="store-currency"
                  value={storeForm.currency}
                  onChange={(e) => setStoreForm((p) => ({ ...p, currency: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                >
                  {CURRENCY_OPTIONS.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Color principal de botones
                </span>
                <div className="flex items-center gap-2.5 min-h-[44px]">
                  {CURATED_ACCENT_COLORS.map((swatch) => {
                    const selected = storeForm.accentColor.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setStoreForm((p) => ({ ...p, accentColor: swatch.hex }))}
                        style={{ backgroundColor: swatch.hex }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform ${
                          selected ? 'ring-2 ring-offset-2 ring-zinc-900 scale-105' : 'hover:scale-105'
                        }`}
                        aria-label={`Seleccionar color ${swatch.label}`}
                        title={swatch.label}
                      >
                        {selected ? <Check className="w-4 h-4" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="text-xs font-medium text-emerald-700">
                {settingsSavedMsg ? 'Configuración guardada y publicada en vivo.' : null}
              </div>
              <button
                type="submit"
                disabled={savingSettings || logoCompressing}
                style={{ backgroundColor: storeForm.accentColor }}
                className="min-h-[46px] px-6 rounded-xl text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 transition-all inline-flex items-center gap-2"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Guardar configuración</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Product Create / Edit Modal */}
      <ProductFormModal
        isOpen={modalOpen}
        editingProduct={editingProduct}
        existingCategories={categories}
        currency={settings.currency}
        accentColor={settings.accentColor}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductSubmit}
      />

      {/* Delete Confirmation Dialog */}
      {confirmDeleteProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          onClick={() => setConfirmDeleteProduct(null)}
        >
          <div
            className="max-w-sm w-full bg-white rounded-2xl border border-stone-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-confirm-title" className="font-display text-lg font-bold text-zinc-900">
              ¿Eliminar producto?
            </h2>
            <p className="text-sm text-zinc-600">
              Se eliminará permanentemente <strong>{confirmDeleteProduct.name}</strong> del catálogo.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                className="min-h-[44px] px-4 rounded-xl border border-stone-300 bg-white text-sm font-medium text-zinc-700 hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmDeleteProduct;
                  setConfirmDeleteProduct(null);
                  await onDeleteProduct(target.id);
                }}
                className="min-h-[44px] px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
