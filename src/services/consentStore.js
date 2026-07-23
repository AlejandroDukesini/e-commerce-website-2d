/**
 * Capa de persistencia del consentimiento de cookies (RGPD).
 * - Fuente de verdad en localStorage + espejo en cookie (SameSite=Lax; Secure).
 * - Versionado: si cambian las categorías/política, se invalida y se vuelve a pedir.
 * - Sin dependencias, mismo estilo que `tokenStore` (apiClient.js).
 */

// Sube este número cuando cambie la política o el set de categorías:
// las decisiones antiguas se descartan y el banner reaparece.
export const CONSENT_VERSION = 1;

const STORAGE_KEY = 'adc_cookie_consent';
const COOKIE_NAME = 'adc_cookie_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 días

/**
 * Categorías soportadas. `necessary` es siempre `true` y no se puede desactivar
 * (base legal: interés legítimo / funcionamiento del sitio).
 */
export const CATEGORIES = [
  {
    id: 'necessary',
    label: 'Necesarias',
    locked: true,
    description:
      'Imprescindibles para el funcionamiento del sitio: sesión, seguridad y ' +
      'preferencias básicas. No pueden desactivarse.',
  },
  {
    id: 'preferences',
    label: 'Preferencias',
    locked: false,
    description:
      'Recuerdan tus elecciones (idioma, tema claro/oscuro, región) para ' +
      'personalizar tu experiencia.',
  },
  {
    id: 'analytics',
    label: 'Analíticas',
    locked: false,
    description:
      'Nos ayudan a entender de forma agregada y anónima cómo se usa el sitio ' +
      'para mejorarlo (p. ej. Google Analytics, Hotjar).',
  },
  {
    id: 'marketing',
    label: 'Publicitarias',
    locked: false,
    description:
      'Permiten mostrar anuncios relevantes y medir campañas ' +
      '(p. ej. Meta Pixel, Google Ads).',
  },
];

/** Estado por defecto: solo lo estrictamente necesario. */
export function defaultConsent() {
  return {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  };
}

/** Marca todas las categorías (Aceptar todas). */
export function allGranted() {
  return { necessary: true, preferences: true, analytics: true, marketing: true };
}

/** Normaliza un objeto arbitrario a un mapa de categorías válido y booleano. */
function normalize(categories = {}) {
  const base = defaultConsent();
  for (const { id, locked } of CATEGORIES) {
    base[id] = locked ? true : Boolean(categories[id]);
  }
  return base;
}

// --- Espejo en cookie (para que el backend/edge pueda leer la decisión) ---

function writeCookie(value) {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      `${COOKIE_NAME}=${encodeURIComponent(value)}` +
      `; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  } catch {
    /* entornos sin document (SSR/tests): ignorar */
  }
}

function clearCookie() {
  try {
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/**
 * Lee la decisión guardada. Devuelve `null` si no existe o si la versión
 * quedó obsoleta (en cuyo caso el banner debe volver a mostrarse).
 */
export function readConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      timestamp: parsed.timestamp,
      categories: normalize(parsed.categories),
    };
  } catch {
    return null;
  }
}

/** Persiste la decisión en localStorage + cookie. Devuelve el registro guardado. */
export function saveConsent(categories) {
  const record = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: normalize(categories),
  };
  const serialized = JSON.stringify(record);
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    /* modo privado / cuota: la cookie actúa como respaldo */
  }
  writeCookie(serialized);
  return record;
}

/** Borra por completo la decisión (útil para un botón "revocar todo"). */
export function clearConsent() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  clearCookie();
}
