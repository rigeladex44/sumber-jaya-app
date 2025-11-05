// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://sumber-jaya-app-production.up.railway.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - tambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle error globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('currentUserData');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICES ====================

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('currentUserData', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('currentUserData');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getCurrentUser: () => {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!sessionStorage.getItem('token');
  },
};

// ==================== PT SERVICES ====================

export const ptService = {
  getAll: async () => {
    const response = await api.get('/pt');
    return response.data;
  },
};

// ==================== KAS KECIL SERVICES ====================

export const kasKecilService = {
  getAll: async (params = {}) => {
    const response = await api.get('/kas-kecil', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/kas-kecil', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/kas-kecil/${id}/status`, { status });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/kas-kecil/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/kas-kecil/${id}`);
    return response.data;
  },

  transferSaldo: async () => {
    const response = await api.post('/kas-kecil/transfer-saldo');
    return response.data;
  },

  recalculateSaldo: async (startDate) => {
    const response = await api.post('/kas-kecil/recalculate-saldo', { startDate });
    return response.data;
  },

  getSaldo: async (pt = null) => {
    const response = await api.get('/kas-kecil/saldo', {
      params: pt ? { pt } : {}
    });
    return response.data;
  },
};

// ==================== ARUS KAS SERVICES ====================

export const arusKasService = {
  getAll: async (params = {}) => {
    const response = await api.get('/arus-kas', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/arus-kas', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/arus-kas/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/arus-kas/${id}`);
    return response.data;
  },
};

// ==================== SUB KATEGORI SERVICES ====================

export const subKategoriService = {
  getAll: async (jenis = null) => {
    const response = await api.get('/sub-kategori', {
      params: jenis ? { jenis } : {}
    });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/sub-kategori', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/sub-kategori/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/sub-kategori/${id}`);
    return response.data;
  },
};

// ==================== PENJUALAN SERVICES ====================

export const penjualanService = {
  getAll: async (params = {}) => {
    const response = await api.get('/penjualan', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/penjualan', data);
    return response.data;
  },

  getPangkalanList: async (pt = null) => {
    const response = await api.get('/pangkalan', {
      params: pt ? { pt } : {}
    });
    return response.data;
  },
};

// ==================== DASHBOARD SERVICES ====================

export const dashboardService = {
  getStats: async (pt = null) => {
    const response = await api.get('/dashboard/stats', {
      params: pt ? { pt } : {}
    });
    return response.data;
  },
};

// ==================== USER MANAGEMENT SERVICES ====================

export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// ==================== PROFILE SERVICES ====================

export const profileService = {
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/auth/password', data);
    return response.data;
  },
};

// Keep-alive service to prevent server sleep
export const keepAliveService = {
  ping: async () => {
    try {
      const response = await api.get('/keep-alive');
      return response.data;
    } catch (error) {
      console.error('Keep-alive ping failed:', error);
      return { status: 'ERROR', message: error.message };
    }
  }
};

// Export default api instance untuk custom requests
export default api;