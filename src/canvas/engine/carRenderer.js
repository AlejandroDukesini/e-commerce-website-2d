/**
 * Pure, framework-agnostic Canvas 2D renderer for the scrollytelling scene.
 *
 * It knows nothing about React or scroll — you hand it a normalized progress
 * (0→1) and it paints one frame. This separation is what lets the same engine
 * be driven by scroll today, or a timeline/physics lib later.
 *
 * If `texture` (an HTMLImageElement) is provided it is drawn as the car body;
 * otherwise a clean procedural car is rendered (empty-template fallback).
 */

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function drawScene(ctx, opts) {
  const { width: w, height: h, progress, palette, texture, elapsed = 0 } = opts;
  ctx.clearRect(0, 0, w, h);

  // ---- Sky / backdrop gradient (calm dawn over the open road) ----
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, palette.sky0);
  sky.addColorStop(1, palette.sky1);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // ---- Distant hills (parallax, slow) ----
  const hillShift = progress * w * 0.25;
  drawHills(ctx, w, h, hillShift, palette);

  // ---- Sun ----
  const sunY = h * (0.28 - progress * 0.06);
  ctx.beginPath();
  ctx.arc(w * 0.78, sunY, Math.min(w, h) * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = palette.sun;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;

  // ---- Road ----
  const roadY = h * 0.72;
  ctx.fillStyle = palette.road;
  ctx.fillRect(0, roadY, w, h - roadY);
  // moving lane dashes (parallax, fast)
  drawLaneDashes(ctx, w, roadY + (h - roadY) * 0.42, progress, palette);

  // ---- Car: drives left→right across the scene as progress advances ----
  const t = easeInOut(progress);
  const carScale = Math.min(w, h) / 620;
  const carW = 320 * carScale;
  const carX = -carW + t * (w + carW * 1.4);
  const bob = Math.sin(elapsed * 6) * 1.6 * carScale; // subtle idle bounce
  const carY = roadY - 96 * carScale + bob;

  drawCar(ctx, carX, carY, carScale, progress, palette, texture, elapsed);
}

function drawHills(ctx, w, h, shift, palette) {
  ctx.fillStyle = palette.hill;
  ctx.beginPath();
  const base = h * 0.62;
  ctx.moveTo(-shift - 40, base);
  for (let x = -40; x <= w + 120; x += 120) {
    ctx.quadraticCurveTo(
      x + 60 - shift, base - 46,
      x + 120 - shift, base
    );
  }
  ctx.lineTo(w + 120, h);
  ctx.lineTo(-120, h);
  ctx.closePath();
  ctx.fill();
}

function drawLaneDashes(ctx, w, y, progress, palette) {
  const dashW = 46;
  const gap = 42;
  const period = dashW + gap;
  const offset = (progress * w * 2) % period;
  ctx.fillStyle = palette.lane;
  for (let x = -period + offset; x < w; x += period) {
    ctx.fillRect(x, y - 4, dashW, 8);
  }
}

function drawCar(ctx, x, y, s, progress, palette, texture, elapsed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(160, 150, 130, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  if (texture && texture.complete) {
    // Real asset path: draw provided texture as the car body.
    ctx.drawImage(texture, 20, 30, 280, 120);
  } else {
    // Procedural fallback body
    const grad = ctx.createLinearGradient(0, 40, 0, 150);
    grad.addColorStop(0, palette.car0);
    grad.addColorStop(1, palette.car1);
    ctx.fillStyle = grad;
    roundBody(ctx);
    ctx.fill();

    // glass
    ctx.fillStyle = palette.glass;
    ctx.beginPath();
    ctx.moveTo(120, 78);
    ctx.lineTo(196, 78);
    ctx.quadraticCurveTo(214, 78, 226, 92);
    ctx.lineTo(120, 100);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(112, 100);
    ctx.lineTo(112, 82);
    ctx.quadraticCurveTo(112, 78, 104, 82);
    ctx.lineTo(86, 98);
    ctx.closePath();
    ctx.fill();

    // headlight glow
    ctx.fillStyle = palette.head;
    ctx.beginPath();
    ctx.ellipse(292, 120, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // wheels (rotate with progress for a sense of speed)
  const spin = progress * Math.PI * 22 + elapsed * 4;
  drawWheel(ctx, 96, 148, 26, spin, palette);
  drawWheel(ctx, 236, 148, 26, spin, palette);

  ctx.restore();
}

function roundBody(ctx) {
  ctx.beginPath();
  ctx.moveTo(38, 138);
  ctx.quadraticCurveTo(42, 104, 74, 100);
  ctx.lineTo(108, 76);
  ctx.quadraticCurveTo(120, 68, 140, 68);
  ctx.lineTo(198, 68);
  ctx.quadraticCurveTo(216, 68, 230, 82);
  ctx.lineTo(266, 100);
  ctx.quadraticCurveTo(296, 104, 298, 126);
  ctx.lineTo(298, 138);
  ctx.quadraticCurveTo(298, 148, 288, 148);
  ctx.lineTo(48, 148);
  ctx.quadraticCurveTo(38, 148, 38, 138);
  ctx.closePath();
}

function drawWheel(ctx, cx, cy, r, angle, palette) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#15181d';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(angle);
  ctx.strokeStyle = palette.rim;
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r * 0.6);
    ctx.stroke();
    ctx.rotate((Math.PI * 2) / 5);
  }
  ctx.fillStyle = palette.rim;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Palettes derived from CSS custom properties (theme-aware). */
export function makePalette(isDark) {
  return isDark
    ? {
        sky0: '#0f1216', sky1: '#1a2230', hill: '#1d2a38', sun: '#3f6d8f',
        road: '#0c0e12', lane: '#3a4250', car0: '#5aa0d6', car1: '#2f6fa0',
        glass: '#c6dcec', head: '#fff4cf', rim: '#8b929c',
      }
    : {
        sky0: '#eaf1f7', sky1: '#f8ead9', hill: '#cdd9c6', sun: '#f4c98a',
        road: '#3a3f47', lane: '#f4f1ea', car0: '#1f6aa0', car1: '#12395a',
        glass: '#dce9f2', head: '#fff3c4', rim: '#c9d0d8',
      };
}
