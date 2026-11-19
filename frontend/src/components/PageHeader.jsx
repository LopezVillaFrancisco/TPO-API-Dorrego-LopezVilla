export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
