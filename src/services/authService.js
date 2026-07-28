import { api, tokenStore } from './apiClient';

export const authService = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    tokenStore.set(data.access_token);
    return data.user;
  },

  // SECURITY: `role` is intentionally not sent and not accepted. The server
  // assigns `cliente` to every self-registration; it rejects a role in the
  // body outright, so forwarding one here would just produce a 422.
  async register({ full_name, email, password }) {
    const data = await api.post('/auth/register', { full_name, email, password });
    tokenStore.set(data.access_token);
    return data.user;
  },

  async me() {
    return api.get('/auth/me', { auth: true });
  },

  logout() {
    tokenStore.clear();
  },

  isAuthenticated() {
    return Boolean(tokenStore.get());
  },
};
