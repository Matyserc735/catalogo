import { useEffect, useState } from 'react';
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { CartItem, StoreSettings } from '../types/catalog';
import {
  buildWhatsAppCartUrl,
  calculateCartTotals,
  formatPrice,
} from '../utils/catalogLogic';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  settings: StoreSettings;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  items,
  settings,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [customerNote, setCustomerNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { totalItems, subtotal } = calculateCartTotals(items);
  const whatsappUrl = buildWhatsAppCartUrl(
    settings.whatsappNumber,
    settings.storeName,
    items,
    settings.currency,
    customerNote
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-none h-[88vh] sm:h-full flex flex-col border-t sm:border-t-0 sm:border-l border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1.5 rounded-full bg-stone-300" aria-hidden="true" />
        </div>

        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <h2 id="cart-drawer-title" className="font-display text-lg font-bold text-zinc-900">
              Tu Pedido
            </h2>
            <p className="text-xs text-zinc-500 tabular-nums">
              {totalItems === 0
                ? 'Sin productos seleccionados'
                : `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 ? (
              <button
                type="button"
                onClick={onClearCart}
                className="min-h-[44px] px-3 text-xs font-medium text-zinc-500 hover:text-zinc-900 rounded-xl hover:bg-stone-100 transition-colors"
              >
                Vaciar
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-stone-100 transition-colors"
              aria-label="Cerrar pedido"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-base font-semibold text-zinc-900">
                  Tu pedido está vacío
                </p>
                <p className="text-sm text-zinc-500 max-w-xs">
                  Agrega productos del catálogo o toca Comprar en cualquier artículo para escribir directo por WhatsApp.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="py-4 flex gap-3.5 items-start">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/70 shrink-0">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      fallbackLabel={product.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900 line-clamp-2">
                        {product.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                        aria-label={`Quitar ${product.name} del pedido`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 tabular-nums mt-0.5">
                      {formatPrice(product.price, settings.currency)} c/u
                    </p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="inline-flex items-center border border-stone-200 rounded-xl bg-stone-50">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-700 hover:bg-stone-200/60 rounded-l-xl"
                          aria-label={`Reducir cantidad de ${product.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-700 hover:bg-stone-200/60 rounded-r-xl"
                          aria-label={`Aumentar cantidad de ${product.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 tabular-nums">
                        {formatPrice(product.price * quantity, settings.currency)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="p-5 border-t border-stone-200 bg-stone-50/70 space-y-3.5 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div>
              <label htmlFor="order-note" className="block text-xs font-medium text-zinc-700 mb-1">
                Nota o dirección de entrega (opcional)
              </label>
              <input
                id="order-note"
                type="text"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                maxLength={140}
                placeholder="Ej. Enviar a Calle 10 #4-20, pago contra entrega"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-zinc-600">Total estimado</span>
              <span className="font-display text-xl font-bold text-zinc-900 tabular-nums">
                {formatPrice(subtotal, settings.currency)}
              </span>
            </div>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: settings.accentColor }}
                className="w-full min-h-[48px] px-5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Enviar pedido por WhatsApp</span>
              </a>
            ) : (
              <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center">
                El encargado aún no ha configurado el número de WhatsApp de la tienda.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
