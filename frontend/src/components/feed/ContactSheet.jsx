import { useEffect, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import FormField, { Alert } from '../FormField';
import { messagesApi } from '../../api';
import { EMAIL_REGEX } from '../../utils/format';
import { thumbUrl } from '../../utils/photo';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Ingresá tu nombre';
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Ingresá un email válido';
  if (form.phone.trim() && !/^[\d\s+()-]{6,30}$/.test(form.phone.trim())) errors.phone = 'Teléfono inválido';
  if (!form.subject.trim()) errors.subject = 'Ingresá un asunto';
  if (form.message.trim().length < 10) errors.message = 'Contanos un poco más (mínimo 10 caracteres)';
  return errors;
};

export default function ContactSheet({ open, onClose, product }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm((current) => ({ ...current, subject: product ? `Consulta sobre: ${product.name}` : 'Consulta general', message: '' }));
    setErrors({});
    setApiError('');
    setSent(false);
  }, [open, product]);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSending(true);
    setApiError('');
    try {
      await messagesApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSent(true);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Contacto" draggable={false}>
      {sent ? (
        <div className="flex flex-col items-center py-10 text-center">
          <CheckCircle2 size={56} className="text-accent" />
          <h2 className="mt-4 font-serif text-3xl">Consulta enviada</h2>
          <p className="mt-2 text-sm text-stone-400">La respuesta te llega al mail que dejaste.</p>
          <button type="button" className="btn-ghost mt-6" onClick={onClose}>Volver al menú</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <h2 className="font-serif text-3xl">Consulta</h2>
          </div>
          {product && (
            <div className="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-900/70 p-2.5">
              {product.images?.[0] && <img src={thumbUrl(product.images[0].url, 48)} alt="" className="size-12 rounded-md object-cover" />}
              <div className="min-w-0">
                <p className="text-xs text-stone-500">Sobre</p>
                <p className="truncate text-sm text-stone-100">{product.name}</p>
              </div>
            </div>
          )}
          <Alert>{apiError}</Alert>
          <FormField label="Nombre" error={errors.name}>
            <input className={`field ${errors.name ? 'field-error' : ''}`} autoComplete="name" value={form.name} onChange={update('name')} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email" error={errors.email}>
              <input className={`field ${errors.email ? 'field-error' : ''}`} type="email" autoComplete="email" value={form.email} onChange={update('email')} />
            </FormField>
            <FormField label="Teléfono" error={errors.phone}>
              <input className={`field ${errors.phone ? 'field-error' : ''}`} type="tel" autoComplete="tel" placeholder="Opcional" value={form.phone} onChange={update('phone')} />
            </FormField>
          </div>
          <FormField label="Asunto" error={errors.subject}>
            <input className={`field ${errors.subject ? 'field-error' : ''}`} value={form.subject} onChange={update('subject')} />
          </FormField>
          <FormField label="Mensaje" error={errors.message}>
            <textarea className={`field min-h-28 resize-none ${errors.message ? 'field-error' : ''}`} value={form.message} onChange={update('message')} />
          </FormField>
          <button className="btn-primary w-full" disabled={sending}>
            <Send size={16} /> {sending ? 'Enviando…' : 'Enviar consulta'}
          </button>
        </form>
      )}
    </BottomSheet>
  );
}
