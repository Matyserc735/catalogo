import { ShoppingBag, Store } from 'lucide-react';
import type { AppView, StoreSettings } from '../types/catalog';

interface HeaderProps {
  settings: StoreSettings;
  activeView: AppView;
  cartCount: number;
  onChangeView: (view: AppView) => void;
  onOpenCart: () => void;
}

export function Header({
  settings,
  activeView,
  cartCount,
  onChangeView,
  onOpenCart,
}: HeaderProps) {
  const handleScrollToContact = () => {
    if (activeView !== 'store') {
      onChangeView('store');
      setTimeout(() => {
        document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[52px] md:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand mark + single-line wordmark */}
        <button
          type="button"
          onClick={() => onChangeView('store')}
          className="flex items-center gap-2.5 min-h-[44px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 rounded-lg shrink-0 max-w-[60vw] sm:max-w-xs"
          aria-label={`Ir al inicio de ${settings.storeName}`}
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={`Logo de ${settings.storeName}`}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-stone-200 bg-white shrink-0"
            />
          ) : (
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: settings.accentColor }}
              aria-hidden="true"
            >
              <Store className="w-4 h-4" />
            </span>
          )}
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-zinc-900 truncate whitespace-nowrap">
            {settings.storeName}
          </span>
        </button>

        {/* Zone 2: Clean single-line text links (desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium" aria-label="Navegación principal">
          <button
            type="button"
            onClick={() => onChangeView('store')}
            className={`py-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              activeView === 'store'
                ? 'text-zinc-900 border-zinc-900'
                : 'text-zinc-500 border-transparent hover:text-zinc-900'
            }`}
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => onChangeView('admin')}
            className={`py-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              activeView === 'admin'
                ? 'text-zinc-900 border-zinc-900'
                : 'text-zinc-500 border-transparent hover:text-zinc-900'
            }`}
          >
            Administración
          </button>
          <button
            type="button"
            onClick={handleScrollToContact}
            className="py-2 whitespace-nowrap shrink-0 text-zinc-500 border-b-2 border-transparent hover:text-zinc-900 transition-colors"
          >
            Contacto
          </button>
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            style={{ backgroundColor: settings.accentColor }}
            className="inline-flex items-center justify-center gap-2 px-4 min-h-[40px] md:min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold text-white hover:opacity-95 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            aria-label={`Abrir mi pedido, ${cartCount} productos`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="tabular-nums">
              {cartCount > 0 ? `Pedido (${cartCount})` : 'Mi Pedido'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
