const TOKEN_KEY = 'vetcare_access_token';
const USER_KEY = 'vetcare_user';

export const tokenStorage = {
  saveSession(accessToken, user, roles) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (user) {

      const userToSave = { ...user, roles: roles || [] };
      localStorage.setItem(USER_KEY, JSON.stringify(userToSave));
    }
  },

  getSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    let user = null;
    
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
    
    return { token, user };
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  updateUser(partialUser) {
    const { user } = this.getSession();
    if (!user) return;
    const updated = { ...user, ...partialUser };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  },
  
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
};
