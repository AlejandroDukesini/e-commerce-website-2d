/**
 * Carga condicional y segura de scripts de terceros, gobernada por consentimiento.
 *
 * Modelo de seguridad (anti-XSS):
 *  - NUNCA se usa innerHTML, eval, ni se inyectan cadenas de origen dinámico.
 *  - Las integraciones son un REGISTRO ESTÁTICO definido en código (allowlist).
 *    Cada una expone un `load()` que crea nodos <script> con `createElement`
 *    y asigna `src` solo desde URLs literales de confianza.
 *  - Un tercero nuevo = una entrada revisada aquí, no datos en runtime.
 *
 * Cada integración corre a lo sumo una vez; al retirar el consentimiento se
 * recomienda recargar (las cookies de terceros ya escritas se limpian aparte).
 */

/** Inyecta un <script src> de forma segura. Idempotente por `id`. */
export function injectScript({ src, id, async = true, defer = false, attrs = {} }) {
  if (id && document.getElementById(id)) return document.getElementById(id);
  const el = document.createElement('script');
  if (id) el.id = id;
  el.src = src; // URL literal proveniente del registro estático de abajo
  el.async = async;
  el.defer = defer;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  document.head.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// Integración de ejemplo: Google Analytics 4 (gtag.js) con Consent Mode v2.
// ---------------------------------------------------------------------------

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/** Cola de gtag disponible incluso antes de cargar el script remoto. */
function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
  }
  return window.gtag;
}

/**
 * Fija los defaults de Consent Mode a "denegado" ANTES de cualquier hit.
 * Debe llamarse pronto (bootstrap), aunque el usuario aún no decida: así
 * gtag, si llegara a cargarse, no envía datos hasta el `update`.
 */
export function initConsentMode() {
  if (!GA_ID) return;
  const gtag = ensureGtag();
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    wait_for_update: 500,
  });
}

/** Traduce nuestras categorías al formato de Consent Mode y actualiza gtag. */
export function syncConsentMode(categories) {
  if (!GA_ID || !window.gtag) return;
  const grant = (ok) => (ok ? 'granted' : 'denied');
  window.gtag('consent', 'update', {
    analytics_storage: grant(categories.analytics),
    ad_storage: grant(categories.marketing),
    ad_user_data: grant(categories.marketing),
    ad_personalization: grant(categories.marketing),
    functionality_storage: grant(categories.preferences),
    personalization_storage: grant(categories.preferences),
  });
}

/** Carga el script real de GA4 (solo tras consentimiento de analíticas). */
function loadGA4() {
  if (!GA_ID) {
    console.info('[cookies] VITE_GA_MEASUREMENT_ID no definido; se omite GA4.');
    return;
  }
  const gtag = ensureGtag();
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });
  injectScript({
    id: 'ga4-gtag',
    src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`,
  });
}

// ---------------------------------------------------------------------------
// Registro estático de integraciones (allowlist). Añade terceros AQUÍ.
// ---------------------------------------------------------------------------

/**
 * @type {Array<{ id: string, category: string, load: () => void }>}
 */
export const integrations = [
  { id: 'ga4', category: 'analytics', load: loadGA4 },

  // Ejemplos para replicar el patrón (descomenta y crea su `load`):
  // { id: 'meta-pixel', category: 'marketing', load: loadMetaPixel },
  // { id: 'hotjar',     category: 'analytics', load: loadHotjar },
];

const fired = new Set();

/**
 * Ejecuta las integraciones cuya categoría esté concedida y aún no se hayan
 * disparado. Además sincroniza Consent Mode con la decisión actual.
 * Idempotente: llámalo cada vez que cambie el consentimiento.
 */
export function applyConsent(categories) {
  syncConsentMode(categories);
  for (const item of integrations) {
    if (categories[item.category] && !fired.has(item.id)) {
      fired.add(item.id);
      try {
        item.load();
      } catch (err) {
        console.error(`[cookies] Falló la integración "${item.id}":`, err);
        fired.delete(item.id); // permite reintento en el próximo cambio
      }
    }
  }
}
