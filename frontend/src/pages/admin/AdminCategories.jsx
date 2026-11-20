import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChefHat, Pencil, Plus, Trash2 } from 'lucide-react';
import { categoriesApi, productsApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import { ConfirmModal } from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { Alert } from '../../components/FormField';
import { thumbUrl } from '../../utils/photo';

function PhotoStack({ photos }) {
  if (photos.length === 0) {
    return (
      <span className="flex w-12 shrink-0 sm:w-28">
        <span className="flex size-12 items-center justify-center rounded-md bg-stone-800 text-stone-600">
          <ChefHat size={18} />
        </span>
      </span>
    );
  }
  return (
    <span className="flex w-12 shrink-0 sm:w-28">
      {photos.map((photo, index) => (
        <img
          key={photo}
          src={thumbUrl(photo, 48)}
          alt=""
          className={`size-12 rounded-md object-cover ring-2 ring-panel ${index > 0 ? '-ml-4 hidden sm:block' : ''}`}
        />
      ))}
    </span>
  );
}

function NameEditor({ initial, busy, onSave, onCancel, submitLabel }) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Ingresá un nombre');
      return;
    }
    const message = await onSave(name.trim());
    if (message) setError(message);
  };

  return (
    <form onSubmit={submit} className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <input className="field max-w-sm flex-1" autoFocus value={name} onChange={(event) => setName(event.target.value)} aria-label="Nombre de la categoría" />
        <button className="btn-primary py-2" disabled={busy}>{submitLabel}</button>
        <button type="button" className="btn-ghost py-2" onClick={onCancel}>Cancelar</button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </form>
  );
}

function CategoryRow({ category, position, total, products, busy, editing, onEdit, onRename, onMove, onDelete }) {
  const photos = products.map((product) => product.images?.[0]?.url).filter(Boolean).slice(0, 3);
  const names = products.map((product) => product.name).join(', ');

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:gap-4">
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col">
          <button type="button" className="cursor-pointer text-stone-500 hover:text-stone-100 disabled:cursor-default disabled:opacity-25" disabled={busy || position === 0} onClick={() => onMove(position, -1)} aria-label={`Subir ${category.name}`}>
            <ArrowUp size={16} />
          </button>
          <button type="button" className="cursor-pointer text-stone-500 hover:text-stone-100 disabled:cursor-default disabled:opacity-25" disabled={busy || position === total - 1} onClick={() => onMove(position, 1)} aria-label={`Bajar ${category.name}`}>
            <ArrowDown size={16} />
          </button>
        </div>
        <span className="w-5 font-mono text-xs text-stone-500">{String(position + 1).padStart(2, '0')}</span>
      </div>

      <PhotoStack photos={photos} />

      {editing ? (
        <NameEditor initial={category.name} busy={busy} submitLabel="Guardar" onSave={(name) => onRename(category, name)} onCancel={() => onEdit(null)} />
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-lg leading-tight text-stone-50">{category.name}</p>
            <p className="mt-0.5 truncate text-sm text-stone-500">{names || 'Sin platos todavía'}</p>
          </div>
          <span className="hidden shrink-0 text-sm text-stone-400 sm:block">
            {products.length} {products.length === 1 ? 'plato' : 'platos'}
          </span>
          <div className="flex shrink-0 gap-1">
            <button type="button" className="icon-btn" onClick={() => onEdit(category.id)} aria-label={`Renombrar ${category.name}`}>
              <Pencil size={15} />
            </button>
            <button type="button" className="icon-btn hover:text-red-400" onClick={() => onDelete(category)} aria-label={`Eliminar ${category.name}`}>
              <Trash2 size={15} />
            </button>
          </div>
        </>
      )}
    </li>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [categoryList, productList] = await Promise.all([categoriesApi.list(), productsApi.list()]);
      setCategories(categoryList);
      setProducts(productList);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action) => {
    setBusy(true);
    try {
      await action();
      await load();
      return '';
    } catch (actionError) {
      return actionError.message;
    } finally {
      setBusy(false);
    }
  };

  const rename = async (category, name) => {
    const message = await run(() => categoriesApi.update(category.id, { name }));
    if (!message) setEditingId(null);
    return message;
  };

  const create = async (name) => {
    const lastOrder = categories.reduce((max, category) => Math.max(max, category.order), 0);
    const message = await run(() => categoriesApi.create({ name, order: lastOrder + 1 }));
    if (!message) setCreating(false);
    return message;
  };

  const move = async (position, direction) => {
    const reordered = [...categories];
    const [moved] = reordered.splice(position, 1);
    reordered.splice(position + direction, 0, moved);
    setCategories(reordered);
    setError('');
    const message = await run(() =>
      Promise.all(
        reordered
          .map((category, index) => ({ category, order: index + 1 }))
          .filter(({ category, order }) => category.order !== order)
          .map(({ category, order }) => categoriesApi.update(category.id, { order }))
      )
    );
    if (message) setError(message);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await categoriesApi.remove(toDelete.id);
      setToDelete(null);
      load();
    } catch (removeError) {
      setDeleteError(removeError.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Aparecen en el menú en este orden."
        action={
          <button type="button" className="btn-primary" onClick={() => setCreating(true)} disabled={creating}>
            <Plus size={16} /> Nueva categoría
          </button>
        }
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {status === 'loading' && <div className="flex justify-center py-16"><Spinner /></div>}
      {status === 'error' && <Alert>No se pudieron cargar las categorías.</Alert>}

      {status === 'ready' && (
        <ul className="card divide-y divide-stone-800 overflow-hidden">
          {creating && (
            <li className="flex items-center gap-4 bg-stone-900/60 px-4 py-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-stone-800 text-accent">
                <Plus size={18} />
              </span>
              <NameEditor initial="" busy={busy} submitLabel="Agregar" onSave={create} onCancel={() => setCreating(false)} />
            </li>
          )}
          {categories.length === 0 && !creating && (
            <li className="px-6 py-12 text-center text-sm text-stone-400">Todavía no hay categorías.</li>
          )}
          {categories.map((category, index) => (
            <CategoryRow
              key={category.id}
              category={category}
              position={index}
              total={categories.length}
              products={products.filter((product) => product.categoryId === category.id)}
              busy={busy}
              editing={editingId === category.id}
              onEdit={setEditingId}
              onRename={rename}
              onMove={move}
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
