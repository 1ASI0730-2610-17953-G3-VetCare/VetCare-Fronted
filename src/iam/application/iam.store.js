import { defineStore } from 'pinia';
import { IamApi } from '../infrastructure/iam-api';
import { tokenStorage } from '../infrastructure/token-storage';
import { normalizeRoles } from '../infrastructure/normalize-roles.js';
import { BaseApi } from '@/shared/infrastructure/base-api.js';

export const useIamStore = defineStore('iam', {
  state: () => ({
    session: {
      token: null,
      user: null,
      roles: []
    },
    avatarVersion: 0,
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
        const normalizedRoles = normalizeRoles(roles);
        
        this.session.token = accessToken;
        this.session.user = user;
        this.session.roles = normalizedRoles;
        
        tokenStorage.saveSession(accessToken, user, normalizedRoles);
        
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
        this.session.roles = normalizeRoles(user?.roles);
      }
    },

    async verifySession() {
      if (!this.session.token) return false;
      try {
        const data = await IamApi.verify();
        const serverRoles = normalizeRoles(data.roles);
        this.session.roles = serverRoles;
        tokenStorage.saveSession(this.session.token, this.session.user, serverRoles);
        return true;
      } catch {
        this.session.token = null;
        this.session.user = null;
        this.session.roles = [];
        tokenStorage.clearSession();
        return false;
      }
    },

    setAvatarUrl(avatarUrl) {
      if (!this.session.user) return;
      this.avatarVersion += 1;
      this.session.user = { ...this.session.user, avatarUrl };
      tokenStorage.updateUser({ avatarUrl });
    },

    async loadAvatarFromProfile() {
      if (!this.session.token) return;
      try {
        const response = await BaseApi.get('/profile');
        const avatarUrl = response.data.avatarUrl ?? response.data.AvatarUrl ?? null;
        if (avatarUrl) {
          this.setAvatarUrl(avatarUrl);
        }
      } catch (error) {
        console.error('Failed to load profile avatar:', error);
      }
    }
  }
});
