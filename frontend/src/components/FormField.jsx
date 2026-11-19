export default function FormField({ label, error, hint, children }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-400">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>
      )}
    </label>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  const styles =
    type === 'error'
      ? 'border-red-500/40 bg-red-500/10 text-red-300'
      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  return <div className={`rounded-md border px-3 py-2.5 text-sm ${styles}`}>{children}</div>;
}
