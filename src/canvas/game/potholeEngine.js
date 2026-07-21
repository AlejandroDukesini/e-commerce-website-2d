/**
 * "Huecos de Colombia" — pure game engine (no React, no DOM).
 *
 * Top-down endless runner: the road scrolls toward you, potholes (and the odd
 * cone) descend from the top, and you switch between 3 lanes to dodge them.
 * Speed ramps up the longer you survive.
 *
 * Design:
 *  - Logical coordinate space (LOGICAL_W × LOGICAL_H) decoupled from pixels.
 *  - update(dt) integrates with a clamped delta → stable at any FPS.
 *  - AABB collision detection.
 */
export const LOGICAL_W = 800;
export const LOGICAL_H = 450;

export const LANES = 3;
export const laneX = (lane) => (LOGICAL_W * (lane + 0.5)) / LANES;

// Player car sits near the bottom and slides horizontally between lanes.
const CAR = { w: 90, h: 128, y: LOGICAL_H - 92 };
const BEST_KEY = 'adc_pothole_best';

export function createGame() {
  const state = {
    status: 'idle', // idle | playing | over
    score: 0,
    best: Number(localStorage.getItem(BEST_KEY) || 0),
    speed: 320,
    baseSpeed: 320,
    spawnTimer: 0,
    spawnEvery: 0.95,
    roadOffset: 0,
    obstacles: [],
    player: { lane: 1, x: laneX(1), targetX: laneX(1) },
    shake: 0,
  };

  function reset() {
    state.status = 'playing';
    state.score = 0;
    state.speed = state.baseSpeed;
    state.spawnTimer = 0;
    state.spawnEvery = 0.95;
    state.obstacles = [];
    state.player.lane = 1;
    state.player.x = laneX(1);
    state.player.targetX = laneX(1);
    state.shake = 0;
  }

  function move(dir) {
    if (state.status !== 'playing') return;
    const next = Math.max(0, Math.min(LANES - 1, state.player.lane + dir));
    state.player.lane = next;
    state.player.targetX = laneX(next);
  }

  function setLane(lane) {
    if (state.status !== 'playing') return;
    const l = Math.max(0, Math.min(LANES - 1, lane));
    state.player.lane = l;
    state.player.targetX = laneX(l);
  }

  /** Map a normalized x (0..1 across the canvas) to the nearest lane. */
  function pointerToLane(nx) {
    setLane(Math.floor(nx * LANES));
  }

  function spawn() {
    const lane = Math.floor(Math.random() * LANES);
    const isCone = Math.random() < 0.24;
    state.obstacles.push({
      x: laneX(lane),
      y: -50,
      w: isCone ? 40 : 66,
      h: isCone ? 52 : 34,
      type: isCone ? 'cone' : 'pothole',
      lane,
    });
  }

  const aabb = (a, b) =>
    Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;

  function update(dt) {
    // Road always scrolls (alive feel), faster while playing.
    state.roadOffset = (state.roadOffset + (state.status === 'playing' ? state.speed : 110) * dt) % 90;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 4);
    if (state.status !== 'playing') return;

    state.score += dt * 12;
    state.speed = state.baseSpeed + state.score * 1.7;      // ramp difficulty
    state.spawnEvery = Math.max(0.45, 0.95 - state.score * 0.0026);

    // Smooth lane change.
    const p = state.player;
    p.x += (p.targetX - p.x) * Math.min(1, dt * 16);

    // Spawn.
    state.spawnTimer += dt;
    if (state.spawnTimer >= state.spawnEvery) {
      state.spawnTimer = 0;
      spawn();
    }

    // Move obstacles down + collide.
    const carBox = { x: p.x, y: CAR.y, w: CAR.w, h: CAR.h };
    for (const o of state.obstacles) {
      o.y += state.speed * dt;
      if (aabb(carBox, o)) {
        state.shake = 1;
        gameOver();
        return;
      }
    }
    state.obstacles = state.obstacles.filter((o) => o.y < LOGICAL_H + 60);
  }

  function gameOver() {
    state.status = 'over';
    const finalScore = Math.floor(state.score);
    if (finalScore > state.best) {
      state.best = finalScore;
      localStorage.setItem(BEST_KEY, String(finalScore));
    }
  }

  return {
    state,
    reset,
    move,
    setLane,
    pointerToLane,
    update,
    consts: { LOGICAL_W, LOGICAL_H, LANES, CAR, laneX },
  };
}
