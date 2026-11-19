import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mail, Phone, Reply, Trash2 } from 'lucide-react';
import { messagesApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import { ConfirmModal } from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { Alert } from '../../components/FormField';
import { MESSAGE_STATUSES, formatDate } from '../../utils/format';

const STATUS_STYLES = {
  pendiente: 'bg-red-500/15 text-red-300 border-red-500/30',
  leido: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  respondido: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

export default function AdminMessages() {
  const { refreshPending } = useOutletContext();
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setMessages(await messagesApi.list(filter || undefined));
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (message, nextStatus) => {
    setError('');
    try {
      const updated = await messagesApi.updateStatus(message.id, nextStatus);
      setMessages((current) =>
        filter && filter !== nextStatus
          ? current.filter((item) => item.id !== message.id)
          : current.map((item) => (item.id === updated.id ? updated : item))
      );
      refreshPending();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await messagesApi.remove(toDelete.id);
      setMessages((current) => current.filter((item) => item.id !== toDelete.id));
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

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm transition ${
              filter === tab.value ? 'border-accent bg-accent text-stone-900' : 'border-stone-700 text-stone-300 hover:bg-stone-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {status === 'loading' && <div className="flex justify-center py-16"><Spinner /></div>}
      {status === 'ready' && messages.length === 0 && (
        <p className="card px-6 py-12 text-center text-sm text-stone-400">No hay mensajes en esta bandeja.</p>
      )}

      {status === 'ready' && (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li key={message.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[message.status]}`}>
                      {MESSAGE_STATUSES.find((item) => item.value === message.status)?.label}
                    </span>
                    <span className="text-xs text-stone-500">{formatDate(message.createdAt)}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-xl leading-tight">{message.subject}</h3>
                  <p className="mt-1 text-sm text-stone-300">{message.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-400">
                    <a href={`mailto:${message.email}`} className="flex items-center gap-1.5 hover:text-accent"><Mail size={14} />{message.email}</a>
                    {message.phone && <a href={`tel:${message.phone}`} className="flex items-center gap-1.5 hover:text-accent"><Phone size={14} />{message.phone}</a>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="field w-36 py-2"
                    value={message.status}
                    onChange={(event) => changeStatus(message, event.target.value)}
                    aria-label="Estado del mensaje"
                  >
                    {MESSAGE_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button type="button" className="icon-btn hover:text-red-400" onClick={() => setToDelete(message)} aria-label="Eliminar mensaje">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="mt-4 rounded-md bg-stone-900/70 p-4 text-sm leading-relaxed whitespace-pre-line text-stone-200">{message.message}</p>
              <a
                href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                onClick={() => message.status !== 'respondido' && changeStatus(message, 'respondido')}
                className="btn-ghost mt-3 py-2 text-xs"
              >
                <Reply size={14} /> Responder por mail
              </a>
            </li>
          ))}
        </ul>
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
