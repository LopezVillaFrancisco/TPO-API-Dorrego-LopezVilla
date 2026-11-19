import { ChefHat, Flame, Hourglass, Percent, Sparkles } from 'lucide-react';
import { badgeLabel } from '../utils/format';

const ICONS = {
  descuento: Percent,
  nuevo: Sparkles,
  mas_vendido: Flame,
  recomendado_chef: ChefHat,
  ultimas_unidades: Hourglass,
};

const STYLES = {
  descuento: 'bg-red-500 text-white',
  nuevo: 'bg-emerald-400 text-stone-900',
  mas_vendido: 'bg-accent text-stone-900',
  recomendado_chef: 'bg-stone-100 text-stone-900',
  ultimas_unidades: 'bg-orange-500 text-white',
};

export default function Badge({ badge, percent, size = 'md' }) {
  if (!badge || badge === 'ninguno') return null;
  const Icon = ICONS[badge];
  const sizing = size === 'sm' ? 'px-1.5 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1.5 text-[13px] gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-sm font-semibold ${sizing} ${STYLES[badge]}`}>
      {Icon && <Icon size={size === 'sm' ? 12 : 15} />}
      {badgeLabel(badge, percent)}
    </span>
  );
}
