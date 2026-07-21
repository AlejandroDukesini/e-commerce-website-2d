import { api } from './apiClient';

/** Build a querystring, skipping empty/null values. */
function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined && v !== false) q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const catalogService = {
  list(filters, opts) {
    return api.get(`/catalog${toQuery(filters)}`, opts);
  },
  getById(id, opts) {
    return api.get(`/catalog/${id}`, opts);
  },
};

/** Format a COP price compactly (e.g. $118.000.000). */
export function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}
