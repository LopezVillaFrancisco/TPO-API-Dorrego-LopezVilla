const RESIZABLE_HOSTS = ['images.unsplash.com'];
const STEP = 160;
const MAX_SIDE = 2400;

const bucket = (value) => Math.min(MAX_SIDE, Math.max(STEP, Math.ceil(value / STEP) * STEP));

export const pixelRatio = () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2);

export function photoUrl(url, width, height) {
  if (!url || !width || !height) return url;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!RESIZABLE_HOSTS.includes(parsed.hostname)) return url;

  const ratio = pixelRatio();
  const scale = Math.min(1, MAX_SIDE / (Math.max(width, height) * ratio));
  parsed.search = '';
  parsed.searchParams.set('w', bucket(width * ratio * scale));
  parsed.searchParams.set('h', bucket(height * ratio * scale));
  parsed.searchParams.set('fit', 'crop');
  parsed.searchParams.set('crop', 'entropy');
  parsed.searchParams.set('auto', 'format');
  parsed.searchParams.set('q', '78');
  return parsed.toString();
}

export const thumbUrl = (url, size) => photoUrl(url, size, size);
