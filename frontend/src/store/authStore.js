import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: null,
  userId: null,
  isAuthenticated: false,

  login: (token, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId.toString());
    set({ token, userId: parseInt(userId, 10), isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    set({ token: null, userId: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      set({ token, userId: parseInt(userId, 10), isAuthenticated: true });
    } else {
      set({ token: null, userId: null, isAuthenticated: false });
    }
  }
}));
