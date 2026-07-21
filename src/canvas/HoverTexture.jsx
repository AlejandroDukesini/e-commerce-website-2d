import { useEffect, useRef, useState } from 'react';
import { useAnimationDriver } from '../hooks/useAnimationDriver';
import { useTextureLoader } from '../hooks/useTextureLoader';

/**
 * Interactive "texture panel": renders a procedural texture and, on hover,
 * reveals a second texture through a cursor-following mask with a liquid
 * distortion at the edge. If `src` points to a real image in resources/, it is
 * used instead of the procedural fallback (via useTextureLoader).
 *
 * Only animates while hovering / settling, so idle main-thread cost is zero.
 */
export function HoverTexture({ hue = 210, title, subtitle, src = null, tall = false }) {
  const canvasRef = useRef(null);
  const state = useRef({ px: 0.5, py: 0.5, target: 0, reveal: 0, hover: false });
  const [active, setActive] = useState(false);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const { image } = useTextureLoader(src);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      size.current = { w: rect.width, h: rect.height, dpr };
      paintStatic();
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  // Paint one static frame (used when idle, keeps it cheap).
  const paintStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { w, h, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame(ctx, w, h, hue, image, state.current);
  };

  useAnimationDriver(
    () => {
      const s = state.current;
      s.reveal += (s.target - s.reveal) * 0.12; // ease toward target
      paintStatic();
      if (!s.hover && s.reveal < 0.01) {
        s.reveal = 0;
        setActive(false); // stop the driver once settled
      }
    },
    { enabled: active }
  );

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    state.current.px = (e.clientX - rect.left) / rect.width;
    state.current.py = (e.clientY - rect.top) / rect.height;
    if (!active) setActive(true);
  };
  const onEnter = () => { state.current.hover = true; state.current.target = 1; setActive(true); };
  const onLeave = () => { state.current.hover = false; state.current.target = 0; };

  return (
    <figure
      className={`hovertex card ${tall ? 'hovertex--tall' : ''}`}
      style={{ minHeight: tall ? 400 : 200 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
    >
      <canvas className="hovertex__canvas" ref={canvasRef} role="img" aria-label={title} />
      <figcaption className="hovertex__label">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </figcaption>
    </figure>
  );
}

/* ---------- procedural texture renderer ---------- */
function drawFrame(ctx, w, h, hue, image, s) {
  // Base texture (A)
  paintTexture(ctx, w, h, hue, 0, image);

  if (s.reveal > 0.001) {
    const cx = s.px * w;
    const cy = s.py * h;
    const maxR = Math.hypot(w, h) * 0.62;
    const r = maxR * s.reveal;

    ctx.save();
    // Liquid edge: wavy clip circle.
    ctx.beginPath();
    const steps = 42;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wob = 1 + Math.sin(a * 6 + s.reveal * 8) * 0.06 * s.reveal;
      const x = cx + Math.cos(a) * r * wob;
      const y = cy + Math.sin(a) * r * wob;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.clip();
    // Highlight texture (B) revealed inside the mask.
    paintTexture(ctx, w, h, (hue + 24) % 360, 1, image);
    ctx.restore();

    // Soft ring glow at the edge.
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${(hue + 24) % 360}, 80%, 70%, ${0.35 * s.reveal})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function paintTexture(ctx, w, h, hue, variant, image) {
  if (image && image.complete) {
    // Real asset: cover-fit, with a slight filter shift for the hover variant.
    ctx.save();
    if (variant) ctx.filter = 'saturate(1.35) brightness(1.08)';
    const scale = Math.max(w / image.width, h / image.height);
    const iw = image.width * scale, ih = image.height * scale;
    ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
    ctx.restore();
    return;
  }
  // Procedural gradient + diagonal ribbon pattern.
  const light = variant ? 58 : 44;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsl(${hue} 62% ${light}%)`);
  g.addColorStop(1, `hsl(${(hue + 30) % 360} 58% ${light - 16}%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = variant ? 0.22 : 0.12;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  const gap = 26;
  for (let x = -h; x < w; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
