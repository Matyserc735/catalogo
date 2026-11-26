import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import type { Product, SortOption, StoreSettings } from '../types/catalog';
import { HERO_BANNER_IMAGE } from '../data/starterCatalog';
import {
  buildWhatsAppProductUrl,
  extractCategories,
  filterAndSortProducts,
  formatPrice,
  normalizePhoneNumber,
} from '../utils/catalogLogic';
import { ProductImage } from './ProductImage';

interface StorefrontViewProps {
  settings: StoreSettings;
  products: Product[];
  loading: boolean;
  isShowingDemoData: boolean;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onGoToAdmin: () => void;
}

const PAGE_BATCH_SIZE = 24;

export function StorefrontView({
  settings,
  products,
  loading,
  isShowingDemoData,
  onSelectProduct,
  onAddToCart,
  onGoToAdmin,
}: StorefrontViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sort, setSort] = useState<SortOption>('newest');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_BATCH_SIZE);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const publishedProducts = useMemo(
    () => products.filter((p) => p.published),
    [products]
  );

  const categories = useMemo(
    () => ['Todas', ...extractCategories(publishedProducts)],
    [publishedProducts]
  );

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(publishedProducts, {
        search,
        category: selectedCategory,
        sort,
      }),
    [publishedProducts, search, selectedCategory, sort]
  );

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit]
  );

  const hasMore = filteredProducts.length > visibleProducts.length;
  const normalizedPhone = normalizePhoneNumber(settings.whatsappNumber);
  const directContactUrl =
    normalizedPhone.length >= 7
      ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
          `Hola *${settings.storeName}*, tengo una consulta sobre el catálogo.`
        )}`
      : null;

  const handleQuickAdd = (product: Product) => {
    onAddToCart(product);
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === product.id ? null : curr));
    }, 1200);
  };

  return (
    <main className="pb-24 md:pb-16">
      {/* Storefront Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-7 pb-6 sm:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 items-stretch bg-white border border-stone-200/90 rounded-3xl overflow-hidden">
          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-10 flex flex-col justify-center space-y-4 order-2 lg:order-1">
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500 tracking-wide">
                Catálogo en línea · Compra directa
              </p>
              <h1 className="font-display text-2xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-zinc-900 leading-[1.12] text-balance">
                {settings.storeName}
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl">
                {settings.tagline ||
                  'Explora nuestros productos disponibles y realiza tu pedido en segundos por WhatsApp.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              <a
                href="#catalogo"
                style={{ backgroundColor: settings.accentColor }}
                className="inline-flex items-center justify-center px-5 min-h-[44px] rounded-xl text-sm font-semibold text-white hover:opacity-95 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
              >
                Ver productos
              </a>
              {directContactUrl ? (
                <a
                  href={directContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl border border-stone-300 bg-white text-sm font-semibold text-zinc-900 hover:bg-stone-50 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>WhatsApp</span>
                </a>
              ) : null}
            </div>

            {isShowingDemoData ? (
              <p className="text-xs text-zinc-500">
                Catálogo de muestra activo ·{' '}
                <button
                  type="button"
                  onClick={onGoToAdmin}
                  className="underline underline-offset-2 font-medium text-zinc-800 hover:text-zinc-950"
                >
                  Personalizar tienda en Administración
                </button>
              </p>
            ) : null}
          </div>

          <div className="lg:col-span-6 h-44 sm:h-64 lg:h-auto lg:min-h-[300px] bg-stone-100 order-1 lg:order-2">
            <img
              src={HERO_BANNER_IMAGE}
              alt={`Exhibición de productos de ${settings.storeName}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Catalog Search, Categories & Grid */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 scroll-mt-16">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900">
                Productos
              </h2>
              <span className="text-xs sm:text-sm text-zinc-500 tabular-nums">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative hidden sm:block sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <label htmlFor="catalog-search-desktop" className="sr-only">
                  Buscar productos
                </label>
                <input
                  id="catalog-search-desktop"
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleLimit(PAGE_BATCH_SIZE);
                  }}
                  placeholder="Buscar producto..."
                  className="w-full min-h-[44px] pl-10 pr-9 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <div className="relative shrink-0">
                <label htmlFor="catalog-sort" className="sr-only">
                  Ordenar productos
                </label>
                <ArrowDownUp className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="catalog-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="min-h-[44px] pl-9 pr-4 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-medium text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                >
                  <option value="newest">Destacados</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="name">Nombre A–Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile full-width search bar so placeholder never clips */}
          <div className="relative sm:hidden">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <label htmlFor="catalog-search-mobile" className="sr-only">
              Buscar productos
            </label>
            <input
              id="catalog-search-mobile"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleLimit(PAGE_BATCH_SIZE);
              }}
              placeholder="Buscar producto o categoría..."
              className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800"
                aria-label="Limpiar búsqueda móvil"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Category Filter Tabs */}
          {categories.length > 1 ? (
            <div
              className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
              role="tablist"
              aria-label="Categorías del catálogo"
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setVisibleLimit(PAGE_BATCH_SIZE);
                    }}
                    style={
                      isActive
                        ? { backgroundColor: settings.accentColor, color: '#FFFFFF', borderColor: settings.accentColor }
                        : undefined
                    }
                    className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 border transition-colors ${
                      isActive
                        ? 'shadow-xs'
                        : 'bg-white border-stone-200 text-zinc-700 hover:bg-stone-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-stone-200" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 w-16 bg-stone-200 rounded" />
                  <div className="h-4 w-3/4 bg-stone-200 rounded" />
                  <div className="h-5 w-1/2 bg-stone-200 rounded" />
                  <div className="h-11 w-full bg-stone-200 rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-3">
            <p className="font-display text-lg font-semibold text-zinc-900">
              No encontramos productos con ese filtro
            </p>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {publishedProducts.length === 0
                ? 'Todavía no hay productos publicados en este catálogo.'
                : 'Prueba limpiando el buscador o seleccionando otra categoría.'}
            </p>
            {search || selectedCategory !== 'Todas' ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('Todas');
                }}
                className="inline-flex items-center justify-center px-5 min-h-[44px] rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Mostrar todos los productos
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6"
              data-testid="product-grid"
            >
              {visibleProducts.map((product) => {
                const directBuyUrl = buildWhatsAppProductUrl(
                  settings.whatsappNumber,
                  settings.storeName,
                  product,
                  settings.currency,
                  1
                );
                const hasDiscount = product.compareAtPrice > product.price;
                const isAdded = justAddedId === product.id;

                return (
                  <article
                    key={product.id}
                    className="group bg-white border border-stone-200/90 rounded-2xl overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="w-full text-left block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900"
                        aria-label={`Ver detalles de ${product.name}`}
                      >
                        <div className="aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            fallbackLabel={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="p-3 sm:p-4 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-500 truncate">
                            <span className="truncate">{product.category}</span>
                            {!product.inStock ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-700 font-medium">Agotado</span>
                              </>
                            ) : null}
                          </div>

                          <h3 className="font-display text-sm sm:text-base font-semibold text-zinc-900 line-clamp-2 leading-snug min-h-[2.5rem]">
                            {product.name}
                          </h3>

                          <div className="flex items-baseline gap-2 tabular-nums pt-0.5 flex-wrap">
                            <span className="text-base sm:text-lg font-bold text-zinc-900">
                              {formatPrice(product.price, settings.currency)}
                            </span>
                            {hasDiscount ? (
                              <span className="text-xs text-zinc-400 line-through">
                                {formatPrice(product.compareAtPrice, settings.currency)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 flex items-center gap-2">
                      {product.inStock ? (
                        <>
                          {directBuyUrl ? (
                            <a
                              href={directBuyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ backgroundColor: settings.accentColor }}
                              className="flex-1 min-h-[44px] px-3 rounded-xl text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.98] transition-all whitespace-nowrap"
                              aria-label={`Comprar ${product.name} por WhatsApp`}
                            >
                              <MessageCircle className="w-4 h-4 shrink-0" />
                              <span>Comprar</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectProduct(product)}
                              style={{ backgroundColor: settings.accentColor }}
                              className="flex-1 min-h-[44px] px-3 rounded-xl text-white text-xs sm:text-sm font-semibold flex items-center justify-center hover:opacity-95 transition-all whitespace-nowrap"
                            >
                              Ver producto
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleQuickAdd(product)}
                            className="min-h-[44px] min-w-[44px] rounded-xl border border-stone-200 bg-stone-50 text-zinc-800 hover:bg-stone-100 active:scale-[0.96] flex items-center justify-center transition-all shrink-0"
                            aria-label={`Agregar ${product.name} al pedido`}
                            title="Agregar al pedido"
                          >
                            {isAdded ? (
                              <ShoppingBag className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="w-full min-h-[44px] px-3 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm font-medium text-zinc-500 hover:bg-stone-100 transition-colors"
                        >
                          Ver detalles
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore ? (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((n) => n + PAGE_BATCH_SIZE)}
                  className="min-h-[46px] px-6 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-zinc-900 hover:bg-stone-50 transition-colors tabular-nums"
                >
                  Mostrar más productos ({filteredProducts.length - visibleProducts.length} restantes)
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Contact & Footer Section */}
      <footer
        id="contacto"
        className="max-w-7xl mx-auto px-4 sm:px-6 mt-14 pt-8 border-t border-stone-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="space-y-1">
            <p className="font-display font-bold text-zinc-900">{settings.storeName}</p>
            <p className="text-xs text-zinc-500">
              Catálogo en línea · Atención directa por teléfono y WhatsApp
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {normalizedPhone.length >= 7 ? (
              <a
                href={`tel:+${normalizedPhone}`}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm font-medium text-zinc-800 hover:bg-stone-50 transition-colors tabular-nums"
              >
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>{settings.whatsappNumber}</span>
              </a>
            ) : null}
            {directContactUrl ? (
              <a
                href={directContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: settings.accentColor }}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold text-white hover:opacity-95 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </main>
  );
}
