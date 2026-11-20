import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowLeft, CheckCheck, Clock, Eye, Inbox, Mail, MessageCircle, Phone, Trash2 } from 'lucide-react';
import { messagesApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import { ConfirmModal } from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { Alert } from '../../components/FormField';
import { MESSAGE_STATUSES, formatDate, mailtoUrl, whatsappUrl } from '../../utils/format';

const STATUS = {
  pendiente: {
    icon: Clock,
    dot: 'bg-accent',
    bar: 'border-accent',
    text: 'text-accent',
    soft: 'bg-accent/15 text-accent',
    active: 'border-accent bg-accent text-stone-900',
  },
  leido: {
    icon: Eye,
    dot: 'bg-sky-400',
    bar: 'border-sky-400/70',
    text: 'text-sky-300',
    soft: 'bg-sky-400/15 text-sky-300',
    active: 'border-sky-400 bg-sky-400 text-stone-900',
  },
  respondido: {
    icon: CheckCheck,
    dot: 'bg-emerald-400',
    bar: 'border-emerald-400/50',
    text: 'text-emerald-300',
    soft: 'bg-emerald-400/15 text-emerald-300',
    active: 'border-emerald-400 bg-emerald-400 text-stone-900',
  },
};

const statusLabel = (value) => MESSAGE_STATUSES.find((item) => item.value === value)?.label;

function StatusTag({ status }) {
  const { icon: Icon, soft } = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium ${soft}`}>
      <Icon size={12} />
      {statusLabel(status)}
    </span>
  );
}

function StatusSwitch({ value, onChange }) {
  return (
    <div className="inline-flex rounded-md border border-stone-700 p-0.5" role="radiogroup" aria-label="Estado del mensaje">
      {MESSAGE_STATUSES.map((option) => {
        const { icon: Icon, active } = STATUS[option.value];
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => !selected && onChange(option.value)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-[5px] border px-2.5 py-1.5 text-xs font-medium transition ${
              selected ? active : 'border-transparent text-stone-400 hover:text-stone-100'
            }`}
          >
            <Icon size={13} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MessageRow({ message, selected, onSelect }) {
  const { dot, bar } = STATUS[message.status];
  const pending = message.status === 'pendiente';
  const answered = message.status === 'respondido';
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(message.id)}
        className={`w-full cursor-pointer border-l-[3px] px-4 py-3 text-left transition ${bar} ${
          selected ? 'bg-stone-800/80' : 'hover:bg-stone-800/40'
        } ${answered && !selected ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${dot}`} />
            <span className={`truncate text-sm ${pending ? 'font-semibold text-stone-50' : 'text-stone-300'}`}>{message.name}</span>
          </span>
          <span className="shrink-0 text-xs text-stone-500">{formatDate(message.createdAt)}</span>
        </div>
        <p className={`mt-1 truncate pl-4 text-sm ${pending ? 'text-stone-200' : 'text-stone-400'}`}>{message.subject}</p>
        <p className="mt-0.5 truncate pl-4 text-xs text-stone-500">{message.message}</p>
      </button>
    </li>
  );
}

function ReplyBox({ message, onReplied }) {
  const firstName = message.name.trim().split(/\s+/)[0];
  const [text, setText] = useState(`Hola ${firstName}, `);
  const whatsapp = whatsappUrl(message.phone, text);
  const mail = mailtoUrl(message.email, `Re: ${message.subject}`, text);
  const answered = message.status === 'respondido';

  return (
    <div className="mt-6 border-t border-stone-800 pt-5">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={`reply-${message.id}`} className="label mb-0">Respuesta</label>
        {answered && <span className="flex items-center gap-1 text-xs text-emerald-300"><CheckCheck size={13} /> Ya respondida</span>}
      </div>
      <textarea
        id={`reply-${message.id}`}
        className="field h-32 resize-none"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noreferrer" onClick={onReplied} className="btn-primary">
            <MessageCircle size={16} /> Enviar por WhatsApp
          </a>
        )}
        <a href={mail} onClick={onReplied} className={whatsapp ? 'btn-ghost' : 'btn-primary'}>
          <Mail size={16} /> Enviar por mail
        </a>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Se abre {whatsapp ? 'WhatsApp o tu correo' : 'tu correo'} con el texto listo y la consulta pasa a "Respondido".
      </p>
    </div>
  );
}

function MessageDetail({ message, onBack, onStatus, onDelete }) {
  const { dot } = STATUS[message.status];
  return (
    <article className="card overflow-hidden p-5 lg:p-7">
      <div className={`-mx-5 -mt-5 mb-5 h-1 lg:-mx-7 lg:-mt-7 lg:mb-7 ${dot}`} />
      <button type="button" onClick={onBack} className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm text-stone-400 hover:text-stone-100 lg:hidden">
        <ArrowLeft size={16} /> Mensajes
      </button>
      <div className="flex items-center gap-2">
        <StatusTag status={message.status} />
        <span className="text-xs text-stone-500">{formatDate(message.createdAt)}</span>
      </div>
      <h2 className="mt-2 font-serif text-2xl leading-tight">{message.subject}</h2>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-400">
        <span className="text-stone-200">{message.name}</span>
        <a href={`mailto:${message.email}`} className="flex items-center gap-1.5 hover:text-accent"><Mail size={14} />{message.email}</a>
        {message.phone && <a href={`tel:${message.phone}`} className="flex items-center gap-1.5 hover:text-accent"><Phone size={14} />{message.phone}</a>}
      </div>

      <p className="mt-5 rounded-md bg-stone-900/70 p-4 text-[15px] leading-relaxed whitespace-pre-line text-stone-100">{message.message}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <StatusSwitch value={message.status} onChange={(next) => onStatus(message, next)} />
        <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm text-stone-500 transition hover:text-red-400" onClick={() => onDelete(message)}>
          <Trash2 size={14} /> Eliminar
        </button>
      </div>

      <ReplyBox key={message.id} message={message} onReplied={() => message.status !== 'respondido' && onStatus(message, 'respondido')} />
    </article>
  );
}

export default function AdminMessages() {
  const { refreshPending } = useOutletContext();
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setMessages(await messagesApi.list());
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => (filter ? messages.filter((item) => item.status === filter) : messages), [messages, filter]);
  const selected = messages.find((item) => item.id === selectedId) || null;
  const countOf = (value) => (value ? messages.filter((item) => item.status === value).length : messages.length);

  const changeStatus = async (message, nextStatus) => {
    setError('');
    try {
      const updated = await messagesApi.updateStatus(message.id, nextStatus);
      setMessages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      refreshPending();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const select = (id) => {
    setSelectedId(id);
    const message = messages.find((item) => item.id === id);
    if (message?.status === 'pendiente') changeStatus(message, 'leido');
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await messagesApi.remove(toDelete.id);
      setMessages((current) => current.filter((item) => item.id !== toDelete.id));
      if (selectedId === toDelete.id) setSelectedId(null);
      setToDelete(null);
      refreshPending();
    } catch (deleteError) {
      setError(deleteError.message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [{ value: '', label: 'Todos' }, ...MESSAGE_STATUSES];

  return (
    <>
      <PageHeader title="Mensajes" description="Consultas que llegan desde el botón de contacto del menú." />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {status === 'loading' && <div className="flex justify-center py-16"><Spinner /></div>}

      {status === 'ready' && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
          <section className={`card overflow-hidden ${selected ? 'hidden lg:block' : ''}`}>
            <nav className="no-scrollbar flex overflow-x-auto border-b border-stone-800 px-1.5" aria-label="Filtrar mensajes">
              {tabs.map((tab) => {
                const count = countOf(tab.value);
                const active = filter === tab.value;
                const highlight = tab.value === 'pendiente' && count > 0;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    className={`relative flex shrink-0 cursor-pointer items-center gap-1 px-2 py-3 text-[13px] transition ${
                      active ? 'text-stone-50' : 'text-stone-400 hover:text-stone-100'
                    }`}
                  >
                    {tab.value && <span className={`size-1.5 rounded-full ${STATUS[tab.value].dot}`} />}
                    {tab.label}
                    <span className={`rounded-sm px-1 text-xs ${highlight ? 'bg-accent font-semibold text-stone-900' : 'text-stone-500'}`}>{count}</span>
                    {active && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-stone-50" />}
                  </button>
                );
              })}
            </nav>
            {visible.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-stone-400">No hay mensajes en esta bandeja.</p>
            ) : (
              <ul className="divide-y divide-stone-800">
                {visible.map((message) => (
                  <MessageRow key={message.id} message={message} selected={message.id === selectedId} onSelect={select} />
                ))}
              </ul>
            )}
          </section>

          {selected ? (
            <MessageDetail message={selected} onBack={() => setSelectedId(null)} onStatus={changeStatus} onDelete={setToDelete} />
          ) : (
            <div className="card hidden flex-col items-center justify-center gap-3 px-6 py-24 text-center text-sm text-stone-500 lg:flex">
              <Inbox size={28} />
              Elegí un mensaje para leerlo y responderlo.
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Eliminar mensaje"
        message={`¿Eliminar el mensaje de ${toDelete?.name}? No se puede deshacer.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        busy={deleting}
      />
    </>
  );
}
