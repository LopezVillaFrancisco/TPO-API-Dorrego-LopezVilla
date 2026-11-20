import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { staffApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Modal, { ConfirmModal } from '../../components/Modal';
import FormField, { Alert } from '../../components/FormField';
import Spinner from '../../components/Spinner';
import { EMAIL_REGEX, USERNAME_HINT, USERNAME_REGEX, formatDay } from '../../utils/format';

const EMPTY_FORM = { firstName: '', lastName: '', username: '', email: '', phone: '', password: '', confirm: '' };

const toForm = (member) =>
  member
    ? { ...EMPTY_FORM, firstName: member.firstName, lastName: member.lastName, username: member.username || '', email: member.email, phone: member.phone || '' }
    : EMPTY_FORM;

const initialsOf = (member) => `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();

function validate(form, editing) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'Ingresá el nombre';
  if (!form.lastName.trim()) errors.lastName = 'Ingresá el apellido';
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Ingresá un email válido';
  const username = form.username.trim().toLowerCase();
  if (username && !USERNAME_REGEX.test(username)) errors.username = USERNAME_HINT;
  if ((!editing || form.password) && form.password.length < 6) errors.password = 'Mínimo 6 caracteres';
  if (form.password !== form.confirm) errors.confirm = 'Las contraseñas no coinciden';
  return errors;
}

function MemberModal({ open, member, onClose, onSaved }) {
  const editing = Boolean(member);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(member));
      setErrors({});
      setError('');
    }
  }, [open, member]);

  const bind = (field) => ({
    value: form[field],
    onChange: (event) => setForm({ ...form, [field]: event.target.value }),
    className: `field ${errors[field] ? 'field-error' : ''}`,
  });

  const submit = async (event) => {
    event.preventDefault();
    const next = validate(form, editing);
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setError('');
    try {
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        username: form.username.trim().toLowerCase() || null,
        phone: form.phone.trim() || null,
      };
      if (form.password) body.password = form.password;
      const saved = editing ? await staffApi.update(member.id, body) : await staffApi.create(body);
      onSaved(saved, editing);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar usuario' : 'Nuevo usuario'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" form="member-form" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </>
      }
    >
      <form id="member-form" onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" error={errors.firstName}>
            <input autoFocus {...bind('firstName')} />
          </FormField>
          <FormField label="Apellido" error={errors.lastName}>
            <input {...bind('lastName')} />
          </FormField>
        </div>
        <FormField label="Email" error={errors.email}>
          <input type="email" autoComplete="off" {...bind('email')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Usuario" error={errors.username} hint="Opcional, para ingresar sin el email">
            <input autoComplete="off" autoCapitalize="none" {...bind('username')} />
          </FormField>
          <FormField label="Teléfono">
            <input type="tel" {...bind('phone')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={editing ? 'Contraseña nueva' : 'Contraseña'} error={errors.password}>
            <input type="password" autoComplete="new-password" {...bind('password')} />
          </FormField>
          <FormField label="Repetir contraseña" error={errors.confirm}>
            <input type="password" autoComplete="new-password" {...bind('confirm')} />
          </FormField>
        </div>
        <p className="text-xs text-stone-500">
          {editing
            ? 'Dejala vacía para mantener la actual.'
            : 'Pasale la contraseña a la persona; después la puede cambiar desde su perfil.'}
        </p>
      </form>
    </Modal>
  );
}

function MemberRow({ member, isMe, onEdit, onDelete }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 font-serif text-lg text-accent">
        {initialsOf(member)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="truncate font-serif text-lg leading-tight">{member.firstName} {member.lastName}</span>
          {isMe && <span className="shrink-0 text-sm text-stone-500">vos</span>}
        </p>
        <p className="truncate text-sm text-stone-400">
          {member.username && <span className="text-stone-300">@{member.username} · </span>}
          {member.email}
        </p>
      </div>
      <div className="hidden shrink-0 text-right text-sm md:block">
        {member.phone && <p className="text-stone-300">{member.phone}</p>}
        <p className="text-stone-500">Desde el {formatDay(member.date)}</p>
      </div>
      <button type="button" className="icon-btn shrink-0" onClick={() => onEdit(member)} aria-label={`Editar a ${member.firstName}`} title="Editar">
        <Pencil size={16} />
      </button>
      <button
        type="button"
        className="icon-btn shrink-0 hover:border-red-500/50 hover:text-red-400"
        onClick={() => onDelete(member)}
        disabled={isMe}
        aria-label={`Eliminar a ${member.firstName}`}
        title={isMe ? 'No podés eliminar tu propio usuario' : 'Eliminar'}
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

export default function AdminStaff() {
  const { user, setUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [editor, setEditor] = useState({ open: false, member: null });
  const [notice, setNotice] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    staffApi
      .list()
      .then((list) => {
        setMembers(list);
        setStatus('ready');
      })
      .catch((error) => {
        setLoadError(error.message);
        setStatus('error');
      });
  }, []);

  const handleSaved = (saved, edited) => {
    if (edited) {
      setMembers((current) => current.map((member) => (member.id === saved.id ? saved : member)));
      if (saved.id === user?.id) setUser(saved);
      setNotice(`Se guardaron los cambios de ${saved.firstName}.`);
    } else {
      setMembers((current) => [...current, saved]);
      setNotice(`${saved.firstName} ya puede ingresar al panel.`);
    }
    setEditor({ open: false, member: null });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await staffApi.remove(toDelete.id);
      setMembers((current) => current.filter((member) => member.id !== toDelete.id));
      setNotice('');
      setToDelete(null);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Equipo"
        description="Personas que pueden ingresar al panel. Todas tienen los mismos permisos."
        action={
          <button type="button" className="btn-primary" onClick={() => setEditor({ open: true, member: null })}>
            <Plus size={16} /> Nuevo usuario
          </button>
        }
      />

      {notice && <div className="mb-4"><Alert type="success">{notice}</Alert></div>}

      {status === 'loading' && <div className="flex justify-center py-16"><Spinner /></div>}
      {status === 'error' && <Alert>{loadError}</Alert>}
      {status === 'ready' && (
        <ul className="card divide-y divide-stone-800 overflow-hidden">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isMe={member.id === user?.id}
              onEdit={(selected) => setEditor({ open: true, member: selected })}
              onDelete={setToDelete}
            />
          ))}
        </ul>
      )}

      <MemberModal
        open={editor.open}
        member={editor.member}
        onClose={() => setEditor({ open: false, member: null })}
        onSaved={handleSaved}
      />

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Eliminar usuario"
        message={toDelete ? `${toDelete.firstName} ${toDelete.lastName} ya no va a poder ingresar al panel.` : ''}
        onConfirm={confirmDelete}
        onClose={() => {
          setToDelete(null);
          setDeleteError('');
        }}
        busy={deleting}
        error={deleteError}
      />
    </>
  );
}
