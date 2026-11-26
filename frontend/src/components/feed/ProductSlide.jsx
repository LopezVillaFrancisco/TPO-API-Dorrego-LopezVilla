import { memo, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChefHat, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, EyeOff, MessageCircle, Pencil } from 'lucide-react';
import Badge from '../Badge';
import TagChips from '../TagChips';
import useElementSize from '../../hooks/useElementSize';
import { formatPrice, getPricing, pad } from '../../utils/format';
import { photoUrl, thumbUrl } from '../../utils/photo';
import { recentlyPanned } from './gesture';

function AdminActions({ product, onEdit, onToggleAvailable }) {
  return (
    <>
      <button type="button" onClick={() => onEdit(product)} className="flex cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-stone-900">
        <Pencil size={13} /> Editar
      </button>
      <button
        type="button"
        onClick={() => onToggleAvailable(product)}
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/15 bg-stone-950/85 px-3 py-2 text-xs font-semibold text-stone-100"
      >
        {product.isAvailable ? <EyeOff size={13} /> : <Eye size={13} />}
        {product.isAvailable ? 'Marcar agotado' : 'Marcar disponible'}
      </button>
    </>
  );
}

function UnavailableTag() {
  return (
    <span className="rounded-sm bg-stone-950/85 px-2.5 py-1.5 text-[13px] font-semibold text-stone-300">
      No disponible
    </span>
  );
}

// En el celular la descripción va sobre la foto: se muestran 3 líneas y el resto con "Ver más"
function MobileDescription({ text, width }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element && !expanded) setClamped(element.scrollHeight > element.clientHeight + 1);
  }, [text, width, expanded]);

  return (
    <div className="mt-3 max-w-xl">
      <p
        ref={ref}
        className={`text-[15px] leading-relaxed text-stone-300 md:text-lg ${expanded ? '' : 'line-clamp-3'}`}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 cursor-pointer text-sm font-semibold text-accent"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
}

function Counter({ index, total }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs text-stone-300">
      {pad(index + 1)}
      <span className="h-px w-8 bg-accent" />
      {pad(total)}
    </div>
  );
}

function ProductSlide({
  product,
  index,
  total,
  categoryName,
  adminView,
  onEdit,
  onToggleAvailable,
  onContact,
  onPrev,
  onNext,
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const frameRef = useRef(null);
  const frame = useElementSize(frameRef);
  const images = product.images || [];
  const safeIndex = Math.min(imageIndex, Math.max(images.length - 1, 0));
  const current = images[safeIndex];
  const { badge, price, final, hasDiscount, percent } = getPricing(product);

  const step = (direction) => {
    if (recentlyPanned()) return;
    setImageIndex((value) => (value + direction + images.length) % images.length);
  };

  const dots = images.length > 1 && (
    <div className="flex gap-1.5">
      {images.map((image, i) => (
        <button
          key={image.id ?? i}
          type="button"
          aria-label={`Ver imagen ${i + 1}`}
          onClick={() => setImageIndex(i)}
          className={`h-1.5 cursor-pointer rounded-full transition-all ${i === safeIndex ? 'w-6 bg-accent' : 'w-1.5 bg-white/40'}`}
        />
      ))}
    </div>
  );

  const priceBlock = (big) => (
    <div>
      {hasDiscount && <p className={`text-stone-400 line-through ${big ? 'text-base' : 'text-sm'}`}>{formatPrice(price)}</p>}
      <p className={`font-bold text-stone-50 ${big ? 'text-4xl xl:text-5xl' : 'text-3xl md:text-4xl'}`}>{formatPrice(final)}</p>
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-stone-900 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,1fr)] lg:bg-ink">
      <div ref={frameRef} className="group/image relative h-full w-full overflow-hidden bg-stone-900">
        <AnimatePresence initial={false}>
          {current && frame.width > 0 ? (
            <motion.img
              key={current.url}
              src={photoUrl(current.url, frame.width, frame.height)}
              alt={product.name}
              draggable={false}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover ${product.isAvailable ? '' : 'grayscale'}`}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            />
          ) : current ? null : (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900">
              <ChefHat size={88} className="text-stone-700" />
            </div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-black/70 to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black via-black/70 to-transparent lg:h-1/4 lg:via-black/20" />

        {images.length > 1 && (
          <>
            <button type="button" aria-label="Imagen anterior" onClick={() => step(-1)} className="absolute top-[22%] left-0 h-[40%] w-1/3 cursor-w-resize lg:hidden" />
            <button type="button" aria-label="Imagen siguiente" onClick={() => step(1)} className="absolute top-[22%] right-0 h-[40%] w-1/3 cursor-e-resize lg:hidden" />
            <button
              type="button"
              aria-label="Imagen anterior"
              onClick={() => step(-1)}
              className="absolute top-1/2 left-5 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md bg-black/65 text-white opacity-0 transition group-hover/image:opacity-100 hover:bg-black/75 lg:flex"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={() => step(1)}
              className="absolute top-1/2 right-5 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md bg-black/65 text-white opacity-0 transition group-hover/image:opacity-100 hover:bg-black/75 lg:flex"
            >
              <ChevronRight size={22} />
            </button>
            <div className="absolute inset-x-0 bottom-6 hidden justify-center lg:flex">{dots}</div>
          </>
        )}

        <div className="absolute top-[124px] right-4 flex flex-col items-end gap-2 lg:hidden">
          <Badge badge={badge} percent={percent} />
          {!product.isAvailable && <UnavailableTag />}
        </div>

        {!product.isAvailable && (
          <div className="absolute top-6 left-6 hidden lg:block">
            <UnavailableTag />
          </div>
        )}

        {adminView && (
          <div className="absolute top-[124px] left-4 flex flex-col items-start gap-2 lg:hidden">
            <AdminActions product={product} onEdit={onEdit} onToggleAvailable={onToggleAvailable} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] md:px-10 md:pb-12 lg:hidden">
          {dots && <div className="mb-4">{dots}</div>}
          <p className="text-sm font-medium text-accent">{categoryName}</p>
          <h2 className="mt-2 font-serif text-[2.5rem] leading-[1.05] text-stone-50 md:text-6xl">{product.name}</h2>
          <TagChips tags={product.tags} className="mt-3" />
          {product.description && <MobileDescription text={product.description} width={frame.width} />}
          <div className="mt-5 flex items-end justify-between">
            {priceBlock(false)}
            <div className="pb-1.5">
              <Counter index={index} total={total} />
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden h-full flex-col border-l border-white/5 bg-ink px-12 py-10 lg:flex xl:px-16">
        <div className="flex items-center justify-between">
          <Counter index={index} total={total} />
          <div className="flex gap-2">
            <button type="button" onClick={onPrev} className="icon-btn size-10" aria-label="Producto anterior">
              <ChevronUp size={18} />
            </button>
            <button type="button" onClick={onNext} className="icon-btn size-10" aria-label="Producto siguiente">
              <ChevronDown size={18} />
            </button>
          </div>
        </div>

        <div className="my-auto py-8">
          {badge && badge !== 'ninguno' && (
            <div className="mb-6">
              <Badge badge={badge} percent={percent} />
            </div>
          )}
          <p className="text-sm font-medium text-accent">{categoryName}</p>
          <h2 className="mt-3 font-serif text-5xl leading-[1.05] text-stone-50 xl:text-6xl">{product.name}</h2>
          <TagChips tags={product.tags} className="mt-4" />
          {product.description && <p className="mt-5 max-w-md text-lg leading-relaxed text-stone-300">{product.description}</p>}
          <div className="mt-8">{priceBlock(true)}</div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onContact} className="btn-primary px-5 py-3">
              <MessageCircle size={17} /> Consultar por este plato
            </button>
            {adminView && <AdminActions product={product} onEdit={onEdit} onToggleAvailable={onToggleAvailable} />}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-3">
            {images.map((image, i) => (
              <button
                key={image.id ?? i}
                type="button"
                onClick={() => setImageIndex(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className={`size-16 cursor-pointer overflow-hidden rounded-md border-2 transition ${i === safeIndex ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={thumbUrl(image.url, 64)} alt="" draggable={false} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

export default memo(ProductSlide);
