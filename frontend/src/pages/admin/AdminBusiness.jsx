import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { businessApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import FormField, { Alert } from '../../components/FormField';
import BusinessLogo from '../../components/BusinessLogo';
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
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_320px]" noValidate>
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

        <aside className="card h-fit p-5 text-center">
          <p className="label">Vista previa</p>
          <div className="mt-3 flex flex-col items-center">
            <BusinessLogo business={{ name: form.name, logoUrl: isValidUrl(form.logoUrl.trim()) ? form.logoUrl.trim() : null }} size="lg" />
            <p className="mt-3 font-serif text-2xl">{form.name || 'Mi comercio'}</p>
            {form.description && <p className="mt-2 text-sm text-stone-400">{form.description}</p>}
            {form.hours && <p className="mt-3 text-xs text-stone-500">{form.hours}</p>}
          </div>
        </aside>
      </form>
    </>
  );
}
