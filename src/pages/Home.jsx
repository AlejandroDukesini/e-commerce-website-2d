import { Suspense, lazy, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Reveal } from '../components/ui/Reveal';
import { Spinner } from '../components/ui/Spinner';
import { HeroVideo } from '../components/home/HeroVideo';
import { ScrollCarBackground } from '../components/home/ScrollCarBackground';
import { DeliveryStandards } from '../components/home/DeliveryStandards';
import { VehicleCard } from '../components/vehicles/VehicleCard';
import { VehicleModal } from '../components/vehicles/VehicleModal';
import { catalogService } from '../services/catalogService';

// Heavy interactive modules are code-split and mounted lazily (canvas engines
// stay out of the initial/LCP bundle).
const PotholeGame = lazy(() =>
  import('../canvas/PotholeGame').then((m) => ({ default: m.PotholeGame }))
);
const MagneticTextures = lazy(() =>
  import('../components/interactive/MagneticTextures').then((m) => ({ default: m.MagneticTextures }))
);

const PROPS = [
  { num: '01', title: 'Garantía sin letra pequeña', text: 'Hasta 5 años o 100.000 km. Cada auto supera 150 puntos de revisión.' },
  { num: '02', title: 'Financiación a tu medida', text: 'Estructuramos tu plan con aliados de primer nivel. Aprobación discreta y ágil.' },
  { num: '03', title: 'Recibimos tu vehículo', text: 'Avalúo justo y transparente. Estrena sin fricciones ni sorpresas.' },
];

const QUOTES = [
  { text: 'Me atendieron sin presión y salí con el auto de mis sueños. Un proceso impecable.', by: 'Laura Restrepo', role: 'Medellín' },
  { text: 'La financiación se ajustó a mi bolsillo. Volvería a comprar aquí sin dudarlo.', by: 'Andrés Gómez', role: 'Bogotá' },
  { text: 'Recibieron mi usado a muy buen precio y estrené el mismo día. Excelente.', by: 'Camila Ríos', role: 'Cali' },
];

export function Home() {
  const [featured, setFeatured] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    catalogService
      .list({ featured: true, sort: 'relevance' }, { signal: ctrl.signal })
      .then((data) => setFeatured(data.items.slice(0, 3)))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  return (
    <>
      {/* Scroll-driven car lives behind everything */}
      <ScrollCarBackground />

      <div className="app-content">
        {/* ---------- HERO (video) ---------- */}
        <section className="hero">
          <HeroVideo />
          <div className="hero__overlay" aria-hidden="true" />
          <div className="container hero__inner">
            <span className="eyebrow">Casa automotriz · desde 2010</span>
            <h1 className="hero__title">
              El automóvil<br />es solo el <em>principio</em><br />del camino.
            </h1>
            <p className="hero__sub">
              Una colección curada de vehículos nuevos y seminuevos, entregados con un
              estándar que no verás en otro lugar. Bienvenido a Autos del Camino.
            </p>
            <div className="hero__cta">
              <Button to="/catalogo" variant="primary" size="lg">Explorar la colección</Button>
              <Button href="#entrega" variant="ghost" size="lg" style={{ color: '#f6f3ec', borderColor: 'rgba(246,243,236,0.35)' }}>
                Nuestro estándar
              </Button>
            </div>
            <div className="hero__stats">
              <div className="hero__stat"><b>2.400+</b><span>entregas</span></div>
              <div className="hero__stat"><b>4.9/5</b><span>satisfacción</span></div>
              <div className="hero__stat"><b>15 años</b><span>de trayectoria</span></div>
            </div>
          </div>
          <div className="hero__scroll-cue" aria-hidden="true">Desliza</div>
        </section>

        {/* ---------- TRUST BAR ---------- */}
        <div className="container">
          <div className="trustbar">
            <span>◆ Concesionario del año 2025</span>
            <span>◆ Postventa certificada</span>
            <span>◆ 40+ modelos</span>
            <span>◆ Aliados financieros</span>
          </div>
        </div>

        {/* ---------- VALUE PROPS ---------- */}
        <section className="section container">
          <div className="section-head">
            <span className="eyebrow">Por qué elegirnos</span>
            <div className="rule" />
            <h2 className="section-title">Comprar un auto, elevado a experiencia</h2>
            <p>Quitamos la fricción y añadimos criterio: precios claros, procesos discretos y un equipo que acompaña, nunca presiona.</p>
          </div>
          <div className="props">
            {PROPS.map((p) => (
              <div className="prop" key={p.num}>
                <span className="prop__num">{p.num}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- FEATURED ---------- */}
        <section className="section container">
          <div className="section-head section-head--split">
            <div>
              <span className="eyebrow">Selección destacada</span>
              <div className="rule" />
              <h2 className="section-title">Piezas que merecen una segunda mirada</h2>
            </div>
            <Button to="/catalogo" variant="ghost">Ver toda la colección</Button>
          </div>
          {featured.length === 0 ? (
            <div className="empty-state">Cargando destacados… (¿backend en el puerto 8081?)</div>
          ) : (
            <div className="vgrid">
              {featured.map((v) => (
                <Reveal key={v.id}><VehicleCard vehicle={v} onDetails={setSelected} /></Reveal>
              ))}
            </div>
          )}
        </section>

        {/* ---------- INTERACTIVE TEXTURES ---------- */}
        <section className="section container">
          <div className="section-head">
            <span className="eyebrow">Texturas interactivas</span>
            <div className="rule" />
            <h2 className="section-title">Pasa el cursor. Siente el detalle.</h2>
            <p>Mueve el cursor sobre cada superficie: una malla magnética de puntos revela la textura real del material bajo tu cursor.</p>
          </div>
          <Suspense fallback={<div className="magnetic-grid-section" aria-hidden="true" />}>
            <MagneticTextures />
          </Suspense>
          <span className="spotlight-hint">✦ Mueve el cursor sobre las texturas</span>
        </section>

        {/* ---------- MINI-GAME ---------- */}
        <section id="juego" className="section container">
          <div className="game-intro">
            <div>
              <span className="eyebrow">Un guiño muy nuestro</span>
              <div className="rule" />
              <h2 className="section-title">¿Le tienes el ojo a los huecos?</h2>
              <p className="lead">
                Mientras eliges tu próximo auto, pon a prueba tus reflejos esquivando los
                famosos baches de nuestras vías. Con la suspensión adecuada, los sentirás
                mucho menos.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-4)' }}>
                Controles: ← → o A / D para cambiar de carril · botones en pantalla o toca los lados en móvil.
              </p>
            </div>
            <Suspense fallback={<div className="game flex-center" style={{ aspectRatio: '16/9' }}><Spinner /></div>}>
              <PotholeGame />
            </Suspense>
          </div>
        </section>

        {/* ---------- TESTIMONIALS ---------- */}
        <section className="section container">
          <div className="section-head">
            <span className="eyebrow">Historias reales</span>
            <div className="rule" />
            <h2 className="section-title">Quienes ya viven su camino</h2>
          </div>
          <div className="quotes">
            {QUOTES.map((q, i) => (
              <Reveal key={q.by} className="quote" delay={i * 90}>
                <p>“{q.text}”</p>
                <div className="quote__by">
                  <b>{q.by}</b>
                  <span>{q.role}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- FINALE: parking + delivery standards (pre-footer) ---------- */}
        <div id="contacto">
          <DeliveryStandards />
        </div>
      </div>

      <VehicleModal vehicle={selected} onClose={() => setSelected(null)} />
    </>
  );
}
