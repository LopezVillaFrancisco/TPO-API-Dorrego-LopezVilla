import { Flame, LeafyGreen, MilkOff, Nut, Sprout, Users, WheatOff, Wine } from 'lucide-react';
import { TAG_OPTIONS } from '../utils/format';

export const TAG_ICONS = {
  sin_tacc: WheatOff,
  vegetariano: LeafyGreen,
  vegano: Sprout,
  sin_lactosa: MilkOff,
  picante: Flame,
  frutos_secos: Nut,
  con_alcohol: Wine,
  para_compartir: Users,
};

const sortTags = (tags) => TAG_OPTIONS.filter((option) => tags.includes(option.value));

export default function TagChips({ tags, size = 'md', className = '' }) {
  if (!tags?.length) return null;
  const small = size === 'sm';
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      {sortTags(tags).map(({ value, label }) => {
        const Icon = TAG_ICONS[value];
        return (
          <span
            key={value}
            className={`inline-flex items-center rounded-full border border-white/15 bg-black/45 font-medium text-stone-100 backdrop-blur-sm ${
              small ? 'gap-1 px-2 py-0.5 text-[11px]' : 'gap-1.5 px-2.5 py-1 text-xs'
            }`}
          >
            <Icon size={small ? 11 : 13} className="text-accent" />
            {label}
          </span>
        );
      })}
    </span>
  );
}
