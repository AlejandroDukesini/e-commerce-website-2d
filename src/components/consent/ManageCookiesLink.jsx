import { useConsent } from '../../context/ConsentContext';

/**
 * Enlace para reabrir el panel de preferencias en cualquier momento.
 * Pensado para el footer (exigido por el RGPD: consentimiento revocable).
 */
export function ManageCookiesLink({ className = '' }) {
  const { openPreferences } = useConsent();
  return (
    <button type="button" className={className} onClick={openPreferences}>
      Preferencias de cookies
    </button>
  );
}
