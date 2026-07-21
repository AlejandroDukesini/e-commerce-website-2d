/** Renderer for the top-down pothole game. */
import { LOGICAL_W, LOGICAL_H, LANES, laneX } from './potholeEngine';

const PAL = {
  grass: '#20241d',
  road: '#2c3037',
  roadEdge: '#c6a15b',
  lane: '#e9e6dd',
  car: '#c6a15b',
  carDark: '#8a6a2f',
  glass: '#dce9f2',
  pothole: '#101216',
  potholeRim: '#454a52',
  cone: '#ef7d4a',
};

export function renderGame(ctx, game, w, h) {
  const s = game.state;
  const sx = w / LOGICAL_W;
  const sy = h / LOGICAL_H;
  ctx.save();
  if (s.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 7 * s.shake, (Math.random() - 0.5) * 7 * s.shake);
  }
  ctx.scale(sx, sy);

  // grass shoulders
  ctx.fillStyle = PAL.grass;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // road (full width with margins)
  const margin = 40;
  ctx.fillStyle = PAL.road;
  ctx.fillRect(margin, 0, LOGICAL_W - margin * 2, LOGICAL_H);

  // side edges (dashed, scrolling down)
  ctx.fillStyle = PAL.roadEdge;
  for (let y = -90 + s.roadOffset; y < LOGICAL_H; y += 90) {
    ctx.fillRect(margin - 6, y, 5, 46);
    ctx.fillRect(LOGICAL_W - margin + 1, y, 5, 46);
  }

  // lane dividers (dashed, scrolling down)
  ctx.fillStyle = PAL.lane;
  for (let l = 1; l < LANES; l++) {
    const x = (LOGICAL_W * l) / LANES;
    for (let y = -90 + s.roadOffset; y < LOGICAL_H; y += 90) {
      ctx.fillRect(x - 2, y, 4, 46);
    }
  }

  // obstacles
  for (const o of s.obstacles) {
    if (o.type === 'pothole') drawPothole(ctx, o);
    else drawCone(ctx, o);
  }

  // player car (points up)
  drawCar(ctx, game.consts.CAR, s.player.x);

  ctx.restore();
}

function drawPothole(ctx, o) {
  ctx.fillStyle = PAL.potholeRim;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y + 3, o.w / 2 + 3, o.h / 2 + 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.pothole;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCone(ctx, o) {
  ctx.fillStyle = PAL.cone;
  ctx.beginPath();
  ctx.moveTo(o.x, o.y - o.h / 2);
  ctx.lineTo(o.x + o.w / 2, o.y + o.h / 2);
  ctx.lineTo(o.x - o.w / 2, o.y + o.h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(o.x - o.w / 3, o.y - 2, (o.w / 3) * 2, 5);
}

function drawCar(ctx, CAR, cx) {
  const w = CAR.w;
  const h = CAR.h;
  const x = cx - w / 2;
  const y = CAR.y - h / 2;
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h + 4, w / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // body (vertical, nose up)
  ctx.fillStyle = PAL.car;
  roundRect(ctx, 0, 0, w, h, 12);
  ctx.fill();
  // windshield
  ctx.fillStyle = PAL.glass;
  roundRect(ctx, w * 0.16, h * 0.14, w * 0.68, h * 0.22, 6);
  ctx.fill();
  // rear window
  roundRect(ctx, w * 0.16, h * 0.64, w * 0.68, h * 0.18, 6);
  ctx.fill();
  // center stripe
  ctx.fillStyle = PAL.carDark;
  ctx.fillRect(w / 2 - 3, 0, 6, h);
  // wheels
  ctx.fillStyle = '#15171b';
  roundRect(ctx, -6, h * 0.16, 10, 26, 3); ctx.fill();
  roundRect(ctx, w - 4, h * 0.16, 10, 26, 3); ctx.fill();
  roundRect(ctx, -6, h * 0.62, 10, 26, 3); ctx.fill();
  roundRect(ctx, w - 4, h * 0.62, 10, 26, 3); ctx.fill();
  // headlights (front = top)
  ctx.fillStyle = '#fff4cf';
  ctx.beginPath(); ctx.arc(w * 0.24, 6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.76, 6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
