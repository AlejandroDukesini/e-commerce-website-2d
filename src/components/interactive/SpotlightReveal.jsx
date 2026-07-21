import { useRef } from 'react';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';

/**
 * SpotlightReveal — a cursor-following "flashlight" that reveals a bright,
 * detailed version of whatever you put inside it (images, a grid, any node).
 *
 * Technique (adapted from the classic text-spotlight to arbitrary content):
 *   ┌─ base layer   → the SAME children, rendered dim / flat (bottom)
 *   └─ reveal layer → the SAME children, rendered bright / textured, clipped
 *                     to a radial-gradient `maskImage` that tracks the pointer
 *
 * Because both layers render identical `children`, it works with real <img>
 * elements, a <picture>, a CSS-texture grid, or anything else — no coupling.
 *
 * Props
 *   maskSize       {number}  spotlight diameter in px (default 300)
 *   intensity      {number}  0–100, edge hardness of the radial gradient
 *                            (higher = crisper spotlight; default 60)
 *   dimOpacity     {number}  0–1 brightness of the base/flat layer (default 0.4)
 *   brightContrast {number}  contrast multiplier of the revealed layer (default 1.2)
 *   transition     {object}  framer-motion transition for the grow/shrink
 *   className, ...rest        forwarded to the wrapper
 *
 * Accessibility: the base layer carries the real, readable content; the reveal
 * layer is aria-hidden (decorative duplicate). Honors prefers-reduced-motion by
 * disabling the pointer effect and simply presenting the detailed version.
 */
export function SpotlightReveal({
  children,
  maskSize = 300,
  intensity = 60,
  dimOpacity = 0.4,
  brightContrast = 1.2,
  transition = { type: 'spring', stiffness: 170, damping: 26, mass: 0.6 },
  className = '',
  ...rest
}) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef(null);

  // Live pointer position + animated spotlight radius.
  const maskX = useMotionValue(0);
  const maskY = useMotionValue(0);
  const size = useMotionValue(0);

  // `intensity` controls how quickly the gradient fades to transparent:
  // a high value keeps it solid almost to the edge (hard spotlight); a low
  // value feathers early (soft glow).
  const solidStop = Math.max(0, Math.min(100, intensity));
  const featherStop = Math.min(100, solidStop + (100 - solidStop) * 0.9 + 8);

  // maskImage recomputes on the compositor as the motion values change — no
  // React re-render per frame.
  const maskImage = useMotionTemplate`radial-gradient(circle ${size}px at ${maskX}px ${maskY}px, #000 ${solidStop}%, transparent ${featherStop}%)`;

  const handleMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    maskX.set(e.clientX - rect.left);
    maskY.set(e.clientY - rect.top);
  };
  const handleEnter = (e) => {
    handleMove(e); // avoid a jump from (0,0) on first frame
    animate(size, maskSize, transition);
  };
  const handleLeave = () => animate(size, 0, transition);

  // --- Reduced motion: present the detailed version, no tracking, no motion.
  if (prefersReduced) {
    return (
      <div ref={containerRef} className={`spotlight ${className}`.trim()} {...rest}>
        <div
          className="spotlight__layer spotlight__base"
          style={{ filter: `contrast(${brightContrast}) saturate(1.1)` }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`spotlight ${className}`.trim()}
      onPointerMove={handleMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      {...rest}
    >
      {/* Base: real, accessible content — dim / flat */}
      <div
        className="spotlight__layer spotlight__base"
        style={{ filter: `brightness(${dimOpacity}) saturate(0.7)` }}
      >
        {children}
      </div>

      {/* Reveal: bright / textured duplicate, clipped to the moving spotlight */}
      <motion.div
        className="spotlight__layer spotlight__reveal"
        aria-hidden="true"
        style={{
          filter: `contrast(${brightContrast}) brightness(1.06) saturate(1.2)`,
          WebkitMaskImage: maskImage,
          maskImage,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
