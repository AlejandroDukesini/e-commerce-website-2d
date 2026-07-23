import { AnimatePresence } from 'framer-motion';
import { CookieBanner } from './CookieBanner';
import { CookiePreferences } from './CookiePreferences';
import { useConsent } from '../../context/ConsentContext';

/**
 * Punto de montaje único del sistema de cookies. Colócalo una sola vez
 * dentro del árbol envuelto por <ConsentProvider> (p. ej. en el Layout).
 */
export function CookieConsent() {
  const { bannerOpen } = useConsent();

  return (
    <>
      <AnimatePresence>{bannerOpen && <CookieBanner />}</AnimatePresence>
      <CookiePreferences />
    </>
  );
}
