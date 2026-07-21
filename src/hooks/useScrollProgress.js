import { useEffect, useRef, useState } from 'react';

/**
 * Reports how far a target element has scrolled through the viewport,
 * as a 0→1 progress value. rAF-throttled + passive listener so scroll
 * stays buttery (no layout thrash on the main thread).
 *
 * progress 0  = element's top just reached the bottom of the viewport
 * progress 1  = element's bottom just left the top of the viewport
 */
export function useScrollProgress(targetRef) {
  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const compute = () => {
      ticking.current = false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + vh;
      const scrolled = vh - rect.top;
      const p = Math.min(1, Math.max(0, scrolled / total));
      setProgress(p);
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef]);

  return progress;
}
