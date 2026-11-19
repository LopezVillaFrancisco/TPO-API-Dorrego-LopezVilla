export default function Spinner({ className = 'size-8' }) {
  return <div className={`${className} animate-spin rounded-full border-2 border-stone-700 border-t-accent`} />;
}
