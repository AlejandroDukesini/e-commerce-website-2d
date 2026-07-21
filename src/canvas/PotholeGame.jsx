import { useEffect, useMemo, useRef, useState } from 'react';
import { useAnimationDriver } from '../hooks/useAnimationDriver';
import { createGame } from './game/potholeEngine';
import { renderGame } from './game/potholeRenderer';
import { Button } from '../components/ui/Button';

/**
 * Mini-game host. Engine + renderer are pure modules; this component wires
 * input, DPR sizing and the rAF driver, mirroring score into React state at a
 * low cadence (never per-frame).
 *
 * The driver runs with respectReducedMotion:false — a game is inherently
 * interactive motion, so the loop must run even for users who prefer reduced
 * motion elsewhere (it never auto-plays; it starts only on an explicit action).
 */
export function PotholeGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const game = useMemo(() => createGame(), []);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const hudAccum = useRef(0);
  const [, setTick] = useState(0);
  const [status, setStatus] = useState('idle');

  // DPR-correct sizing.
  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      size.current = { w: rect.width, h: rect.height, dpr };
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main loop — always runs while mounted.
  useAnimationDriver(
    (dt) => {
      game.update(dt);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const { w, h, dpr } = size.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderGame(ctx, game, w, h);
      }
      hudAccum.current += dt;
      if (hudAccum.current > 0.1) {
        hudAccum.current = 0;
        setTick((t) => (t + 1) % 1000);
        if (game.state.status !== status) setStatus(game.state.status);
      }
    },
    { respectReducedMotion: false }
  );

  const start = () => {
    game.reset();
    setStatus('playing');
    wrapRef.current?.focus();
  };

  // Keyboard — scoped to the focused game element (never hijacks page scroll).
  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'a', 'arrowright', 'd'].includes(k)) {
      e.preventDefault();
      game.move(k === 'arrowleft' || k === 'a' ? -1 : 1);
    } else if ((k === 'enter' || k === ' ') && game.state.status !== 'playing') {
      e.preventDefault();
      start();
    }
  };

  const pointerToLane = (clientX, target) => {
    if (game.state.status !== 'playing') return;
    const rect = target.getBoundingClientRect();
    game.pointerToLane((clientX - rect.left) / rect.width);
  };

  const s = game.state;

  return (
    <div className="game">
      <div
        className="game__canvas-wrap"
        ref={wrapRef}
        tabIndex={0}
        role="application"
        aria-label="Mini-juego Huecos de Colombia. Flechas izquierda/derecha o A y D para cambiar de carril."
        onKeyDown={onKeyDown}
        onPointerDown={(e) => pointerToLane(e.clientX, e.currentTarget)}
        onPointerMove={(e) => e.buttons && pointerToLane(e.clientX, e.currentTarget)}
        onTouchMove={(e) => { e.preventDefault(); pointerToLane(e.touches[0].clientX, e.currentTarget); }}
        onClick={() => status !== 'playing' && start()}
      >
        <canvas className="game__canvas" ref={canvasRef} role="img"
          aria-label="Carretera vista desde arriba con baches descendiendo" />

        {status !== 'playing' && (
          <div className="game__overlay">
            {status === 'idle' ? (
              <div>
                <h3>Huecos de Colombia</h3>
                <p>Esquiva los baches que bajan por la vía. ¿Cuántos metros aguantas sin caer?</p>
                <Button variant="primary" size="lg" onClick={(e) => { e.stopPropagation(); start(); }}>Comenzar</Button>
              </div>
            ) : (
              <div>
                <h3>¡Caíste en un hueco!</h3>
                <p>Distancia: <b>{Math.floor(s.score)} m</b> · Récord: <b>{s.best} m</b></p>
                <Button variant="primary" size="lg" onClick={(e) => { e.stopPropagation(); start(); }}>Reintentar</Button>
              </div>
            )}
          </div>
        )}

        {/* On-screen lane controls (mobile / no keyboard) */}
        {status === 'playing' && (
          <div className="game__controls" aria-hidden="true">
            <button className="game__ctrl" onPointerDown={(e) => { e.stopPropagation(); game.move(-1); }} aria-label="Izquierda">◀</button>
            <button className="game__ctrl" onPointerDown={(e) => { e.stopPropagation(); game.move(1); }} aria-label="Derecha">▶</button>
          </div>
        )}
      </div>

      <div className="game__hud">
        <div className="game__stat"><b>{Math.floor(s.score)} m</b><span>Distancia</span></div>
        <div className="game__stat"><b>{s.best} m</b><span>Récord</span></div>
        <p className="game__hint">◀ ▶ / A · D · o toca los lados</p>
      </div>
    </div>
  );
}
