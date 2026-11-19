import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Lock, Menu, Search } from 'lucide-react';
import BusinessLogo from '../BusinessLogo';

function AccountControls({ isAuthenticated, adminView, onToggleAdmin }) {
  if (!isAuthenticated) {
    return (
      <Link to="/login" className="icon-btn size-8 border-transparent text-stone-500 lg:size-9" aria-label="Ingresar al panel">
        <Lock size={14} />
      </Link>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onToggleAdmin}
        className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition lg:py-2 ${
          adminView ? 'border-accent/60 bg-accent/10 text-accent' : 'border-stone-700 text-stone-300 hover:bg-stone-800'
        }`}
      >
        <span className={`size-2 rounded-full ${adminView ? 'bg-accent' : 'bg-stone-500'}`} />
        {adminView ? 'Vista Admin' : 'Vista Visitante'}
      </button>
      <Link to="/admin" className="icon-btn size-8 lg:size-9" aria-label="Ir al panel">
        <LayoutGrid size={15} />
      </Link>
    </div>
  );
}

export default function FeedHeader({
  business,
  columns,
  activeIndex,
  onSelectCategory,
  onOpenInfo,
  onOpenMenu,
  onOpenSearch,
  isAuthenticated,
  adminView,
  onToggleAdmin,
}) {
  const barRef = useRef(null);
  const chipRefs = useRef([]);

  useEffect(() => {
    const bar = barRef.current;
    const chip = chipRefs.current[activeIndex];
    if (!bar || !chip) return;
    bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
  }, [activeIndex, columns.length]);

  const brand = (
    <button type="button" onClick={onOpenInfo} className="flex min-w-0 cursor-pointer items-center gap-3 text-left" aria-label="Ver información del comercio">
      <BusinessLogo business={business} />
      <span className="min-w-0">
        <span className="block truncate font-serif text-xl leading-tight text-stone-50">{business?.name || ' '}</span>
      </span>
    </button>
  );

  return (
    <header className="absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)]">
      <div className="hidden h-[76px] items-center gap-6 border-b border-white/5 bg-ink px-8 lg:flex">
        <div className="w-64 shrink-0 xl:w-72">{brand}</div>
        <nav className="no-scrollbar flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto" aria-label="Categorías">
          {columns.map((column, index) => (
            <button
              key={column.id}
              type="button"
              onClick={() => onSelectCategory(index)}
              className={`relative shrink-0 cursor-pointer px-3.5 py-2 text-[15px] font-medium transition ${
                index === activeIndex ? 'text-accent' : 'text-stone-400 hover:text-stone-100'
              }`}
            >
              {column.name}
              <span className={`absolute inset-x-3.5 -bottom-0.5 h-0.5 bg-accent transition-opacity ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </nav>
        <div className="flex w-64 shrink-0 items-center justify-end gap-2 xl:w-72">
          <button type="button" onClick={onOpenSearch} className="icon-btn size-9" aria-label="Buscar productos">
            <Search size={16} />
          </button>
          <button type="button" onClick={onOpenMenu} className="icon-btn size-9" aria-label="Ver categorías">
            <Menu size={16} />
          </button>
          <AccountControls isAuthenticated={isAuthenticated} adminView={adminView} onToggleAdmin={onToggleAdmin} />
        </div>
      </div>

      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-ink/95 px-4 py-3">
          {brand}
          <AccountControls isAuthenticated={isAuthenticated} adminView={adminView} onToggleAdmin={onToggleAdmin} />
        </div>

        <div className="flex items-center gap-2 px-3 pt-3">
          <button type="button" onClick={onOpenMenu} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/15 bg-ink/80 text-stone-100" aria-label="Ver categorías">
            <Menu size={18} />
          </button>
          <div ref={barRef} className="no-scrollbar flex h-10 flex-1 items-stretch overflow-x-auto rounded-md border border-white/15 bg-ink/80 px-1">
            {columns.map((column, index) => (
              <button
                key={column.id}
                ref={(element) => {
                  chipRefs.current[index] = element;
                }}
                type="button"
                onClick={() => onSelectCategory(index)}
                className={`relative shrink-0 cursor-pointer px-3 text-sm font-medium transition ${
                  index === activeIndex ? 'text-accent' : 'text-stone-300 hover:text-stone-100'
                }`}
              >
                {column.name}
                <span className={`absolute inset-x-3 bottom-1.5 h-0.5 bg-accent transition-opacity ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
          <button type="button" onClick={onOpenSearch} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/15 bg-ink/80 text-stone-100" aria-label="Buscar productos">
            <Search size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
