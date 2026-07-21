import { useInView } from '../../hooks/useInView';
import { LuxuryCar } from './LuxuryCar';
import { Button } from '../ui/Button';

const STANDARDS = [
  { mark: 'I', title: 'Inspección de 150 puntos', text: 'Cada unidad se audita a fondo antes de tocar tus manos.' },
  { mark: 'II', title: 'Detailing de concurso', text: 'Entrega impecable: pulido, cerámica y interior como nuevo.' },
  { mark: 'III', title: 'Entrega de guante blanco', text: 'Tu auto te espera bajo reflector, con lazo y documentación lista.' },
  { mark: 'IV', title: 'Garantía y respaldo', text: 'Hasta 5 años de tranquilidad y postventa certificada.' },
];

/**
 * Pre-footer finale: the car "parks" and the premium delivery-standard cards
 * rise into view. Driven by IntersectionObserver — animation only fires when
 * the section is actually reached (matches the scrolling car's arrival).
 */
export function DeliveryStandards() {
  const [ref, inView] = useInView({ threshold: 0.25 });

  return (
    <section id="entrega" className={`finale ${inView ? 'is-parked' : ''}`} ref={ref}>
      <div className="container">
        <div className="finale__head">
          <span className="eyebrow">El estándar de entrega</span>
          <div className="rule rule--center" />
          <h2 className="section-title section-title--center" style={{ maxWidth: '22ch' }}>
            No entregamos autos. Entregamos una promesa.
          </h2>
        </div>

        <div className="finale__stage" aria-hidden="true">
          <LuxuryCar variant="solid" className="finale__car" title="Automóvil parqueado en entrega" />
        </div>

        <div className="delivery-cards">
          {STANDARDS.map((s) => (
            <article className="delivery-card" key={s.mark}>
              <span className="delivery-card__mark">{s.mark}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>

        <div className="finale__cta">
          <h2>Tu lugar en la carretera te espera.</h2>
          <p>Agenda una prueba de manejo privada o explora la colección completa. Sin prisa, sin presión.</p>
          <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button to="/catalogo" variant="primary" size="lg">Explorar la colección</Button>
            <Button href="#contacto" variant="ghost" size="lg">Agendar cita</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
