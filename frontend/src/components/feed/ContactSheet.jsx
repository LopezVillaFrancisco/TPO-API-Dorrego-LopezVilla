import { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, Send } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import FormField, { Alert } from '../FormField';
import { messagesApi } from '../../api';
import { EMAIL_REGEX } from '../../utils/format';
import { thumbUrl } from '../../utils/photo';

const SAVED_KEY = 'contact-data';
const EMPTY = { name: '', email: '', phone: '', message: '', website: '' };

// Nombre, email y teléfono se recuerdan en este dispositivo para no volver a escribirlos
const readSaved = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_KEY)) || {};
    return { name: saved.name || '', email: saved.email || '', phone: saved.phone || '' };
  } catch {
    return {};
  }
};

const remember = ({ name, email, phone }) => {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify({ name, email, phone }));
  } catch {
    return;
  }
};

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Ingresá tu nombre';
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Ingresá un email válido para poder responderte';
  if (form.phone.trim() && !/^[\d\s+()-]{6,30}$/.test(form.phone.trim())) errors.phone = 'Usá solo números, espacios, +, - o paréntesis';
  if (form.message.trim().length < 10) errors.message = 'Contanos un poco más (mínimo 10 caracteres)';
  return errors;
};

const whatsappLink = (business, product) => {
  const link = business?.socialLinks?.whatsapp;
  if (!link) return null;
  try {
    const url = new URL(link);
    url.searchParams.set('text', product ? `Hola, quería consultar por ${product.name}.` : 'Hola, quería hacer una consulta.');
    return url.toString();
  } catch {
    return null;
  }
};

export default function ContactSheet({ open, onClose, product, business }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm((current) => ({ ...current, ...readSaved(), message: '', website: '' }));
    setErrors({});
    setApiError('');
    setSent(false);
  }, [open, product]);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const whatsapp = whatsappLink(business, product);

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const contact = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() };
    setSending(true);
    setApiError('');
    try {
      await messagesApi.create({
        ...contact,
        phone: contact.phone || null,
        subject: product ? `Consulta sobre: ${product.name}` : 'Consulta general',
        message: form.message.trim(),
        website: form.website,
      });
      remember(contact);
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
          <p className="mt-2 text-sm text-stone-400">La respuesta te llega a {form.email.trim()}.</p>
          <button type="button" className="btn-ghost mt-6" onClick={onClose}>Volver al menú</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <h2 className="font-serif text-3xl">Consulta</h2>
            <p className="mt-1 text-sm text-stone-400">Escribinos y te respondemos por mail.</p>
          </div>
          {product && (
            <div className="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-900/70 p-2.5">
              {product.images?.[0] && <img src={thumbUrl(product.images[0].url, 48)} alt="" className="size-12 rounded-md object-cover" />}
              <div className="min-w-0">
                <p className="text-xs text-stone-400">Sobre</p>
                <p className="truncate text-sm text-stone-100">{product.name}</p>
              </div>
            </div>
          )}
          <Alert>{apiError}</Alert>
          <FormField label="Nombre" error={errors.name}>
            <input className={`field ${errors.name ? 'field-error' : ''}`} autoComplete="name" value={form.name} onChange={update('name')} />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input className={`field ${errors.email ? 'field-error' : ''}`} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={update('email')} />
          </FormField>
          <FormField label="Teléfono" error={errors.phone} hint="Opcional, por si preferís que te escribamos por WhatsApp">
            <input className={`field ${errors.phone ? 'field-error' : ''}`} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} />
          </FormField>
          <FormField label="Mensaje" error={errors.message}>
            <textarea
              className={`field min-h-28 resize-none ${errors.message ? 'field-error' : ''}`}
              placeholder={product ? '¿Es apto celíaco? ¿Para cuántos alcanza?' : '¿Hacen reservas? ¿Tienen opciones veganas?'}
              maxLength={2000}
              value={form.message}
              onChange={update('message')}
            />
          </FormField>
          {/* Campo trampa para bots: oculto para personas y lectores de pantalla */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Sitio web
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
            </label>
          </div>
          <button className="btn-primary w-full" disabled={sending}>
            <Send size={16} /> {sending ? 'Enviando…' : 'Enviar consulta'}
          </button>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-1 text-sm text-stone-300 transition-colors hover:text-accent">
              <MessageCircle size={16} /> ¿Preferís WhatsApp? Escribinos directo
            </a>
          )}
        </form>
      )}
    </BottomSheet>
  );
}
