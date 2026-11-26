import { useEffect, useState } from 'react';
import { MessageCircle, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import type { Product, StoreSettings } from '../types/catalog';
import { buildWhatsAppProductUrl, formatPrice } from '../utils/catalogLogic';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  product: Product | null;
  settings: StoreSettings;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  settings,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setAddedFeedback(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const whatsappUrl = buildWhatsAppProductUrl(
    settings.whatsappNumber,
    settings.storeName,
    product,
    settings.currency,
    quantity
  );

  const hasDiscount = product.compareAtPrice > product.price;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1.5 rounded-full bg-stone-300" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500 truncate">
            <span className="font-medium text-zinc-700">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.inStock ? 'Disponible' : 'Agotado'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-stone-100 transition-colors"
            aria-label="Cerrar detalle del producto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200/70">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              fallbackLabel={product.name}
            />
          </div>

          <div className="flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <h2
                id="product-modal-title"
                className="font-display text-xl sm:text-2xl font-bold text-zinc-900 text-balance leading-snug"
              >
                {product.name}
              </h2>

              <div className="flex items-baseline gap-2.5 tabular-nums">
                <span className="text-2xl font-bold text-zinc-900">
                  {formatPrice(product.price, settings.currency)}
                </span>
                {hasDiscount ? (
                  <span className="text-sm text-zinc-400 line-through">
                    {formatPrice(product.compareAtPrice, settings.currency)}
                  </span>
                ) : null}
              </div>

              {product.description ? (
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line pt-1">
                  {product.description}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 pt-1">
                  Consulta más detalles directamente por WhatsApp.
                </p>
              )}
            </div>

            {product.inStock ? (
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">Cantidad</span>
                  <div className="inline-flex items-center border border-stone-200 rounded-xl bg-stone-50">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-700 hover:bg-stone-200/60 rounded-l-xl transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold tabular-nums text-zinc-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-700 hover:bg-stone-200/60 rounded-r-xl transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: settings.accentColor }}
                      className="w-full min-h-[48px] px-5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Comprar por WhatsApp · {formatPrice(product.price * quantity, settings.currency)}
                      </span>
                    </a>
                  ) : (
                    <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center">
                      El encargado aún no ha configurado el número de WhatsApp en Administración.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-full min-h-[44px] px-5 rounded-xl border border-stone-300 bg-white text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-50 active:scale-[0.99] transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>
                      {addedFeedback ? 'Agregado al pedido' : 'Agregar al pedido'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-stone-100 text-sm text-zinc-600 text-center font-medium">
                Este producto está temporalmente agotado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
