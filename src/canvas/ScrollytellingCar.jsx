import { useEffect, useRef, useState } from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useAnimationDriver } from '../hooks/useAnimationDriver';
import { useTextureLoader, useResourceManifest } from '../hooks/useTextureLoader';
import { drawScene, makePalette } from './engine/carRenderer';

const STEPS = [
  { title: 'Empieza el viaje', text: 'Cada gran historia arranca con una llave en la mano.' },
  { title: 'Toma la carretera', text: 'Kilómetros de libertad, a tu ritmo y sin apuros.' },
  { title: 'Llega a tu destino', text: 'Tu próximo auto te está esperando en Autos del Camino.' },
];

/**
 * Scroll-driven 2D car animation ("scrollytelling").
 * - Canvas is pinned (sticky) while the tall wrapper scrolls past.
 * - Scroll → normalized progress → carRenderer paints the frame.
 * - Fully decoupled: swap the renderer or drop a real texture in resources/
 *   without touching this component. Renders a procedural fallback otherwise.
 */
export function ScrollytellingCar() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const progress = useScrollProgress(wrapRef);
  const progressRef = useRef(0);
  progressRef.current = progress;

  const manifest = useResourceManifest();
  const { image: bodyTexture } = useTextureLoader(manifest['car-body'] || null);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const check = () => {
      const attr = root.getAttribute('data-theme');
      setIsDark(attr === 'dark' || (attr !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    };
    check();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', check);
    const mo = new MutationObserver(check);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { mq.removeEventListener('change', check); mo.disconnect(); };
  }, []);

  // Handle DPR-correct canvas sizing.
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Animation driver: repaint each frame (car idles + wheels spin even when still).
  useAnimationDriver((_dt, elapsed) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { w, h, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene(ctx, {
      width: w,
      height: h,
      progress: progressRef.current,
      palette: makePalette(isDark),
      texture: bodyTexture,
      elapsed,
    });
  });

  const activeStep = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length + 0.001));

  return (
    <section id="experiencia" className="scrolly" ref={wrapRef} aria-label="La experiencia del camino">
      <div className="scrolly__stage">
        <canvas className="scrolly__canvas" ref={canvasRef} role="img"
          aria-label="Animación de un auto recorriendo la carretera al hacer scroll" />
        <div className="scrolly__progress" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`scrolly__dot ${i === activeStep ? 'is-active' : ''}`} />
          ))}
        </div>
        <div className="scrolly__caption">
          <h2>{STEPS[activeStep].title}</h2>
          <p>{STEPS[activeStep].text}</p>
        </div>
      </div>
    </section>
  );
}
