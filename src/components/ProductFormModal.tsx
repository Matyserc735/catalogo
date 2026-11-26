import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import type { Product, ProductFormInput } from '../types/catalog';
import { BLUEPRINT_LIMITS, validateProductInput } from '../utils/catalogLogic';
import { compressImageFile } from '../utils/imageUtils';
import { ProductImage } from './ProductImage';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  existingCategories: string[];
  currency: string;
  accentColor: string;
  onClose: () => void;
  onSubmit: (input: ProductFormInput) => Promise<void>;
}

const EMPTY_FORM: ProductFormInput = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  category: '',
  imageUrl: '',
  inStock: true,
  published: true,
  featured: false,
};

export function ProductFormModal({
  isOpen,
  editingProduct,
  existingCategories,
  currency,
  accentColor,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const [form, setForm] = useState<ProductFormInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        description: editingProduct.description,
        price: String(editingProduct.price),
        compareAtPrice:
          editingProduct.compareAtPrice > 0 ? String(editingProduct.compareAtPrice) : '',
        category: editingProduct.category,
        imageUrl: editingProduct.imageUrl,
        inStock: editingProduct.inStock,
        published: editingProduct.published,
        featured: editingProduct.featured,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        category: existingCategories[0] || 'General',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [isOpen, editingProduct, existingCategories]);

  if (!isOpen) return null;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setSubmitError(null);
    try {
      const dataUrl = await compressImageFile(file);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      setErrors((prev) => ({ ...prev, imageUrl: '' }));
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'No se pudo procesar la imagen.'
      );
    } finally {
      setCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateProductInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el producto. Verifica tu conexión.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl border border-stone-200 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1.5 rounded-full bg-stone-300" aria-hidden="true" />
        </div>

        <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between shrink-0">
          <h2 id="product-form-title" className="font-display text-lg font-bold text-zinc-900">
            {editingProduct ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-stone-100"
            aria-label="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {submitError ? (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {submitError}
            </div>
          ) : null}

          {/* Image Upload & URL */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-zinc-700">
              Imagen del producto
            </span>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="w-28 h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                <ProductImage
                  src={form.imageUrl}
                  alt={form.name || 'Vista previa del producto'}
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="product-image-file"
                  />
                  <label
                    htmlFor="product-image-file"
                    className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-medium text-zinc-800 hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    {compressing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                    <span>{compressing ? 'Optimizando...' : 'Subir foto'}</span>
                  </label>
                  {form.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                      className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Quitar</span>
                    </button>
                  ) : null}
                </div>
                <input
                  type="url"
                  value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="O pega un enlace URL de imagen (https://...)"
                  className="w-full min-h-[40px] px-3 rounded-xl border border-stone-200 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                />
                {errors.imageUrl ? (
                  <p className="text-xs text-red-600">{errors.imageUrl}</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="prod-name" className="block text-xs font-semibold text-zinc-700 mb-1">
              Nombre del producto *
            </label>
            <input
              id="prod-name"
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.productNameMax}
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setErrors((p) => ({ ...p, name: '' }));
              }}
              placeholder="Ej. Camiseta algodón orgánico"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
            {errors.name ? <p className="text-xs text-red-600 mt-1">{errors.name}</p> : null}
          </div>

          {/* Price & CompareAtPrice */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-price" className="block text-xs font-semibold text-zinc-700 mb-1">
                Precio ({currency}) *
              </label>
              <input
                id="prod-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                required
                value={form.price}
                onChange={(e) => {
                  setForm((p) => ({ ...p, price: e.target.value }));
                  setErrors((p) => ({ ...p, price: '' }));
                }}
                placeholder="0"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm text-zinc-900 tabular-nums focus:outline-none focus:border-zinc-900"
              />
              {errors.price ? <p className="text-xs text-red-600 mt-1">{errors.price}</p> : null}
            </div>
            <div>
              <label htmlFor="prod-compare" className="block text-xs font-semibold text-zinc-700 mb-1">
                Precio anterior (opcional)
              </label>
              <input
                id="prod-compare"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={form.compareAtPrice}
                onChange={(e) => {
                  setForm((p) => ({ ...p, compareAtPrice: e.target.value }));
                  setErrors((p) => ({ ...p, compareAtPrice: '' }));
                }}
                placeholder="Ej. 50000"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm text-zinc-900 tabular-nums focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="prod-category" className="block text-xs font-semibold text-zinc-700 mb-1">
              Categoría *
            </label>
            <input
              id="prod-category"
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.productCategoryMax}
              value={form.category}
              onChange={(e) => {
                setForm((p) => ({ ...p, category: e.target.value }));
                setErrors((p) => ({ ...p, category: '' }));
              }}
              placeholder="Ej. Ropa, Hogar, Tecnología..."
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-stone-300 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
            {existingCategories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {existingCategories.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: cat }))}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs text-zinc-700 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : null}
            {errors.category ? (
              <p className="text-xs text-red-600 mt-1">{errors.category}</p>
            ) : null}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="prod-desc" className="block text-xs font-semibold text-zinc-700 mb-1">
              Descripción
            </label>
            <textarea
              id="prod-desc"
              rows={3}
              maxLength={BLUEPRINT_LIMITS.productDescriptionMax}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Materiales, tallas, medidas o detalles importantes..."
              className="w-full p-3.5 rounded-xl border border-stone-300 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 resize-y"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/70 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm((p) => ({ ...p, inStock: e.target.checked }))}
                className="w-4 h-4 rounded accent-zinc-900"
              />
              <span className="text-xs font-medium text-zinc-800">Disponible</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/70 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                className="w-4 h-4 rounded accent-zinc-900"
              />
              <span className="text-xs font-medium text-zinc-800">Visible al cliente</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/70 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                className="w-4 h-4 rounded accent-zinc-900"
              />
              <span className="text-xs font-medium text-zinc-800">Destacado</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl border border-stone-300 bg-white text-sm font-medium text-zinc-700 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || compressing}
              style={{ backgroundColor: accentColor }}
              className="min-h-[44px] px-5 rounded-xl text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 transition-all inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{editingProduct ? 'Guardar cambios' : 'Publicar producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
