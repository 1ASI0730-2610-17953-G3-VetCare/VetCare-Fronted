import { defineStore } from 'pinia';
import { IamApi } from '../infrastructure/iam-api';
import { tokenStorage } from '../infrastructure/token-storage';

export const useIamStore = defineStore('iam', {
  state: () => ({
    session: {
      token: null,
      user: null,
      roles: []
    },
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.session.token,
    user: (state) => state.session.user,
    roles: (state) => state.session.roles
  },

  actions: {
    async login(credentials) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await IamApi.login(credentials);
        

        const { accessToken, user, roles } = response;
        
        this.session.token = accessToken;
        this.session.user = user;
        this.session.roles = roles || [];
        
        tokenStorage.saveSession(accessToken, user, roles);
        
        return true;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al iniciar sesión';
        console.error('Login error:', err);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      this.isLoading = true;
      try {
        await IamApi.logout();
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        this.session.token = null;
        this.session.user = null;
        this.session.roles = [];
        tokenStorage.clearSession();
        this.isLoading = false;
      }
    },

    restoreSession() {
      const { token, user } = tokenStorage.getSession();
      if (token) {
        this.session.token = token;
        this.session.user = user;

        this.session.roles = user?.roles || [];
      }
    }
  }
});
