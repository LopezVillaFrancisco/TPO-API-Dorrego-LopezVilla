import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

const COVER = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=80';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-full lg:grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={COVER} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </aside>

      <div className="flex min-h-full items-center justify-center px-4 py-10 lg:px-12">
        <div className="w-full max-w-sm lg:max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
            <span className="flex size-11 items-center justify-center rounded-full border border-accent/60 text-accent">
              <ChefHat size={22} />
            </span>
            <span className="text-sm text-stone-400">Volver al menú</span>
          </Link>
          <div className="card p-6 lg:border-0 lg:bg-transparent lg:p-0">
            <h1 className="font-serif text-3xl lg:text-4xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-stone-400 lg:mt-2 lg:text-base">{subtitle}</p>}
            <div className="mt-6 lg:mt-8">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-stone-400 lg:text-left">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
