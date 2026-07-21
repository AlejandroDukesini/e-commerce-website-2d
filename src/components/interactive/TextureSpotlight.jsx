import { SpotlightReveal } from './SpotlightReveal';
import { useResourceManifest } from '../../hooks/useTextureLoader';

/**
 * The "Texturas interactivas" showcase: a grid of texture tiles wrapped in a
 * single SpotlightReveal. Real photos are used automatically if the user drops
 * files named `textura-1..5` into src/resources/; otherwise elegant procedural
 * tiles stand in (empty-template friendly).
 */
const TILES = [
  { key: 'textura-1', hue: 38, title: 'Diseño exterior', tag: 'Líneas que cortan el viento' },
  { key: 'textura-2', hue: 28, title: 'Interior premium', tag: 'Confort en cada trayecto' },
  { key: 'textura-3', hue: 44, title: 'Tecnología a bordo', tag: 'Conectividad total' },
  { key: 'textura-4', hue: 22, title: 'Seguridad activa', tag: 'Te cuida sin que lo notes' },
  { key: 'textura-5', hue: 40, title: 'Eficiencia', tag: 'Más camino por menos' },
];

export function TextureSpotlight(props) {
  const manifest = useResourceManifest();

  return (
    <SpotlightReveal
      maskSize={320}
      intensity={62}
      dimOpacity={0.38}
      brightContrast={1.22}
      {...props}
    >
      <div className="tex-grid">
        {TILES.map((t) => {
          const src = manifest[t.key];
          return (
            <figure className="tex-tile" key={t.key} data-texture={src ? undefined : ''} style={{ '--th': t.hue }}>
              {src && <img src={src} alt={t.title} loading="lazy" decoding="async" />}
              <figcaption className="tex-tile__label">
                <h3>{t.title}</h3>
                <p>{t.tag}</p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </SpotlightReveal>
  );
}
