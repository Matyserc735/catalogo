import { ShoppingBag, SlidersHorizontal, Store } from 'lucide-react';
import type { AppView } from '../types/catalog';

interface MobileBottomNavProps {
  activeView: AppView;
  cartCount: number;
  accentColor: string;
  onChangeView: (view: AppView) => void;
  onOpenCart: () => void;
}

export function MobileBottomNav({
  activeView,
  cartCount,
  accentColor,
  onChangeView,
  onOpenCart,
}: MobileBottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 h-[60px] pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación móvil"
    >
      <div className="grid grid-cols-3 h-full max-w-md mx-auto">
        <button
          type="button"
          onClick={() => onChangeView('store')}
          className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-colors"
          style={{ color: activeView === 'store' ? accentColor : '#71717A' }}
          aria-current={activeView === 'store' ? 'page' : undefined}
        >
          <Store className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Catálogo
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-zinc-600 hover:text-zinc-900 relative transition-colors"
          aria-label={`Ver pedido (${cartCount} artículos)`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 ? (
              <span
                className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center tabular-nums"
                style={{ backgroundColor: accentColor }}
              >
                {cartCount}
              </span>
            ) : null}
          </div>
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Pedido
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeView('admin')}
          className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-colors"
          style={{ color: activeView === 'admin' ? accentColor : '#71717A' }}
          aria-current={activeView === 'admin' ? 'page' : undefined}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Administrar
          </span>
        </button>
      </div>
    </nav>
  );
}
