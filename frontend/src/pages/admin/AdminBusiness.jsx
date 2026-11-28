import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { businessApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import FormField, { Alert } from '../../components/FormField';
import { BusinessInfoContent } from '../../components/feed/InfoSheet';
import Spinner from '../../components/Spinner';
import { isValidUrl } from '../../utils/format';

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'web', label: 'Sitio web' },
];

const toForm = (info) => ({
  name: info.name || '',
  description: info.description || '',
  address: info.address || '',
  phone: info.phone || '',
  hours: info.hours || '',
  logoUrl: info.logoUrl || '',
  socialLinks: { ...(info.socialLinks || {}) },
});

const previewOf = (form) => ({
  name: form.name.trim() || 'Mi comercio',
  description: form.description.trim(),
  address: form.address.trim(),
  phone: form.phone.trim(),
  hours: form.hours.trim(),
  logoUrl: isValidUrl(form.logoUrl.trim()) ? form.logoUrl.trim() : null,
  socialLinks: Object.fromEntries(Object.entries(form.socialLinks).map(([key, value]) => [key, (value || '').trim()])),
});

export default function AdminBusiness() {
  const { setBusiness } = useOutletContext();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    businessApi
      .get()
      .then((info) => setForm(toForm(info)))
      .catch((error) => setMessage({ type: 'error', text: error.message }));
  }, []);

  if (!form) {
    return message.text ? <Alert>{message.text}</Alert> : <div className="flex justify-center py-16"><Spinner /></div>;
  }

  const bind = (field) => ({ value: form[field], onChange: (event) => setForm({ ...form, [field]: event.target.value }) });
  const setSocial = (key, value) => setForm({ ...form, socialLinks: { ...form.socialLinks, [key]: value } });

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'El nombre es obligatorio';
    if (form.logoUrl.trim() && !isValidUrl(form.logoUrl.trim())) next.logoUrl = 'Ingresá una URL válida';
    SOCIAL_FIELDS.forEach(({ key }) => {
      const value = (form.socialLinks[key] || '').trim();
      if (value && !isValidUrl(value)) next[key] = 'Ingresá una URL completa (https://…)';
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const socialLinks = Object.fromEntries(
        Object.entries(form.socialLinks)
          .map(([key, value]) => [key, (value || '').trim()])
          .filter(([, value]) => value)
      );
      const updated = await businessApi.update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        hours: form.hours.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        socialLinks,
      });
      setForm(toForm(updated));
      setBusiness(updated);
      setMessage({ type: 'success', text: 'Datos del comercio actualizados.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Comercio" description="Esto es lo que ve el cliente al tocar el logo en el menú." />
      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_340px] xl:items-start" noValidate>
        <div className="card space-y-4 p-5">
          {message.text && <Alert type={message.type}>{message.text}</Alert>}
          <FormField label="Nombre" error={errors.name}>
            <input className={`field ${errors.name ? 'field-error' : ''}`} {...bind('name')} />
          </FormField>
          <FormField label="Descripción">
            <textarea className="field min-h-24 resize-none" {...bind('description')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Dirección">
              <input className="field" {...bind('address')} />
            </FormField>
            <FormField label="Teléfono">
              <input className="field" type="tel" {...bind('phone')} />
            </FormField>
          </div>
          <FormField label="Horarios" hint="Ej: Martes a Domingo de 12 a 16 y de 20 a 00">
            <input className="field" {...bind('hours')} />
          </FormField>
          <FormField label="Logo (URL)" error={errors.logoUrl}>
            <input className={`field ${errors.logoUrl ? 'field-error' : ''}`} placeholder="https://…" {...bind('logoUrl')} />
          </FormField>
          <div>
            <span className="label">Redes sociales</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOCIAL_FIELDS.map(({ key, label }) => (
                <FormField key={key} error={errors[key]}>
                  <input
                    className={`field ${errors[key] ? 'field-error' : ''}`}
                    placeholder={label}
                    value={form.socialLinks[key] || ''}
                    onChange={(event) => setSocial(key, event.target.value)}
                  />
                </FormField>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </div>

        <aside className="xl:sticky xl:top-10">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="label mb-0">Vista previa</p>
            <span className="text-xs text-stone-500">Se actualiza mientras escribís</span>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-stone-700 bg-black p-2 shadow-xl shadow-black/40">
            <div className="max-h-[70dvh] overflow-y-auto rounded-[22px] bg-ink px-5 pt-3 pb-6 no-scrollbar" inert>
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-700" />
              <BusinessInfoContent business={previewOf(form)} onContact={() => {}} />
            </div>
          </div>
          <p className="mt-2 text-xs text-stone-500">Así se ve la ficha cuando el cliente toca el logo en el menú. Los links con formato inválido no se muestran.</p>
        </aside>
      </form>
    </>
  );
}
