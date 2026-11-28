import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ImageOff, Plus, Trash2 } from 'lucide-react';
import Modal from './Modal';
import FormField, { Alert } from './FormField';
import Badge from './Badge';
import { TAG_ICONS } from './TagChips';
import { productsApi } from '../api';
import { BADGE_OPTIONS, TAG_OPTIONS, endOfDayIso, formatPrice, getPricing, isValidUrl, toDateInput } from '../utils/format';

const SHORT_DESCRIPTION = 80;

const emptyForm = (categoryId) => ({
  name: '',
  description: '',
  categoryId: categoryId ?? '',
  price: '',
  discountPrice: '',
  badgeType: 'ninguno',
  badgeExpiresAt: '',
  tags: [],
  isAvailable: true,
  order: '0',
  images: [''],
});

const toForm = (product) => ({
  name: product.name,
  description: product.description || '',
  categoryId: product.categoryId,
  price: String(Number(product.price)),
  discountPrice: product.discountPrice !== null && product.discountPrice !== undefined ? String(Number(product.discountPrice)) : '',
  badgeType: product.badgeType,
  badgeExpiresAt: toDateInput(product.badgeExpiresAt),
  tags: product.tags || [],
  isAvailable: product.isAvailable,
  order: String(product.order ?? 0),
  images: product.images?.length ? product.images.map((image) => image.url) : [''],
});

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
  if (!form.categoryId) errors.categoryId = 'Elegí una categoría';
  const price = Number(form.price);
  if (form.price === '' || Number.isNaN(price) || price < 0) errors.price = 'Ingresá un precio válido';
  if (form.badgeType === 'descuento') {
    const discount = Number(form.discountPrice);
    if (form.discountPrice === '') errors.discountPrice = 'Ingresá el precio con descuento';
    else if (Number.isNaN(discount) || discount < 0) errors.discountPrice = 'Precio inválido';
    else if (!errors.price && discount >= price) errors.discountPrice = 'Tiene que ser menor que el precio';
  }
  if (form.order !== '' && !Number.isInteger(Number(form.order))) errors.order = 'Tiene que ser un número entero';
  const badImage = form.images.findIndex((url) => url.trim() && !isValidUrl(url.trim()));
  if (badImage !== -1) errors.images = `La imagen ${badImage + 1} no es una URL válida`;
  return errors;
};

const toPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  categoryId: Number(form.categoryId),
  price: Number(form.price),
  discountPrice: form.badgeType === 'descuento' && form.discountPrice !== '' ? Number(form.discountPrice) : null,
  badgeType: form.badgeType,
  badgeExpiresAt: form.badgeType === 'ninguno' ? null : endOfDayIso(form.badgeExpiresAt),
  tags: form.tags,
  isAvailable: form.isAvailable,
  order: Number(form.order) || 0,
  images: form.images.map((url) => url.trim()).filter(Boolean),
});

export default function ProductEditor({ open, product, categories, defaultCategoryId, onClose, onSaved }) {
  const [form, setForm] = useState(() => emptyForm(defaultCategoryId));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(product ? toForm(product) : emptyForm(defaultCategoryId ?? categories[0]?.id));
    setErrors({});
    setApiError('');
  }, [open, product, defaultCategoryId, categories]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const bind = (field) => ({ value: form[field], onChange: (event) => set(field, event.target.value) });

  const toggleTag = (tag) =>
    set('tags', form.tags.includes(tag) ? form.tags.filter((value) => value !== tag) : [...form.tags, tag]);

  const descriptionLength = form.description.trim().length;

  const setImage =(index, value) => set('images', form.images.map((url, i) => (i === index ? value : url)));
  const removeImage = (index) => set('images', form.images.length > 1 ? form.images.filter((_, i) => i !== index) : ['']);
  const moveImage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= form.images.length) return;
    const images = [...form.images];
    [images[index], images[target]] = [images[target], images[index]];
    set('images', images);
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setApiError('');
    try {
      const payload = toPayload(form);
      const saved = product ? await productsApi.update(product.id, payload) : await productsApi.create(payload);
      onSaved(saved);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const preview = getPricing({
    price: form.price || 0,
    discountPrice: form.discountPrice === '' ? null : form.discountPrice,
    badgeType: form.badgeType,
    badgeExpiresAt: endOfDayIso(form.badgeExpiresAt),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      size="max-w-2xl"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" form="product-form" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{apiError}</Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" error={errors.name}>
            <input className={`field ${errors.name ? 'field-error' : ''}`} {...bind('name')} />
          </FormField>
          <FormField label="Categoría" error={errors.categoryId}>
            <select className={`field ${errors.categoryId ? 'field-error' : ''}`} {...bind('categoryId')}>
              <option value="">Elegí una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField
          label="Descripción"
          hint={
            descriptionLength > 0 && descriptionLength < SHORT_DESCRIPTION
              ? `Es corta (${descriptionLength} caracteres). Sumá ingredientes, preparación o tamaño de la porción.`
              : 'Contá qué lleva, cómo se prepara, con qué viene y para cuántos alcanza.'
          }
        >
          <textarea
            className="field min-h-28 resize-y"
            placeholder="Ej.: Masa de fermentación lenta, salsa de tomate San Marzano, mozzarella fior di latte y albahaca fresca. Se cocina en horno a leña. 8 porciones."
            {...bind('description')}
          />
        </FormField>

        <div>
          <span className="label">Etiquetas para el cliente</span>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(({ value, label }) => {
              const Icon = TAG_ICONS[value];
              const active = form.tags.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTag(value)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active ? 'border-accent bg-accent text-stone-900' : 'border-stone-700 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Precio" error={errors.price}>
            <input className={`field ${errors.price ? 'field-error' : ''}`} type="number" min="0" step="0.01" {...bind('price')} />
          </FormField>
          <FormField label="Destacado" hint="Etiqueta que se ve sobre la foto">
            <select className="field" {...bind('badgeType')}>
              {BADGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Orden" error={errors.order} hint="Menor = aparece antes">
            <input className={`field ${errors.order ? 'field-error' : ''}`} type="number" step="1" {...bind('order')} />
          </FormField>
        </div>

        {form.badgeType !== 'ninguno' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {form.badgeType === 'descuento' && (
              <FormField label="Precio con descuento" error={errors.discountPrice} hint="Lo que paga el cliente mientras dure la promo">
                <input className={`field ${errors.discountPrice ? 'field-error' : ''}`} type="number" min="0" step="0.01" {...bind('discountPrice')} />
              </FormField>
            )}
            <FormField label="Vence el" hint="Opcional: se muestra hasta el final de ese día">
              <input className="field" type="date" min={toDateInput(new Date())} {...bind('badgeExpiresAt')} />
            </FormField>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-800 bg-stone-900/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge badge={preview.badge} percent={preview.percent} size="sm" />
            <span className="text-sm text-stone-400">Precio final</span>
            <span className="font-semibold">{formatPrice(preview.final)}</span>
            {preview.hasDiscount && <span className="text-xs text-stone-500 line-through">{formatPrice(preview.price)}</span>}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-[#f2c14e]" checked={form.isAvailable} onChange={(event) => set('isAvailable', event.target.checked)} />
            Disponible
          </label>
        </div>

        <div>
          <span className="label">Imágenes (URLs)</span>
          <div className="space-y-2">
            {form.images.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                {isValidUrl(url.trim()) ? (
                  <img src={url.trim()} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-stone-600"><ImageOff size={16} /></span>
                )}
                <input className="field" placeholder="https://…" value={url} onChange={(event) => setImage(index, event.target.value)} />
                <button type="button" className="icon-btn shrink-0" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Subir imagen"><ArrowUp size={14} /></button>
                <button type="button" className="icon-btn shrink-0" onClick={() => moveImage(index, 1)} disabled={index === form.images.length - 1} aria-label="Bajar imagen"><ArrowDown size={14} /></button>
                <button type="button" className="icon-btn shrink-0 hover:text-red-400" onClick={() => removeImage(index)} aria-label="Quitar imagen"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          {errors.images && <span className="mt-1 block text-xs text-red-400">{errors.images}</span>}
          <button type="button" className="btn-ghost mt-2 py-2 text-xs" onClick={() => set('images', [...form.images, ''])}>
            <Plus size={14} /> Agregar imagen
          </button>
        </div>
      </form>
    </Modal>
  );
}
