import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormField, { Alert } from '../../components/FormField';
import { authApi } from '../../api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ token: params.get('token') || '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.token.trim()) next.token = 'Falta el código de recuperación';
    if (form.password.length < 6) next.password = 'Mínimo 6 caracteres';
    if (form.confirm !== form.password) next.confirm = 'Las contraseñas no coinciden';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    setApiError('');
    try {
      await authApi.resetPassword({ token: form.token.trim(), password: form.password });
      setDone(true);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setSending(false);
    }
  };

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elegí una contraseña nueva para tu cuenta.">
      {done ? (
        <div className="space-y-4">
          <Alert type="success">Contraseña actualizada correctamente.</Alert>
          <Link to="/login" className="btn-primary w-full">Ir a ingresar</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Alert>{apiError}</Alert>
          {!params.get('token') && (
            <FormField label="Código de recuperación" error={errors.token}>
              <input className={`field ${errors.token ? 'field-error' : ''}`} value={form.token} onChange={update('token')} />
            </FormField>
          )}
          <FormField label="Contraseña nueva" error={errors.password}>
            <input className={`field ${errors.password ? 'field-error' : ''}`} type="password" autoComplete="new-password" value={form.password} onChange={update('password')} />
          </FormField>
          <FormField label="Repetir contraseña" error={errors.confirm}>
            <input className={`field ${errors.confirm ? 'field-error' : ''}`} type="password" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} />
          </FormField>
          <button className="btn-primary w-full" disabled={sending}>
            {sending ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
