import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CATEGORIES,
  allGranted,
  clearConsent,
  defaultConsent,
  readConsent,
  saveConsent,
} from '../services/consentStore';
import { applyConsent, initConsentMode } from '../services/consentScripts';

/**
 * Estado global de consentimiento de cookies.
 * - Decide si mostrar el banner (primera visita / política obsoleta).
 * - Persiste decisiones y dispara la carga condicional de scripts.
 * - Expone `openPreferences()` para reabrir el panel desde cualquier lugar
 *   (footer) y también como función global `window.openCookiePreferences`.
 */
const ConsentContext = createContext(null);

export function ConsentProvider({ children }) {
  // Consent Mode denegado por defecto ANTES de renderizar/cargar nada.
  const bootstrapped = useRef(false);
  if (!bootstrapped.current) {
    initConsentMode();
    bootstrapped.current = true;
  }

  const [saved, setSaved] = useState(() => readConsent()); // registro o null
  const [categories, setCategories] = useState(
    () => saved?.categories ?? defaultConsent()
  );
  const [bannerOpen, setBannerOpen] = useState(() => saved === null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  // Aplica la decisión guardada al montar (scripts + consent mode).
  useEffect(() => {
    if (saved) applyConsent(saved.categories);
    // solo al montar: cambios posteriores se aplican en cada acción
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((next) => {
    const record = saveConsent(next);
    setSaved(record);
    setCategories(record.categories);
    applyConsent(record.categories);
    setBannerOpen(false);
    setPrefsOpen(false);
  }, []);

  const acceptAll = useCallback(() => persist(allGranted()), [persist]);
  const rejectNonEssential = useCallback(() => persist(defaultConsent()), [persist]);
  const savePreferences = useCallback((cats) => persist(cats), [persist]);

  const openPreferences = useCallback(() => {
    setCategories(saved?.categories ?? defaultConsent());
    setPrefsOpen(true);
  }, [saved]);

  const closePreferences = useCallback(() => setPrefsOpen(false), []);

  const revoke = useCallback(() => {
    clearConsent();
    setSaved(null);
    setCategories(defaultConsent());
    setPrefsOpen(false);
    setBannerOpen(true);
  }, []);

  // Función global + evento para reabrir preferencias (footer, enlaces, etc.).
  useEffect(() => {
    window.openCookiePreferences = openPreferences;
    const handler = () => openPreferences();
    window.addEventListener('cookie:open-preferences', handler);
    return () => {
      if (window.openCookiePreferences === openPreferences) {
        delete window.openCookiePreferences;
      }
      window.removeEventListener('cookie:open-preferences', handler);
    };
  }, [openPreferences]);

  const value = useMemo(
    () => ({
      categories: saved?.categories ?? categories,
      decided: saved !== null,
      timestamp: saved?.timestamp ?? null,
      bannerOpen,
      prefsOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences,
      closePreferences,
      revoke,
      CATEGORIES,
    }),
    [
      saved,
      categories,
      bannerOpen,
      prefsOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences,
      closePreferences,
      revoke,
    ]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent debe usarse dentro de <ConsentProvider>');
  return ctx;
}
