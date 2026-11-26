import { useEffect, useMemo, useState } from 'react';
import { ChefHat, Search } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import Badge from '../Badge';
import Spinner from '../Spinner';
import TagChips, { TAG_ICONS } from '../TagChips';
import { productsApi } from '../../api';
import useDebounced from '../../hooks/useDebounced';
import { TAG_OPTIONS, formatPrice, getPricing } from '../../utils/format';
import { thumbUrl } from '../../utils/photo';

const SORTS = [
  { value: 'menu', label: 'Orden del menú' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
];

function Toggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 cursor-pointer rounded-md border px-3 py-1.5 text-[13px] font-medium transition ${
        active ? 'border-accent bg-accent text-stone-900' : 'border-stone-700 text-stone-300 hover:bg-stone-800'
      }`}
    >
      {children}
    </button>
  );
}

export default function SearchSheet({ open, onClose, categories, onSelect }) {
  const [term, setTerm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [tags, setTags] = useState([]);
  const [sort, setSort] = useState('menu');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const debouncedTerm = useDebounced(term, 300);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setStatus('loading');
    productsApi
      .list({ search: debouncedTerm.trim(), categoryId })
      .then((products) => {
        if (!active) return;
        setResults(products);
        setStatus('ready');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [open, debouncedTerm, categoryId]);

  const filtered = useMemo(() => {
    const list = results
      .map((product) => ({ product, pricing: getPricing(product) }))
      .filter(({ product }) => !onlyAvailable || product.isAvailable)
      .filter(({ pricing }) => !onlyPromo || pricing.badge !== 'ninguno')
      .filter(({ pricing }) => !maxPrice || pricing.final <= Number(maxPrice))
      .filter(({ product }) => tags.every((tag) => product.tags?.includes(tag)));
    if (sort === 'price-asc') list.sort((a, b) => a.pricing.final - b.pricing.final);
    if (sort === 'price-desc') list.sort((a, b) => b.pricing.final - a.pricing.final);
    return list;
  }, [results, onlyAvailable, onlyPromo, maxPrice, tags, sort]);

  const toggleTag = (tag) => setTags((current) => (current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]));

  return (
    <BottomSheet open={open} onClose={onClose} title="Buscar" draggable={false} tall>
      <div className="sticky top-0 z-10 -mx-5 bg-panel px-5 pb-3">
        <div className="relative">
          <Search size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-stone-500" />
          <input
            autoFocus
            className="field py-3 pl-10"
            placeholder="Buscá un plato o ingrediente"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          <Toggle active={categoryId === ''} onClick={() => setCategoryId('')}>Todas</Toggle>
          {categories.map((category) => (
            <Toggle key={category.id} active={categoryId === category.id} onClick={() => setCategoryId(category.id)}>
              {category.name}
            </Toggle>
          ))}
        </div>
        <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto">
          <Toggle active={onlyAvailable} onClick={() => setOnlyAvailable(!onlyAvailable)}>Solo disponibles</Toggle>
          <Toggle active={onlyPromo} onClick={() => setOnlyPromo(!onlyPromo)}>Con chip</Toggle>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Precio máx."
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="w-28 shrink-0 rounded-md border border-stone-700 bg-transparent px-3 py-1.5 text-xs text-stone-200 outline-none placeholder:text-stone-500 focus:border-accent"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="shrink-0 cursor-pointer rounded-md border border-stone-700 bg-panel px-3 py-1.5 text-xs text-stone-200 outline-none"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {TAG_OPTIONS.map(({ value, label }) => {
            const Icon = TAG_ICONS[value];
            return (
              <Toggle key={value} active={tags.includes(value)} onClick={() => toggleTag(value)}>
                <span className="inline-flex items-center gap-1.5"><Icon size={13} /> {label}</span>
              </Toggle>
            );
          })}
        </div>
      </div>

      {status === 'loading' && results.length === 0 && (
        <div className="flex justify-center py-10"><Spinner /></div>
      )}
      {status === 'error' && <p className="py-10 text-center text-sm text-stone-400">No pudimos buscar. Probá de nuevo.</p>}
      {status !== 'error' && status !== 'loading' && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-400">No encontramos productos con esos filtros.</p>
      )}

      <ul className="space-y-2 pt-1">
        {filtered.map(({ product, pricing }) => (
          <li key={product.id}>
            <button
              type="button"
              onClick={() => onSelect(product)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition hover:bg-stone-800/70"
            >
              {product.images?.[0] ? (
                <img src={thumbUrl(product.images[0].url, 64)} alt="" className={`size-16 shrink-0 rounded-md object-cover ${product.isAvailable ? '' : 'grayscale'}`} />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-stone-800 text-stone-600"><ChefHat /></span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-accent">{product.category?.name}</span>
                <span className="block truncate font-serif text-lg leading-tight">{product.name}</span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatPrice(pricing.final)}</span>
                  {pricing.hasDiscount && <span className="text-xs text-stone-500 line-through">{formatPrice(pricing.price)}</span>}
                  {!product.isAvailable && <span className="text-xs text-stone-500">No disponible</span>}
                </span>
                <TagChips tags={product.tags} size="sm" className="mt-1.5" />
              </span>
              <Badge badge={pricing.badge} percent={pricing.percent} size="sm" />
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
