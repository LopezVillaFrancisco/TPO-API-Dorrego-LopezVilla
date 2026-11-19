import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Eye, FolderTree, Inbox, LogOut, Store, UserRound, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { businessApi, messagesApi } from '../../api';
import BusinessLogo from '../../components/BusinessLogo';

const LINKS = [
  { to: 'productos', label: 'Productos', icon: UtensilsCrossed },
  { to: 'categorias', label: 'Categorías', icon: FolderTree },
  { to: 'mensajes', label: 'Mensajes', icon: Inbox },
  { to: 'comercio', label: 'Comercio', icon: Store },
  { to: 'perfil', label: 'Perfil', icon: UserRound },
];

function PendingCount({ value }) {
  if (value <= 0) return null;
  return <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{value}</span>;
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [pending, setPending] = useState(0);

  const refreshPending = () =>
    messagesApi
      .list('pendiente')
      .then((messages) => setPending(messages.length))
      .catch(() => null);

  useEffect(() => {
    businessApi.get().then(setBusiness).catch(() => null);
    refreshPending();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const brand = (
    <div className="flex min-w-0 items-center gap-3">
      <BusinessLogo business={business} />
      <div className="min-w-0">
        <p className="text-xs text-stone-500">Panel</p>
        <p className="truncate font-serif text-lg leading-tight">{business?.name || 'Mi comercio'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-stone-800 bg-panel/40 px-5 py-6 lg:flex">
        {brand}
        <nav className="mt-10 flex flex-col gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-accent text-stone-900' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
                }`
              }
            >
              <Icon size={17} />
              {label}
              {to === 'mensajes' && <PendingCount value={pending} />}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-stone-800 pt-5">
          <p className="truncate px-1 text-sm text-stone-400">Hola, <span className="text-stone-200">{user?.firstName}</span></p>
          <Link to="/" className="btn-ghost w-full">
            <Eye size={16} /> Ver menú
          </Link>
          <button type="button" onClick={handleLogout} className="btn-ghost w-full border-transparent text-stone-400">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-stone-800 bg-ink/90 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            {brand}
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-stone-400 sm:inline">Hola, {user?.firstName}</span>
              <Link to="/" className="btn-ghost px-3 py-2">
                <Eye size={16} /> <span className="hidden sm:inline">Ver menú</span>
              </Link>
              <button type="button" onClick={handleLogout} className="icon-btn" aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <nav className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-accent text-stone-900' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
                  }`
                }
              >
                <Icon size={16} />
                {label}
                {to === 'mensajes' && <PendingCount value={pending} />}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-10 lg:py-10">
          <Outlet context={{ business, setBusiness, refreshPending }} />
        </main>
      </div>
    </div>
  );
}
