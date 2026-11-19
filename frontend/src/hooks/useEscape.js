import { useEffect, useRef } from 'react';

export default function useEscape(active, onEscape) {
  const handler = useRef(onEscape);
  handler.current = onEscape;

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') handler.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
