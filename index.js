import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const deviceId =
    localStorage.getItem('deviceId') ||
    'DEV_' + Math.random().toString(36).substr(2, 16).toUpperCase();

  localStorage.setItem('deviceId', deviceId);
  config.headers['x-device-id'] = deviceId;

  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: data => api.post('/api/auth/register', data),
  login: data => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: data => api.put('/api/auth/profile', data)
};

export const productAPI = {
  getAll: params => api.get('/api/products', { params }),
  getOne: id => api.get(`/api/products/${id}`),
  create: data => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: id => api.delete(`/api/products/${id}`),
  seed: () => api.post('/api/products/admin/seed')
};

export const cartAPI = {
  validate: items => api.post('/api/cart/validate', { items })
};

export const orderAPI = {
  create: data => api.post('/api/orders', data),
  getAll: () => api.get('/api/orders'),
  getOne: id => api.get(`/api/orders/${id}`)
};

export const paymentAPI = {
  initiate: data => api.post('/api/payment/initiate', data),
  verifyOTP: data => api.post('/api/payment/verify-otp', data),
  getTransaction: id => api.get(`/api/payment/transaction/${id}`)
};

export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getFraudLogs: params => api.get('/api/admin/fraud-logs', { params }),
  reviewFraudLog: (id, notes) =>
    api.put(`/api/admin/fraud-logs/${id}/review`, { notes })
};

export default api;