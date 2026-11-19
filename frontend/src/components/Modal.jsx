import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import useEscape from '../hooks/useEscape';

export default function Modal({ open, onClose, title, size = 'max-w-lg', children, footer }) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`flex max-h-[92dvh] w-full ${size} flex-col rounded-t-xl border border-stone-800 bg-panel shadow-2xl sm:rounded-xl`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          >
            <div className="flex items-center justify-between border-b border-stone-800 px-5 py-4">
              <h2 className="font-serif text-xl">{title}</h2>
              <button type="button" onClick={onClose} className="icon-btn size-8" aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-stone-800 px-5 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onClose, busy, error }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="max-w-sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-stone-300">{message}</p>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </Modal>
  );
}
