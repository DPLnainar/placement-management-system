import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
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

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors or no response
    if (!error.response) {
      console.error('Network error or no response:', error);
      error.message = 'Network error. Please check your connection.';
      return Promise.reject(error);
    }

    // Handle authentication errors - but exclude login/register endpoints
    const isLoginEndpoint = error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isLoginEndpoint) {
      console.warn('Authentication failed - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Create a custom error to prevent JSON parse issues
      const authError = new Error('Session expired. Please login again.');
      authError.isAuthError = true;

      setTimeout(() => {
        window.location.href = '/';
      }, 100);

      return Promise.reject(authError);
    }

    // Handle JSON parse errors in response
    if (error.message && error.message.includes('JSON')) {
      console.error('JSON parse error:', error);
      error.message = 'Server returned invalid response. Please try again.';
    }

    return Promise.reject(error);
  }
);

// College API
export const collegeAPI = {
  getAll: () => api.get('/colleges'),
  getById: (id) => api.get(`/colleges/${id}`),
  create: (data) => api.post('/colleges', data),
  delete: (id) => api.delete(`/colleges/${id}`),
};

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  registerInvited: (data) => api.post('/auth/register-invited', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Invitation API
export const invitationAPI = {
  create: (data) => api.post('/invitations', data),
  createBulk: (data) => api.post('/invitations/bulk', data),
  getAll: (status = null) => api.get('/invitations', { params: { status } }),
  verify: (token) => api.get(`/public/verify/${token}`),
  resend: (id) => api.post(`/invitations/${id}/resend`),
  cancel: (id) => api.delete(`/invitations/${id}`),
};

// Public API
export const publicAPI = {
  getColleges: () => api.get('/public/colleges'),
};

// Job API
export const jobAPI = {
  getAll: (status = null) => api.get('/jobs', { params: { status } }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

// User API
export const userAPI = {
  getAll: (role = null) => api.get('/users', { params: { role } }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  approve: (id, isApproved) => api.put(`/users/${id}/approve`, null, { params: { isApproved } }),
  updateStatus: (id, isActive) => api.put(`/users/${id}/status`, { status: isActive ? 'active' : 'inactive' }),
  delete: (id) => api.delete(`/users/${id}`),
};

// Application API
export const applicationAPI = {
  create: (data) => api.post('/applications', data),
  getAll: (jobId = null) => api.get('/applications', { params: { jobId } }),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, null, { params: { status } }),
};

// Eligibility API
export const eligibilityAPI = {
  checkEligibility: (jobId) => api.get(`/eligibility/check/${jobId}`),
  getEligibleJobs: (params = {}) => api.get('/eligibility/eligible-jobs', { params }),
  getJobRecommendations: (limit = 10) => api.get('/eligibility/recommendations', { params: { limit } }),
  bulkCheck: (data) => api.post('/eligibility/bulk-check', data),
};

// Student Preferences API
export const preferencesAPI = {
  getFilters: () => {
    const saved = localStorage.getItem('studentFilters');
    return Promise.resolve({ data: saved ? JSON.parse(saved) : {} });
  },
  saveFilters: (data) => {
    localStorage.setItem('studentFilters', JSON.stringify(data));
    return Promise.resolve({ data });
  },
  getNotificationSettings: () => {
    const saved = localStorage.getItem('notificationSettings');
    return Promise.resolve({ data: saved ? JSON.parse(saved) : { email: true, push: false } });
  },
  updateNotificationSettings: (data) => {
    localStorage.setItem('notificationSettings', JSON.stringify(data));
    return Promise.resolve({ data });
  },
};

// Notifications API (mock for now)
export const notificationAPI = {
  getAll: (params = {}) => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return Promise.resolve({ data: notifications });
  },
  markAsRead: (id) => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('notifications', JSON.stringify(updated));
    return Promise.resolve({ data: { success: true } });
  },
  markAllAsRead: () => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(updated));
    return Promise.resolve({ data: { success: true } });
  },
  delete: (id) => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem('notifications', JSON.stringify(updated));
    return Promise.resolve({ data: { success: true } });
  },
};

// Upload API
export const uploadAPI = {
  uploadResume: (formData) => api.post('/upload/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadPhoto: (formData) => api.post('/upload/photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadDocument: (formData) => api.post('/upload/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getUserFiles: () => api.get('/upload/files'),
  deleteResume: () => api.delete('/upload/resume'),
};

export default api;
