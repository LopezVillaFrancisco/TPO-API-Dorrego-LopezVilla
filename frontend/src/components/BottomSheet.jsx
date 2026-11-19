import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import useEscape from '../hooks/useEscape';
import { useIsDesktop } from '../hooks/useMediaQuery';

const SLIDE = { type: 'tween', duration: 0.32, ease: [0.32, 0.72, 0, 1] };
const FADE = { type: 'tween', duration: 0.22, ease: 'easeOut' };

export default function BottomSheet({ open, onClose, title, draggable = true, tall = false, children }) {
  useEscape(open, onClose);
  const isDesktop = useIsDesktop();

  const mobileClasses = `inset-x-0 bottom-0 mx-auto w-full max-w-[480px] rounded-t-xl border-t ${tall ? 'h-[92dvh]' : 'max-h-[88dvh]'}`;
  const desktopClasses = 'inset-y-0 right-0 h-full w-[460px] border-l';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/65"
            style={{ willChange: 'opacity' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            onClick={onClose}
          />
          <motion.div
            key={isDesktop ? 'side' : 'bottom'}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`fixed z-50 flex flex-col border-stone-800 bg-panel ${isDesktop ? desktopClasses : mobileClasses}`}
            style={{ willChange: 'transform' }}
            initial={isDesktop ? { x: '100%' } : { y: '100%' }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: '100%' } : { y: '100%' }}
            transition={SLIDE}
            drag={draggable && !isDesktop ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(event, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div className={`flex items-center justify-between px-5 ${isDesktop ? 'pt-5 pb-2' : 'pt-3 pb-2'}`}>
              <span className="w-8" />
              {!isDesktop && <span className="h-1.5 w-12 rounded-full bg-stone-600" />}
              <button type="button" onClick={onClose} className="icon-btn size-8 border-transparent" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className={`no-scrollbar flex-1 overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] ${isDesktop ? 'px-8' : 'px-5'}`}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
