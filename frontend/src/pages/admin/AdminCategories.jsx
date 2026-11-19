import { useCallback, useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { categoriesApi, productsApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import { ConfirmModal } from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { Alert } from '../../components/FormField';

function CategoryRow({ category, productCount, onSaved, onDelete }) {
  const [draft, setDraft] = useState({ name: category.name, order: String(category.order) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dirty = draft.name !== category.name || draft.order !== String(category.order);

  const save = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await categoriesApi.update(category.id, { name: draft.name.trim(), order: Number(draft.order) || 0 });
      onSaved(updated);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="px-4 py-3">
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <input className="field w-20 text-center" type="number" aria-label="Orden" value={draft.order} onChange={(event) => setDraft({ ...draft, order: event.target.value })} />
        <input className="field min-w-40 flex-1" aria-label="Nombre" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <span className="w-24 text-sm text-stone-400">{productCount} productos</span>
        <button type="submit" className="icon-btn" disabled={!dirty || saving} aria-label="Guardar cambios">
          <Check size={15} />
        </button>
        <button type="button" className="icon-btn hover:text-red-400" onClick={() => onDelete(category)} aria-label={`Eliminar ${category.name}`}>
          <Trash2 size={15} />
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </li>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState({ name: '', order: '' });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [categoryList, products] = await Promise.all([categoriesApi.list(), productsApi.list()]);
      setCategories(categoryList);
      setCounts(products.reduce((acc, product) => ({ ...acc, [product.categoryId]: (acc[product.categoryId] || 0) + 1 }), {}));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Ingresá un nombre');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      await categoriesApi.create({ name: form.name.trim(), order: form.order === '' ? categories.length + 1 : Number(form.order) });
      setForm({ name: '', order: '' });
      load();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await categoriesApi.remove(toDelete.id);
      setToDelete(null);
      load();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Categorías" description="El orden define cómo se recorren con el swipe horizontal." />

      <form onSubmit={create} className="card mb-5 p-4">
        <div className="flex flex-wrap gap-2">
          <input className="field w-24" type="number" placeholder="Orden" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} />
          <input className="field min-w-48 flex-1" placeholder="Nombre de la nueva categoría" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <button className="btn-primary" disabled={creating}>
            <Plus size={16} /> Crear
          </button>
        </div>
        {formError && <p className="mt-2 text-xs text-red-400">{formError}</p>}
      </form>

      {status === 'loading' && <div className="flex justify-center py-16"><Spinner /></div>}
      {status === 'error' && <Alert>No se pudieron cargar las categorías.</Alert>}
      {status === 'ready' && categories.length === 0 && (
        <p className="card px-6 py-12 text-center text-sm text-stone-400">Todavía no hay categorías.</p>
      )}
      {categories.length > 0 && (
        <ul className="card divide-y divide-stone-800">
          {categories.map((category) => (
            <CategoryRow
              key={`${category.id}-${category.name}-${category.order}`}
              category={category}
              productCount={counts[category.id] || 0}
              onSaved={load}
              onDelete={(item) => {
                setDeleteError('');
                setToDelete(item);
              }}
            />
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Eliminar categoría"
        message={`¿Seguro que querés eliminar "${toDelete?.name}"? Solo se puede si no tiene productos.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        busy={deleting}
        error={deleteError}
      />
    </>
  );
}
