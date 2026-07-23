import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { useConsent } from '../../context/ConsentContext';

/**
 * Banner flotante no invasivo (primera visita). Ofrece las tres acciones
 * primarias del RGPD con igual jerarquía visual: aceptar, rechazar, configurar.
 */
export function CookieBanner() {
  const { acceptAll, rejectNonEssential, openPreferences } = useConsent();

  return (
    <motion.aside
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-label="Aviso de cookies"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cookie-banner__body">
        <h2 className="cookie-banner__title">Respetamos tu privacidad</h2>
        <p className="cookie-banner__text">
          Usamos cookies propias y de terceros para el funcionamiento del sitio y,
          con tu permiso, para analítica y personalización. Puedes aceptarlas,
          rechazar las no esenciales o configurar tus preferencias. Consulta la{' '}
          <a href="/privacidad" className="cookie-banner__link">política de privacidad</a>.
        </p>
      </div>

      <div className="cookie-banner__actions">
        <Button variant="ghost" size="sm" onClick={openPreferences}>
          Configurar
        </Button>
        <Button variant="ghost" size="sm" onClick={rejectNonEssential}>
          Rechazar no esenciales
        </Button>
        <Button variant="brand" size="sm" onClick={acceptAll}>
          Aceptar todas
        </Button>
      </div>
    </motion.aside>
  );
}
