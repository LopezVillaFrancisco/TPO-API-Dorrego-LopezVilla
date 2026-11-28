import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Archive, ArchiveRestore, ArrowLeft, CheckCheck, Clock, Eye, Inbox, Mail, MessageCircle, Phone, Search, Settings2, Trash2, X } from 'lucide-react';
import { messagesApi, quickRepliesApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import { ConfirmModal } from '../../components/Modal';
import QuickRepliesManager from '../../components/QuickRepliesManager';
import Spinner from '../../components/Spinner';
import { Alert } from '../../components/FormField';
import useDebounced from '../../hooks/useDebounced';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';
import { MESSAGE_STATUSES, formatDate, mailtoUrl, whatsappUrl } from '../../utils/format';

const STATUS = {
  pendiente: {
    icon: Clock,
    dot: 'bg-accent',
    soft: 'bg-accent/15 text-accent',
    active: 'border-accent bg-accent text-stone-900',
  },
  leido: {
    icon: Eye,
    dot: 'bg-sky-400',
    soft: 'bg-sky-400/15 text-sky-300',
    active: 'border-sky-400 bg-sky-400 text-stone-900',
  },
  respondido: {
    icon: CheckCheck,
    dot: 'bg-emerald-400',
    soft: 'bg-emerald-400/15 text-emerald-300',
    active: 'border-emerald-400 bg-emerald-400 text-stone-900',
  },
};

const statusLabel = (value) => MESSAGE_STATUSES.find((item) => item.value === value)?.label;

const firstNameOf = (name) => name.trim().split(/\s+/)[0];

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
    <div className="inline-flex flex-wrap rounded-md border border-stone-700 p-0.5" role="radiogroup" aria-label="Estado del mensaje">
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
  const { dot } = STATUS[message.status];
  const pending = message.status === 'pendiente';
  const answered = message.status === 'respondido';
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(message.id)}
        aria-current={selected ? 'true' : undefined}
        className={`w-full cursor-pointer px-4 py-3 text-left transition ${selected ? 'bg-stone-800/80' : 'hover:bg-stone-800/40'} ${
          answered && !selected ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
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

function ReplyBox({ message, replies, onManageReplies, onReplied }) {
  // onManageReplies llega vacío cuando el rol no puede editar las respuestas rápidas
  const firstName = firstNameOf(message.name);
  const [text, setText] = useState(`Hola ${firstName}, `);
  const textareaRef = useRef(null);
  const caretRef = useRef(false);
  const whatsapp = whatsappUrl(message.phone, text);
  const mail = mailtoUrl(message.email, `Re: ${message.subject}`, text);
  const answered = message.status === 'respondido';

  // Inserta la respuesta guardada donde está el cursor (o al final) y reemplaza {nombre}
  const insert = (reply) => {
    const snippet = reply.text.replaceAll('{nombre}', firstName);
    const area = textareaRef.current;
    // Si el cuadro nunca tuvo el foco, el cursor del navegador queda en 0: en ese caso se agrega al final
    const useCursor = area && caretRef.current;
    const start = useCursor ? area.selectionStart : text.length;
    const end = useCursor ? area.selectionEnd : text.length;
    const before = text.slice(0, start);
    const glue = before && !/\s$/.test(before) ? ' ' : '';
    const next = `${before}${glue}${snippet}${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      if (!area) return;
      const caret = before.length + glue.length + snippet.length;
      area.focus();
      area.setSelectionRange(caret, caret);
      caretRef.current = true;
    });
  };

  return (
    <div className="mt-6 border-t border-stone-800 pt-5">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={`reply-${message.id}`} className="label mb-0">Respuesta</label>
        {answered && <span className="flex items-center gap-1 text-xs text-emerald-300"><CheckCheck size={13} /> Ya respondida</span>}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {replies.map((reply) => (
          <button
            key={reply.id}
            type="button"
            onClick={() => insert(reply)}
            title={reply.text}
            className="cursor-pointer rounded-md border border-stone-700 px-2.5 py-1 text-xs text-stone-300 transition hover:border-accent hover:text-accent"
          >
            {reply.title}
          </button>
        ))}
        {onManageReplies && (
          <button type="button" onClick={onManageReplies} className="flex cursor-pointer items-center gap-1 px-1.5 py-1 text-xs text-stone-500 transition hover:text-stone-200">
            <Settings2 size={13} /> {replies.length ? 'Editar respuestas rápidas' : 'Crear respuestas rápidas'}
          </button>
        )}
      </div>

      <textarea
        ref={textareaRef}
        id={`reply-${message.id}`}
        className="field h-32 resize-none"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onSelect={() => {
          caretRef.current = true;
        }}
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

function NoteBox({ message, onSave }) {
  const [text, setText] = useState(message.internalNote || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = text.trim() !== (message.internalNote || '');

  const save = async () => {
    setSaving(true);
    const ok = await onSave(message, text.trim());
    setSaving(false);
    setSaved(ok);
  };

  return (
    <div className="mt-6 border-t border-stone-800 pt-5">
      <label htmlFor={`note-${message.id}`} className="label">Nota interna</label>
      <textarea
        id={`note-${message.id}`}
        className="field h-20 resize-none"
        placeholder="Solo la ve el equipo. Ej.: reservó para el sábado a las 21."
        maxLength={2000}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setSaved(false);
        }}
      />
      <div className="mt-2 flex items-center gap-3">
        <button type="button" className="btn-ghost py-2 text-xs" disabled={!dirty || saving} onClick={save}>
          {saving ? 'Guardando…' : 'Guardar nota'}
        </button>
        {saved && !dirty && <span className="text-xs text-emerald-300">Nota guardada</span>}
      </div>
    </div>
  );
}

function MessageDetail({ message, replies, onManageReplies, onBack, onStatus, onArchive, onDelete, onSaveNote }) {
  const archived = Boolean(message.archivedAt);
  return (
    <article className="card overflow-hidden p-5 lg:p-7">
      <button type="button" onClick={onBack} className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm text-stone-400 hover:text-stone-100 xl:hidden">
        <ArrowLeft size={16} /> Mensajes
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag status={message.status} />
        {archived && <span className="rounded-sm bg-stone-800 px-1.5 py-0.5 text-xs text-stone-300">Archivada</span>}
        <span className="text-xs text-stone-500">{formatDate(message.createdAt)}</span>
      </div>
      <h2 className="mt-2 font-serif text-2xl leading-tight break-words">{message.subject}</h2>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-400">
        <span className="text-stone-200">{message.name}</span>
        <a href={`mailto:${message.email}`} className="flex min-w-0 items-center gap-1.5 break-all hover:text-accent"><Mail size={14} className="shrink-0" />{message.email}</a>
        {message.phone && <a href={`tel:${message.phone}`} className="flex items-center gap-1.5 hover:text-accent"><Phone size={14} />{message.phone}</a>}
      </div>

      <p className="mt-5 rounded-md bg-stone-900/70 p-4 text-[15px] leading-relaxed break-words whitespace-pre-line text-stone-100">{message.message}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <StatusSwitch value={message.status} onChange={(next) => onStatus(message, next)} />
        <div className="flex items-center gap-4">
          <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm text-stone-400 transition hover:text-stone-100" onClick={() => onArchive(message, !archived)}>
            {archived ? <><ArchiveRestore size={14} /> Volver a la bandeja</> : <><Archive size={14} /> Archivar</>}
          </button>
          {onDelete && (
            <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm text-stone-500 transition hover:text-red-400" onClick={() => onDelete(message)}>
              <Trash2 size={14} /> Eliminar
            </button>
          )}
        </div>
      </div>

      {message.status === 'respondido' && message.repliedAt && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300">
          <CheckCheck size={13} /> Respondida el {formatDate(message.repliedAt)}
          {message.repliedBy ? ` por ${message.repliedBy}` : ''}
        </p>
      )}

      <ReplyBox
        key={message.id}
        message={message}
        replies={replies}
        onManageReplies={onManageReplies}
        onReplied={() => message.status !== 'respondido' && onStatus(message, 'respondido')}
      />
      <NoteBox key={`note-${message.id}`} message={message} onSave={onSaveNote} />
    </article>
  );
}

export default function AdminMessages() {
  const { refreshPending } = useOutletContext();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [box, setBox] = useState('bandeja');
  const [filter, setFilter] = useState('');
  const [term, setTerm] = useState('');
  const search = useDebounced(term.trim(), 300);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(() => Number(searchParams.get('id')) || null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [replies, setReplies] = useState([]);
  const [managing, setManaging] = useState(false);

  const archivedView = box === 'archivadas';

  const load = useCallback(async () => {
    try {
      setMessages(await messagesApi.list({ archived: archivedView, search }));
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  }, [archivedView, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    quickRepliesApi.list().then(setReplies).catch(() => null);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const visible = useMemo(() => (filter ? messages.filter((item) => item.status === filter) : messages), [messages, filter]);
  const selected = messages.find((item) => item.id === selectedId) || null;
  const countOf = (value) => (value ? messages.filter((item) => item.status === value).length : messages.length);

  const replaceMessage = (updated) => setMessages((current) => current.map((item) => (item.id === updated.id ? updated : item)));

  const changeStatus = async (message, nextStatus) => {
    setError('');
    try {
      replaceMessage(await messagesApi.updateStatus(message.id, nextStatus));
      refreshPending();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const saveNote = async (message, note) => {
    setError('');
    try {
      replaceMessage(await messagesApi.updateNote(message.id, note));
      return true;
    } catch (updateError) {
      setError(updateError.message);
      return false;
    }
  };

  const setArchived = async (message, archived) => {
    setError('');
    try {
      await messagesApi.setArchived(message.id, archived);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setSelectedId(null);
      setNotice(archived ? 'Consulta archivada.' : 'La consulta volvió a la bandeja.');
      refreshPending();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const select = useCallback(
    (id) => {
      setSelectedId(id);
      const message = messages.find((item) => item.id === id);
      if (message?.status === 'pendiente') changeStatus(message, 'leido');
    },
    // changeStatus no cambia entre renders de forma relevante
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages]
  );

  // ?id= abre una consulta puntual (por ejemplo desde la pantalla Hoy)
  const linkedId = Number(searchParams.get('id')) || null;
  useEffect(() => {
    if (status !== 'ready' || !linkedId) return;
    if (messages.some((item) => item.id === linkedId)) select(linkedId);
    setSearchParams((params) => {
      params.delete('id');
      return params;
    }, { replace: true });
  }, [status, linkedId, messages, select, setSearchParams]);

  const switchBox = (next) => {
    if (next === box) return;
    setBox(next);
    setFilter('');
    setSelectedId(null);
    setStatus('loading');
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
  const emptyText = search
    ? `No hay consultas que coincidan con "${search}".`
    : archivedView
      ? 'No hay consultas archivadas.'
      : filter
        ? 'No hay consultas en este estado.'
        : 'No hay consultas en la bandeja. Las nuevas aparecen solas.';

  return (
    <>
      <PageHeader title="Mensajes" description="Consultas que llegan desde el botón de contacto del menú." />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {notice && <div className="mb-4"><Alert type="success">{notice}</Alert></div>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-stone-700 p-0.5" role="tablist" aria-label="Bandeja">
          {[
            { value: 'bandeja', label: 'Bandeja', icon: Inbox },
            { value: 'archivadas', label: 'Archivadas', icon: Archive },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={box === value}
              onClick={() => switchBox(value)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm transition ${
                box === value ? 'bg-stone-100 font-medium text-stone-900' : 'text-stone-400 hover:text-stone-100'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-500" />
          <input
            className="field py-2 pr-9 pl-9"
            placeholder="Buscar por nombre, email o texto"
            aria-label="Buscar consultas"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
          {term && (
            <button type="button" onClick={() => setTerm('')} className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1 text-stone-500 hover:text-stone-200" aria-label="Limpiar búsqueda">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {status === 'loading' && <div className="flex justify-center py-16"><Spinner /></div>}

      {status === 'ready' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:items-start">
          <section className={`card overflow-hidden ${selected ? 'hidden xl:block' : ''}`}>
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
              <p className="px-6 py-12 text-center text-sm text-stone-400">{emptyText}</p>
            ) : (
              <ul className="divide-y divide-stone-800">
                {visible.map((message) => (
                  <MessageRow key={message.id} message={message} selected={message.id === selectedId} onSelect={select} />
                ))}
              </ul>
            )}
          </section>

          {selected ? (
            <MessageDetail
              message={selected}
              replies={replies}
              onManageReplies={can(user, 'quickReplies.edit') ? () => setManaging(true) : null}
              onBack={() => setSelectedId(null)}
              onStatus={changeStatus}
              onArchive={setArchived}
              onDelete={can(user, 'messages.delete') ? setToDelete : null}
              onSaveNote={saveNote}
            />
          ) : (
            <div className="card hidden flex-col items-center justify-center gap-3 px-6 py-24 text-center text-sm text-stone-400 xl:flex">
              <Inbox size={28} />
              Elegí un mensaje para leerlo y responderlo.
            </div>
          )}
        </div>
      )}

      <QuickRepliesManager open={managing} onClose={() => setManaging(false)} replies={replies} onChange={setReplies} />
      <ConfirmModal
        open={Boolean(toDelete)}
        title="Eliminar mensaje"
        message={`¿Eliminar el mensaje de ${toDelete?.name}? No se puede deshacer. Si solo querés sacarlo de la bandeja, usá Archivar.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        busy={deleting}
      />
    </>
  );
}
