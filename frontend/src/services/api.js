// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
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

  getSaldo: async (pt = null) => {
    const response = await api.get('/kas-kecil/saldo', { 
      params: pt ? { pt } : {} 
    });
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

// Export default api instance untuk custom requests
export default api;