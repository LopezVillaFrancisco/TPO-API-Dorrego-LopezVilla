import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormField, { Alert } from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [sending, setSending] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.identifier.trim()) nextErrors.identifier = 'Ingresá tu email o usuario';
    if (!form.password) nextErrors.password = 'Ingresá tu contraseña';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSending(true);
    setApiError('');
    try {
      await login({ identifier: form.identifier.trim(), password: form.password });
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (error) {
      setApiError(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      title="Ingresar"
      subtitle="Accedé al panel para gestionar tu menú."
      footer={<Link to="/" className="hover:text-accent">← Volver al menú</Link>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{apiError}</Alert>
        <FormField label="Email o usuario" error={errors.identifier}>
          <input className={`field ${errors.identifier ? 'field-error' : ''}`} autoComplete="username" autoCapitalize="none" value={form.identifier} onChange={update('identifier')} />
        </FormField>
        <FormField label="Contraseña" error={errors.password}>
          <input className={`field ${errors.password ? 'field-error' : ''}`} type="password" autoComplete="current-password" value={form.password} onChange={update('password')} />
        </FormField>
        <button className="btn-primary w-full" disabled={sending}>
          {sending ? 'Ingresando…' : 'Ingresar'}
        </button>
        <div className="flex justify-between text-sm text-stone-400">
          <Link to="/recuperar" className="hover:text-accent">¿Olvidaste tu contraseña?</Link>
          <Link to="/registro" className="hover:text-accent">Crear cuenta</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
