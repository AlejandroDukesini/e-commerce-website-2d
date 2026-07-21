import MagneticGrid from './MagneticGrid';
import { useResourceGroups, preferWebp } from '../../hooks/useTextureLoader';
import { useInView } from '../../hooks/useInView';

/**
 * "Texturas interactivas" showcase built on MagneticGrid (Dot Image Reveal).
 * Each tile has an EXPLICIT height so the grid's ResizeObserver + canvas size
 * correctly. Images resolve WebP-first with a PNG fallback via preferWebp().
 * The canvas loops are deferred until the section first scrolls into view.
 */
// Keys map to files under src/resources/vehicles/ (WebP + generated PNG fallback).
const TILES = [
  { key: 'audo-a3', title: 'Audi A3', tag: 'Deportividad refinada' },
  { key: 'chevrolet-tracker', title: 'Chevrolet Tracker', tag: 'Versatilidad urbana' },
  { key: 'mazda-cx5', title: 'Mazda CX-5', tag: 'Diseño KODO' },
];

export function MagneticTextures() {
  const groups = useResourceGroups();
  const [ref, inView] = useInView({ threshold: 0.1, once: true });

  return (
    <div className="magnetic-grid-section" ref={ref}>
      {TILES.map((t) => {
        const { src, fallback } = preferWebp(groups[t.key]);
        return (
          <figure className="magnetic-tile" key={t.key}>
            {inView && (
              <MagneticGrid
                image={{ src, fallback, alt: t.title }}
                dots={14}
                gap={10}
                radius={170}
                intensity={9}
                color="#c6a15b"
              />
            )}
            <figcaption className="magnetic-tile__label">
              <h3>{t.title}</h3>
              <p>{t.tag}</p>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
