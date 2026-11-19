const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const formatPrice = (value) => currency.format(Number(value || 0));

export const pad = (value) => String(value).padStart(2, '0');

export const BADGE_OPTIONS = [
  { value: 'ninguno', label: 'Sin chip' },
  { value: 'descuento', label: 'Descuento' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'mas_vendido', label: 'Más vendido' },
  { value: 'recomendado_chef', label: 'Elección del chef' },
  { value: 'ultimas_unidades', label: 'Últimas unidades' },
];

const BADGE_LABELS = Object.fromEntries(BADGE_OPTIONS.map((option) => [option.value, option.label]));

export const MESSAGE_STATUSES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'leido', label: 'Leído' },
  { value: 'respondido', label: 'Respondido' },
];

const isExpired = (date) => Boolean(date) && new Date(date) < new Date();

export function getPricing(product) {
  const badge = product.activeBadge ?? (isExpired(product.badgeExpiresAt) ? 'ninguno' : product.badgeType);
  const price = Number(product.price);
  const discount = product.discountPrice === null || product.discountPrice === undefined ? null : Number(product.discountPrice);
  const hasDiscount = badge === 'descuento' && discount !== null && discount < price;
  const final = hasDiscount ? discount : price;
  const percent = hasDiscount && price > 0 ? Math.round((1 - final / price) * 100) : 0;
  return { badge, price, final, hasDiscount, percent };
}

export const badgeLabel = (badge, percent) => {
  if (badge === 'descuento') return percent ? `${percent}% OFF` : 'Descuento';
  return BADGE_LABELS[badge] || '';
};

export const formatDate = (value) =>
  new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
