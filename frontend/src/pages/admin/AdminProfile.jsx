import { useEffect, useState } from 'react';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import FormField, { Alert } from '../../components/FormField';
import Spinner from '../../components/Spinner';
import { EMAIL_REGEX, USERNAME_HINT, USERNAME_REGEX, formatDate } from '../../utils/format';

export default function AdminProfile() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const fill = (user) => {
    setProfile(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username || '',
      phone: user.phone || '',
      password: '',
      confirm: '',
    });
  };

  useEffect(() => {
    authApi
      .getProfile()
      .then(fill)
      .catch((error) => setMessage({ type: 'error', text: error.message }));
  }, []);

  if (!form) {
    return message.text ? <Alert>{message.text}</Alert> : <div className="flex justify-center py-16"><Spinner /></div>;
  }

  const bind = (field) => ({ value: form[field], onChange: (event) => setForm({ ...form, [field]: event.target.value }) });

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Ingresá tu nombre';
    if (!form.lastName.trim()) next.lastName = 'Ingresá tu apellido';
    if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Ingresá un email válido';
    const username = form.username.trim().toLowerCase();
    if (username && !USERNAME_REGEX.test(username)) next.username = USERNAME_HINT;
    if (form.password && form.password.length < 6) next.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirm) next.confirm = 'Las contraseñas no coinciden';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        username: form.username.trim().toLowerCase() || null,
        phone: form.phone.trim() || null,
      };
      if (form.password) body.password = form.password;
      const updated = await authApi.updateProfile(body);
      fill(updated);
      setUser(updated);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <>
      <PageHeader title="Mi perfil" />
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className="card p-6">
          <span className="flex size-20 items-center justify-center rounded-full bg-accent/15 font-serif text-3xl text-accent">{initials}</span>
          <p className="mt-4 font-serif text-2xl leading-tight">{profile.firstName} {profile.lastName}</p>
          {profile.username && <p className="mt-0.5 text-sm text-stone-400">@{profile.username}</p>}
          <dl className="mt-5 space-y-3 border-t border-stone-800 pt-5 text-sm">
            <div>
              <dt className="text-xs text-stone-500">Email</dt>
              <dd className="truncate text-stone-200">{profile.email}</dd>
            </div>
            {profile.phone && (
              <div>
                <dt className="text-xs text-stone-500">Teléfono</dt>
                <dd className="text-stone-200">{profile.phone}</dd>
              </div>
            )}
            {profile.date && (
              <div>
                <dt className="text-xs text-stone-500">Administrador desde</dt>
                <dd className="text-stone-200">{formatDate(profile.date)}</dd>
              </div>
            )}
          </dl>
        </aside>

        <form onSubmit={submit} className="space-y-5" noValidate>
          {message.text && <Alert type={message.type}>{message.text}</Alert>}
          <section className="card p-5 lg:p-6">
            <h2 className="font-serif text-xl">Datos personales</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FormField label="Nombre" error={errors.firstName}>
                <input className={`field ${errors.firstName ? 'field-error' : ''}`} {...bind('firstName')} />
              </FormField>
              <FormField label="Apellido" error={errors.lastName}>
                <input className={`field ${errors.lastName ? 'field-error' : ''}`} {...bind('lastName')} />
              </FormField>
              <FormField label="Usuario" error={errors.username}>
                <input className={`field ${errors.username ? 'field-error' : ''}`} autoComplete="username" autoCapitalize="none" {...bind('username')} />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Email" error={errors.email}>
                  <input className={`field ${errors.email ? 'field-error' : ''}`} type="email" {...bind('email')} />
                </FormField>
              </div>
              <FormField label="Teléfono">
                <input className="field" type="tel" {...bind('phone')} />
              </FormField>
            </div>
          </section>

          <section className="card p-5 lg:p-6">
            <h2 className="font-serif text-xl">Contraseña</h2>
            <p className="mt-1 text-sm text-stone-400">Dejala vacía para mantener la actual.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Contraseña nueva" error={errors.password}>
                <input className={`field ${errors.password ? 'field-error' : ''}`} type="password" autoComplete="new-password" {...bind('password')} />
              </FormField>
              <FormField label="Repetir contraseña" error={errors.confirm}>
                <input className={`field ${errors.confirm ? 'field-error' : ''}`} type="password" autoComplete="new-password" {...bind('confirm')} />
              </FormField>
            </div>
          </section>

          <div className="flex justify-end">
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>
    </>
  );
}
