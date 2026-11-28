import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from './Modal';
import FormField, { Alert } from './FormField';
import { quickRepliesApi } from '../api';

const EMPTY = { id: null, title: '', text: '' };

// Alta, edición y baja de las respuestas rápidas que se usan en Mensajes
export default function QuickRepliesManager({ open, onClose, replies, onChange }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);

  const editing = form.id !== null;
  const reset = () => {
    setForm(EMPTY);
    setErrors({});
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = 'Poné un nombre corto, por ejemplo "Reservas"';
    if (!form.text.trim()) next.text = 'Escribí el texto de la respuesta';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setApiError('');
    try {
      const body = { title: form.title.trim(), text: form.text.trim() };
      if (editing) {
        const updated = await quickRepliesApi.update(form.id, body);
        onChange(replies.map((reply) => (reply.id === updated.id ? updated : reply)));
      } else {
        const created = await quickRepliesApi.create(body);
        onChange([...replies, created]);
      }
      reset();
    } catch (error) {
      setApiError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (reply) => {
    setApiError('');
    try {
      await quickRepliesApi.remove(reply.id);
      onChange(replies.filter((item) => item.id !== reply.id));
      if (form.id === reply.id) reset();
    } catch (error) {
      setApiError(error.message);
    }
  };

  const close = () => {
    reset();
    setApiError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Respuestas rápidas">
      <p className="text-sm text-stone-400">
        Textos que el equipo usa seguido. Al tocarlos se agregan a la respuesta. Escribí <code className="rounded-sm bg-stone-800 px-1 text-stone-200">{'{nombre}'}</code> para
        poner el nombre del cliente.
      </p>

      <div className="mt-4"><Alert>{apiError}</Alert></div>

      {replies.length > 0 && (
        <ul className="mt-4 divide-y divide-stone-800 rounded-lg border border-stone-800">
          {replies.map((reply) => (
            <li key={reply.id} className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-100">{reply.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-stone-400">{reply.text}</p>
              </div>
              <button type="button" className="icon-btn size-8 shrink-0" onClick={() => setForm({ id: reply.id, title: reply.title, text: reply.text })} aria-label={`Editar ${reply.title}`}>
                <Pencil size={14} />
              </button>
              <button type="button" className="icon-btn size-8 shrink-0 hover:text-red-400" onClick={() => remove(reply)} aria-label={`Eliminar ${reply.title}`}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
        <p className="text-sm font-medium text-stone-200">{editing ? 'Editar respuesta' : 'Nueva respuesta'}</p>
        <FormField label="Nombre" error={errors.title} hint="Lo que se ve en el botón">
          <input className={`field ${errors.title ? 'field-error' : ''}`} maxLength={60} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </FormField>
        <FormField label="Texto" error={errors.text}>
          <textarea
            className={`field h-24 resize-none ${errors.text ? 'field-error' : ''}`}
            maxLength={1000}
            placeholder="Sí {nombre}, tenemos opciones sin TACC…"
            value={form.text}
            onChange={(event) => setForm({ ...form, text: event.target.value })}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          {editing && <button type="button" className="btn-ghost" onClick={reset}>Cancelar edición</button>}
          <button className="btn-primary" disabled={busy}>
            {editing ? 'Guardar cambios' : <><Plus size={16} /> Agregar</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
