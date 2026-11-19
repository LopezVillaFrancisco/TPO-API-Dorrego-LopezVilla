import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsLeftRight, ChevronUp, Keyboard, MessageCircle, MousePointer2, Plus, RotateCw } from 'lucide-react';
import { businessApi, categoriesApi, productsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import FeedStage from '../components/feed/FeedStage';
import ProductSlide from '../components/feed/ProductSlide';
import FeedHeader from '../components/feed/FeedHeader';
import InfoSheet from '../components/feed/InfoSheet';
import ContactSheet from '../components/feed/ContactSheet';
import SearchSheet from '../components/feed/SearchSheet';
import MenuSheet from '../components/feed/MenuSheet';
import ProductEditor from '../components/ProductEditor';
import Spinner from '../components/Spinner';

const STORAGE_KEY = 'feed-state';

const readSavedState = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [saved] = useState(readSavedState);
  const [data, setData] = useState({ categories: [], products: [], business: null });
  const [status, setStatus] = useState('loading');
  const [adminView, setAdminView] = useState(false);
  const [catId, setCatId] = useState(saved.catId ?? null);
  const [positions, setPositions] = useState(saved.positions || {});
  const [sheet, setSheet] = useState(null);
  const [editor, setEditor] = useState({ open: false, product: null });
  const [touched, setTouched] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const [categories, products, business] = await Promise.all([
        categoriesApi.list(),
        productsApi.list(),
        businessApi.get().catch(() => null),
      ]);
      setData({ categories, products, business });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isAuthenticated) setAdminView(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (data.business?.name) document.title = `${data.business.name} · Menú digital`;
  }, [data.business]);

  const columns = useMemo(
    () =>
      data.categories
        .map((category) => ({ ...category, items: data.products.filter((product) => product.categoryId === category.id) }))
        .filter((column) => adminView || column.items.length > 0),
    [data, adminView]
  );

  const catIndex = Math.max(0, columns.findIndex((column) => column.id === catId));
  const activeColumn = columns[catIndex];
  const activePosition = activeColumn ? Math.min(positions[activeColumn.id] || 0, Math.max(activeColumn.items.length - 1, 0)) : 0;
  const activeProduct = activeColumn?.items[activePosition] || null;

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ catId: activeColumn?.id ?? null, positions }));
    } catch {
      return;
    }
  }, [activeColumn, positions]);

  const changeCategory = (index) => {
    if (!columns[index]) return;
    setCatId(columns[index].id);
    setTouched(true);
  };

  const changeProduct = (columnId, index) => {
    setPositions((current) => ({ ...current, [columnId]: index }));
    setTouched(true);
  };

  const jumpTo = (product) => {
    const column = columns.find((item) => item.id === product.categoryId);
    const index = column ? column.items.findIndex((item) => item.id === product.id) : 0;
    setCatId(product.categoryId);
    setPositions((current) => ({ ...current, [product.categoryId]: Math.max(index, 0) }));
    setSheet(null);
    setTouched(true);
  };

  const crossTo = (index, position) => {
    const column = columns[index];
    if (!column) return;
    setCatId(column.id);
    setPositions((current) => ({ ...current, [column.id]: position }));
    setTouched(true);
  };

  const toggleAvailable = useCallback(async (product) => {
    try {
      const updated = await productsApi.update(product.id, { isAvailable: !product.isAvailable });
      setData((current) => ({
        ...current,
        products: current.products.map((item) => (item.id === updated.id ? updated : item)),
      }));
      setToast(updated.isAvailable ? 'Producto disponible' : 'Producto marcado como agotado');
    } catch (error) {
      setToast(error.message);
    }
  }, []);

  const stepRef = useRef(null);
  const goPrev = useCallback(() => stepRef.current?.('y', -1), []);
  const goNext = useCallback(() => stepRef.current?.('y', 1), []);
  const openEditor = useCallback((product) => setEditor({ open: true, product }), []);
  const openContact = useCallback(() => setSheet('contact'), []);

  const handleSaved = async (product) => {
    setEditor({ open: false, product: null });
    setToast('Producto guardado');
    const products = await productsApi.list().catch(() => null);
    if (!products) return;
    setData((current) => ({ ...current, products }));
    const siblings = products.filter((item) => item.categoryId === product.categoryId);
    setCatId(product.categoryId);
    setPositions((current) => ({ ...current, [product.categoryId]: Math.max(siblings.findIndex((item) => item.id === product.id), 0) }));
  };

  const openNewProduct = () => {
    setSheet(null);
    setEditor({ open: true, product: null });
  };

  const renderSlide = useCallback(
    (product, meta) => (
      <ProductSlide
        product={product}
        index={meta.index}
        total={meta.total}
        categoryName={meta.column.name}
        adminView={adminView}
        onEdit={openEditor}
        onToggleAvailable={toggleAvailable}
        onContact={openContact}
        onPrev={goPrev}
        onNext={goNext}
      />
    ),
    [adminView, openEditor, toggleAvailable, openContact, goPrev, goNext]
  );

  const renderEmpty = useCallback((column) => (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-sm font-medium text-accent">{column.name}</p>
      <p className="font-serif text-2xl text-stone-300">Esta categoría todavía no tiene productos</p>
      <button type="button" className="btn-primary" onClick={() => setEditor({ open: true, product: null, categoryId: column.id })}>
        <Plus size={16} /> Agregar producto
      </button>
    </div>
  ), []);

  return (
    <div className="fixed inset-0 flex justify-center bg-black">
      <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-ink md:max-w-none">
        {status === 'loading' && (
          <div className="flex h-full items-center justify-center"><Spinner /></div>
        )}

        {status === 'error' && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-serif text-2xl">No pudimos cargar el menú</p>
            <p className="text-sm text-stone-400">Revisá tu conexión o que el servidor esté funcionando.</p>
            <button type="button" className="btn-ghost" onClick={() => { setStatus('loading'); load(); }}>
              <RotateCw size={16} /> Reintentar
            </button>
          </div>
        )}

        {status === 'ready' && columns.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="font-serif text-2xl">Todavía no hay productos en el menú</p>
          </div>
        )}

        {status === 'ready' && columns.length > 0 && (
          <div className="absolute inset-0 lg:top-[76px]">
            <FeedStage
              columns={columns}
              catIndex={catIndex}
              positions={positions}
              onCategoryChange={changeCategory}
              onProductChange={changeProduct}
              onCross={crossTo}
              stepRef={stepRef}
              renderSlide={renderSlide}
              renderEmpty={renderEmpty}
              disabled={Boolean(sheet) || editor.open}
            />
          </div>
        )}

        <FeedHeader
          business={data.business}
          columns={columns}
          activeIndex={catIndex}
          onSelectCategory={changeCategory}
          onOpenInfo={() => setSheet('info')}
          onOpenMenu={() => setSheet('menu')}
          onOpenSearch={() => setSheet('search')}
          isAuthenticated={isAuthenticated}
          adminView={adminView}
          onToggleAdmin={() => setAdminView(!adminView)}
        />

        <AnimatePresence>
          {status === 'ready' && columns.length > 0 && !touched && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-[44%] z-10 flex flex-col items-center gap-2 text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.95),0_0_2px_rgb(0_0_0/0.8)] lg:top-24 lg:right-auto lg:w-[57.4%]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="flex flex-col items-center lg:hidden">
                <ChevronUp size={22} />
                <span className="text-sm font-medium">Deslizá para ver más platos</span>
              </motion.div>
              <span className="flex items-center gap-1.5 text-xs text-white/70 lg:hidden">
                <ChevronsLeftRight size={14} /> A los costados cambiás de categoría
              </span>
              <div className="hidden items-center gap-5 rounded-md bg-ink/85 px-4 py-2.5 text-sm text-white/85 lg:flex">
                <span className="flex items-center gap-2"><MousePointer2 size={14} /> Ruedita o ↑ ↓ para cambiar de plato</span>
                <span className="h-4 w-px bg-white/20" />
                <span className="flex items-center gap-2"><Keyboard size={14} /> ← → para cambiar de categoría</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'ready' && (
          <button
            type="button"
            onClick={() => setSheet('contact')}
            className="absolute top-1/2 right-4 z-10 flex size-13 -translate-y-1/2 cursor-pointer lg:hidden items-center justify-center rounded-full bg-accent text-stone-900 shadow-xl shadow-black/40 transition hover:scale-105"
            aria-label="Enviar una consulta"
          >
            <MessageCircle size={22} />
          </button>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div
              className="absolute inset-x-0 bottom-6 z-30 flex justify-center px-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
            >
              <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-900 shadow-lg">{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <InfoSheet open={sheet === 'info'} onClose={() => setSheet(null)} business={data.business} onContact={() => setSheet('contact')} />
      <ContactSheet open={sheet === 'contact'} onClose={() => setSheet(null)} product={activeProduct} />
      <SearchSheet open={sheet === 'search'} onClose={() => setSheet(null)} categories={data.categories} onSelect={jumpTo} />
      <MenuSheet
        open={sheet === 'menu'}
        onClose={() => setSheet(null)}
        columns={columns}
        activeIndex={catIndex}
        onSelect={(index) => {
          changeCategory(index);
          setSheet(null);
        }}
        adminView={adminView}
        onNewProduct={openNewProduct}
      />
      <ProductEditor
        open={editor.open}
        product={editor.product}
        categories={data.categories}
        defaultCategoryId={editor.categoryId ?? activeColumn?.id}
        onClose={() => setEditor({ open: false, product: null })}
        onSaved={handleSaved}
      />
    </div>
  );
}
