import { useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Decoupled requestAnimationFrame driver.
 *
 * The interactive canvas modules (scrollytelling, mini-game) never call rAF
 * directly — they subscribe to this driver. That keeps the animation source
 * swappable (rAF today, a physics lib tomorrow) without touching components,
 * and it automatically:
 *   - pauses when the tab is hidden (saves battery / main-thread work),
 *   - passes a clamped delta so physics stay stable after a stall,
 *   - honors prefers-reduced-motion by not starting at all.
 *
 * @param {(dt:number, elapsed:number) => void} onFrame  called each frame
 * @param {{ enabled?: boolean, respectReducedMotion?: boolean }} options
 */
export function useAnimationDriver(onFrame, { enabled = true, respectReducedMotion = true } = {}) {
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled) return;
    if (respectReducedMotion && reduced) {
      // Render a single static frame so content is still correct.
      cbRef.current?.(0, 0);
      return;
    }

    let raf;
    let last = performance.now();
    const start = last;
    let running = true;

    const loop = (now) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05); // clamp to avoid spiral of death
      last = now;
      cbRef.current?.(dt, (now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, respectReducedMotion, reduced]);
}
