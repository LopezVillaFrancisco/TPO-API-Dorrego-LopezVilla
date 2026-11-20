import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormField, { Alert } from '../../components/FormField';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import useRegistrationOpen from '../../hooks/useRegistrationOpen';
import { EMAIL_REGEX, USERNAME_HINT, USERNAME_REGEX } from '../../utils/format';
import PasswordInput from '../../components/PasswordInput';

const FIELDS = [
  { name: 'firstName', label: 'Nombre', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Apellido', autoComplete: 'family-name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'username', label: 'Usuario (opcional)', autoComplete: 'username' },
  { name: 'phone', label: 'Teléfono (opcional)', type: 'tel', autoComplete: 'tel' },
  { name: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password' },
  { name: 'confirm', label: 'Repetir contraseña', type: 'password', autoComplete: 'new-password' },
];

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', username: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [sending, setSending] = useState(false);
  const registrationOpen = useRegistrationOpen();

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  if (registrationOpen === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!registrationOpen) {
    return (
      <AuthLayout
        title="Registro cerrado"
        subtitle="El comercio ya tiene administradores. Si necesitás acceso, pedíselo a uno de ellos."
      >
        <Link to="/login" className="btn-primary w-full">Ir a ingresar</Link>
      </AuthLayout>
    );
  }

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Ingresá tu nombre';
    if (!form.lastName.trim()) next.lastName = 'Ingresá tu apellido';
    if (!EMAIL_REGEX.test(form.email)) next.email = 'Ingresá un email válido';
    const username = form.username.trim().toLowerCase();
    if (username && !USERNAME_REGEX.test(username)) next.username = USERNAME_HINT;
    if (form.password.length < 6) next.password = 'Mínimo 6 caracteres';
    if (form.confirm !== form.password) next.confirm = 'Las contraseñas no coinciden';
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    setApiError('');
    try {
      const { confirm, ...body } = form;
      await register({
        ...body,
        email: body.email.trim(),
        username: body.username.trim().toLowerCase() || null,
        phone: body.phone.trim() || null,
      });
      navigate('/admin', { replace: true });
    } catch (error) {
      setApiError(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Registrá un administrador del comercio."
      footer={
        <>
          ¿Ya tenés cuenta? <Link to="/login" className="text-accent">Ingresá</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{apiError}</Alert>
        {FIELDS.map((field) => {
          const Input = field.type === 'password' ? PasswordInput : 'input';
          return (
            <FormField key={field.name} label={field.label} error={errors[field.name]}>
              <Input
                className={`field ${errors[field.name] ? 'field-error' : ''}`}
                type={field.type || 'text'}
                autoComplete={field.autoComplete}
                value={form[field.name]}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
              />
            </FormField>
          );
        })}
        <button className="btn-primary w-full" disabled={sending}>
          {sending ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  );
}
