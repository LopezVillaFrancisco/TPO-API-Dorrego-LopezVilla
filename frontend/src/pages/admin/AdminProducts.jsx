import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChefHat, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { categoriesApi, productsApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import ProductEditor from '../../components/ProductEditor';
import { ConfirmModal } from '../../components/Modal';
import Badge from '../../components/Badge';
import TagChips from '../../components/TagChips';
import Switch from '../../components/Switch';
import Spinner from '../../components/Spinner';
import { Alert } from '../../components/FormField';
import { formatPrice, getPricing } from '../../utils/format';
import { photoUrl } from '../../utils/photo';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [availability, setAvailability] = useState(searchParams.get('estado') === 'agotados' ? 'unavailable' : 'all');
  const [editor, setEditor] = useState({ open: false, product: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [productList, categoryList] = await Promise.all([productsApi.list(), categoriesApi.list()]);
      setProducts(productList);
      setCategories(categoryList);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const editId = searchParams.get('edit');
  useEffect(() => {
    if (status !== 'ready' || !editId) return;
    const product = products.find((item) => item.id === Number(editId));
    if (product) setEditor({ open: true, product });
    setSearchParams((params) => {
      params.delete('edit');
      return params;
    }, { replace: true });
  }, [status, editId, products, setSearchParams]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryId && product.categoryId !== Number(categoryId)) return false;
      if (availability === 'available' && !product.isAvailable) return false;
      if (availability === 'unavailable' && product.isAvailable) return false;
      if (!term) return true;
      return `${product.name} ${product.description || ''}`.toLowerCase().includes(term);
    });
  }, [products, search, categoryId, availability]);

  const toggleAvailable = async (product, isAvailable) => {
    setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, isAvailable } : item)));
    try {
      await productsApi.update(product.id, { isAvailable });
    } catch (toggleError) {
      setError(toggleError.message);
      setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await productsApi.remove(toDelete.id);
      setProducts((current) => current.filter((item) => item.id !== toDelete.id));
      setToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = () => {
    setEditor({ open: false, product: null });
    load();
  };

  return (
    <>
      <PageHeader
        title="Productos"
        description={`${products.length} productos en el menú`}
        action={
          <button type="button" className="btn-primary" onClick={() => setEditor({ open: true, product: null })} disabled={categories.length === 0}>
            <Plus size={16} /> Nuevo producto
          </button>
        }
      />

      {status === 'ready' && categories.length === 0 && (
        <div className="mb-4"><Alert>Primero creá al menos una categoría para poder cargar productos.</Alert></div>
      )}
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-stone-500" />
          <input className="field pl-9" placeholder="Buscar por nombre o descripción" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select className="field sm:w-48" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select className="field sm:w-44" value={availability} onChange={(event) => setAvailability(event.target.value)}>
          <option value="all">Todos</option>
          <option value="available">Disponibles</option>
          <option value="unavailable">No disponibles</option>
        </select>
      </div>

      {status === 'loading' && <div className="flex justify-center py-16"><Spinner /></div>}

      {status === 'ready' && filtered.length === 0 && (
        <p className="card px-6 py-12 text-center text-sm text-stone-400">No hay productos que coincidan.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((product) => {
          const pricing = getPricing(product);
          return (
            <article key={product.id} className="card flex flex-col overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-800">
                {product.images?.[0] ? (
                  <img src={photoUrl(product.images[0].url, 400, 250)} alt={product.name} className={`absolute inset-0 h-full w-full object-cover ${product.isAvailable ? '' : 'grayscale'}`} />
                ) : (
                  <span className="flex h-full items-center justify-center text-stone-600"><ChefHat size={40} /></span>
                )}
                <div className="absolute top-2 right-2"><Badge badge={pricing.badge} percent={pricing.percent} size="sm" /></div>
                {product.images?.length > 1 && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px]">{product.images.length} fotos</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs text-accent">{product.category?.name} · orden {product.order}</p>
                <h3 className="mt-1 font-serif text-xl leading-tight">{product.name}</h3>
                {product.description && <p className="mt-1 line-clamp-2 text-sm text-stone-400">{product.description}</p>}
                <TagChips tags={product.tags} size="sm" className="mt-2" />
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-semibold">{formatPrice(pricing.final)}</span>
                  {pricing.hasDiscount && <span className="text-sm text-stone-500 line-through">{formatPrice(pricing.price)}</span>}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-stone-800 pt-3">
                  <label className="flex items-center gap-2 text-sm text-stone-300">
                    <Switch checked={product.isAvailable} onChange={(value) => toggleAvailable(product, value)} label="Disponible" />
                    {product.isAvailable ? 'Disponible' : 'Agotado'}
                  </label>
                  <div className="flex gap-1.5">
                    <button type="button" className="icon-btn" onClick={() => setEditor({ open: true, product })} aria-label={`Editar ${product.name}`}>
                      <Pencil size={15} />
                    </button>
                    <button type="button" className="icon-btn hover:text-red-400" onClick={() => setToDelete(product)} aria-label={`Eliminar ${product.name}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <ProductEditor
        open={editor.open}
        product={editor.product}
        categories={categories}
        defaultCategoryId={categoryId ? Number(categoryId) : undefined}
        onClose={() => setEditor({ open: false, product: null })}
        onSaved={handleSaved}
      />
      <ConfirmModal
        open={Boolean(toDelete)}
        title="Eliminar producto"
        message={`¿Seguro que querés eliminar "${toDelete?.name}"? Se borran también sus imágenes y no se puede deshacer.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        busy={deleting}
      />
    </>
  );
}
