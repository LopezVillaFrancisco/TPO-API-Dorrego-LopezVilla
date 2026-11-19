import { ChefHat } from 'lucide-react';

export default function BusinessLogo({ business, size = 'sm' }) {
  const dimensions = size === 'lg' ? 'size-20' : 'size-10';
  if (business?.logoUrl) {
    return <img src={business.logoUrl} alt={business.name} className={`${dimensions} rounded-full border border-accent/60 object-cover`} />;
  }
  return (
    <span className={`${dimensions} flex items-center justify-center rounded-full border border-accent/60 text-accent`}>
      <ChefHat size={size === 'lg' ? 36 : 20} />
    </span>
  );
}
