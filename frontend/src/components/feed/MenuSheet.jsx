import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid, Plus } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import { pad } from '../../utils/format';

export default function MenuSheet({ open, onClose, columns, activeIndex, onSelect, adminView, onNewProduct }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Categorías">
      <h2 className="font-serif text-3xl">Categorías</h2>
      <ul className="mt-5 divide-y divide-stone-800">
        {columns.map((column, index) => (
          <li key={column.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={`group flex w-full cursor-pointer items-center justify-between py-4 text-left transition ${index === activeIndex ? 'text-accent' : 'text-stone-100 hover:text-accent'}`}
            >
              <span className="font-serif text-2xl">{column.name}</span>
              <span className="flex items-center gap-3 font-mono text-xs text-stone-500">
                {pad(column.items.length)}
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {adminView && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary" onClick={onNewProduct}>
            <Plus size={16} /> Nuevo producto
          </button>
          <Link to="/admin" className="btn-ghost">
            <LayoutGrid size={16} /> Panel
          </Link>
        </div>
      )}
    </BottomSheet>
  );
}
