import { useEffect, useRef } from 'react';
import { LuxuryCar } from './LuxuryCar';

/**
 * Global scroll-driven car that lives *behind* the page content.
 *
 * As the user scrolls the whole document, the car glides left→right; near the
 * bottom it eases to a "parked" position. rAF-throttled + passive scroll and a
 * single inherited CSS custom property (`--car-x`) mean the browser animates it
 * on the compositor — no layout thrash, GPU-friendly. Respects reduced-motion.
 */
export function ScrollCarBackground() {
  const wrapRef = useRef(null);
  const ticking = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const compute = () => {
      ticking.current = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      // Travel across the viewport, then hold (park) through the last stretch.
      const travel = Math.min(p / 0.88, 1);
      const vw = window.innerWidth;
      const startX = -vw * 0.12;
      const endX = vw * 0.72;
      const x = startX + (endX - startX) * travel;

      // Var set on the wrapper is inherited by the car SVG (translateX reads it).
      el.style.setProperty('--car-x', `${x}px`);
      el.classList.toggle('is-parked', p > 0.9);
    };

    if (reduced) {
      el.style.setProperty('--car-x', `${window.innerWidth * 0.2}px`);
      return;
    }

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
  }, []);

  return (
    <div className="scroll-car" ref={wrapRef} aria-hidden="true">
      <LuxuryCar variant="line" className="scroll-car__vehicle" title="" />
    </div>
  );
}
