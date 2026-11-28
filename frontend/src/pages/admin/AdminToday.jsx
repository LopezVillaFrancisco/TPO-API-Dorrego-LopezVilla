import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ChefHat, ChevronRight, CircleCheck } from 'lucide-react';
import { messagesApi, productsApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { Alert } from '../../components/FormField';
import { formatDate, formatDay } from '../../utils/format';
import { thumbUrl } from '../../utils/photo';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ROWS = 5;

const daysUntil = (date) => Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

const expiresLabel = (date) => {
  const days = daysUntil(date);
  if (days <= 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días · ${formatDay(date)}`;
};

// Arma las listas de pendientes a partir de productos y consultas
const buildSections = (products, messages, canEdit) => {
  const now = Date.now();
  const productLink = (product) => (canEdit ? `/admin/productos?edit=${product.id}` : '/admin/productos?estado=agotados');
  const thumb = (product) => product.images?.[0]?.url || null;

  const unanswered = messages.filter((message) => message.status !== 'respondido');
  const soldOut = products.filter((product) => !product.isAvailable);
  const expiring = products
    .filter((product) => {
      if (product.badgeType === 'ninguno' || !product.badgeExpiresAt) return false;
      const time = new Date(product.badgeExpiresAt).getTime();
      return time >= now && time - now <= WEEK_MS;
    })
    .sort((a, b) => new Date(a.badgeExpiresAt) - new Date(b.badgeExpiresAt));
  const incomplete = products.filter((product) => !product.images?.length || !product.description?.trim());

  const sections = [
    {
      key: 'consultas',
      title: 'Consultas sin responder',
      empty: 'Todas las consultas están respondidas.',
      allLink: '/admin/mensajes',
      items: unanswered.map((message) => ({
        id: message.id,
        to: `/admin/mensajes?id=${message.id}`,
        title: message.name,
        meta: `${message.status === 'pendiente' ? 'Sin leer' : 'Leída'} · ${formatDate(message.createdAt)}`,
        detail: message.subject,
        highlight: message.status === 'pendiente',
      })),
    },
    {
      key: 'agotados',
      title: 'Platos agotados',
      empty: 'No hay platos marcados como agotados.',
      allLink: '/admin/productos?estado=agotados',
      items: soldOut.map((product) => ({
        id: product.id,
        to: productLink(product),
        title: product.name,
        meta: product.category?.name,
        detail: 'El cliente lo ve en gris y no lo puede pedir',
        image: thumb(product),
      })),
    },
    {
      key: 'promos',
      title: 'Destacados que vencen esta semana',
      empty: 'Ningún destacado vence en los próximos 7 días.',
      items: expiring.map((product) => ({
        id: product.id,
        to: productLink(product),
        title: product.name,
        meta: expiresLabel(product.badgeExpiresAt),
        detail: 'Extendé la fecha o dejalo vencer',
        image: thumb(product),
        highlight: daysUntil(product.badgeExpiresAt) <= 1,
      })),
    },
    {
      key: 'incompletos',
      title: 'Productos sin foto o sin descripción',
      empty: 'Todos los productos tienen foto y descripción.',
      items: incomplete.map((product) => ({
        id: product.id,
        to: productLink(product),
        title: product.name,
        meta: [!product.images?.length && 'Sin foto', !product.description?.trim() && 'Sin descripción'].filter(Boolean).join(' · '),
        detail: product.category?.name,
        image: thumb(product),
      })),
    },
  ];
  // Atención no puede resolver promos ni productos incompletos: no se los mostramos
  return canEdit ? sections : sections.filter((section) => ['consultas', 'agotados'].includes(section.key));
};

function Row({ item }) {
  return (
    <li>
      <Link to={item.to} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-stone-800/50">
        {item.image !== undefined &&
          (item.image ? (
            <img src={thumbUrl(item.image, 44)} alt="" className="size-11 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-stone-800 text-stone-500"><ChefHat size={18} /></span>
          ))}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium text-stone-100">{item.title}</span>
          </span>
          <span className={`block truncate text-xs ${item.highlight ? 'text-accent' : 'text-stone-400'}`}>{item.meta}</span>
          {item.detail && <span className="block truncate text-xs text-stone-500">{item.detail}</span>}
        </span>
        <ChevronRight size={16} className="shrink-0 text-stone-600 transition group-hover:translate-x-0.5 group-hover:text-stone-300" />
      </Link>
    </li>
  );
}

function Section({ section }) {
  const { title, items, empty, allLink } = section;
  const extra = items.length - MAX_ROWS;
  return (
    <section className="card overflow-hidden" aria-labelledby={`hoy-${section.key}`}>
      <header className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 py-3">
        <h2 id={`hoy-${section.key}`} className="flex items-center gap-2 text-sm font-semibold text-stone-100">
          {title}
          <span className={`rounded-sm px-1.5 text-xs tabular-nums ${items.length ? 'bg-accent text-stone-900' : 'bg-stone-800 text-stone-400'}`}>{items.length}</span>
        </h2>
        {allLink && items.length > 0 && (
          <Link to={allLink} className="text-xs text-stone-400 hover:text-accent">Ver todo</Link>
        )}
      </header>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-5 text-sm text-stone-400">
          <CircleCheck size={16} className="text-emerald-400" /> {empty}
        </p>
      ) : (
        <ul className="divide-y divide-stone-800">
          {items.slice(0, MAX_ROWS).map((item) => <Row key={item.id} item={item} />)}
          {extra > 0 && (
            <li className="px-4 py-2.5 text-xs text-stone-500">
              {allLink ? <Link to={allLink} className="hover:text-accent">y {extra} más</Link> : `y ${extra} más`}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

export default function AdminToday() {
  const { summary } = useOutletContext();
  const { user } = useAuth();
  const canEdit = can(user, 'menu.edit');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Se recarga cuando el contador del menú detecta consultas nuevas
  useEffect(() => {
    let active = true;
    Promise.all([productsApi.list(), messagesApi.list()])
      .then(([products, messages]) => active && setData({ products, messages }))
      .catch((loadError) => active && setError(loadError.message));
    return () => {
      active = false;
    };
  }, [summary.pending, summary.unanswered]);

  const sections = useMemo(() => (data ? buildSections(data.products, data.messages, canEdit) : []), [data, canEdit]);
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);

  if (error && !data) return <Alert>{error}</Alert>;
  if (!data) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <>
      <PageHeader
        title="Hoy"
        description={total === 0 ? 'Todo al día: no hay nada pendiente.' : 'Lo que necesita tu atención. Tocá cada ítem para resolverlo.'}
      />
      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        {sections.map((section) => <Section key={section.key} section={section} />)}
      </div>
    </>
  );
}
