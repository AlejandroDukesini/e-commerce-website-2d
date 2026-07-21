import { api, tokenStore } from './apiClient';

export const authService = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    tokenStore.set(data.access_token);
    return data.user;
  },

  async register({ full_name, email, password, role }) {
    const data = await api.post('/auth/register', { full_name, email, password, role });
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
