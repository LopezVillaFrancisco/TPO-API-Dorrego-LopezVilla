import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormField, { Alert } from '../../components/FormField';
import { authApi } from '../../api';
import { EMAIL_REGEX } from '../../utils/format';

export default function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      setError('Ingresá un email válido');
      return;
    }
    setSending(true);
    setError('');
    try {
      const response = await authApi.recoverPassword({ email: email.trim() });
      setResult({ message: response.message, token: response.data?.resetToken });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviamos las instrucciones a tu email."
      footer={<Link to="/login" className="hover:text-accent">← Volver a ingresar</Link>}
    >
      {result ? (
        <div className="space-y-4">
          <Alert type="success">{result.message}</Alert>
          {result.token && (
            <>
              <p className="text-xs text-stone-400">
                Modo desarrollo: el backend devolvió el token de recuperación porque todavía no se envían mails.
              </p>
              <Link to={`/reset?token=${result.token}`} className="btn-primary w-full">
                Crear nueva contraseña
              </Link>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField label="Email" error={error}>
            <input className={`field ${error ? 'field-error' : ''}`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FormField>
          <button className="btn-primary w-full" disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar instrucciones'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
