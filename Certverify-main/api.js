import axios from 'axios';

// ── Central API Configuration ──
// We create a custom Axios instance here. Axios is a library used to make HTTP requests
// to our backend server (e.g., getting data, logging in, uploading files).
const api = axios.create({
  // Use the API URL from our environment variables, or default to '/api' if not set
  baseURL: process.env.REACT_APP_API_URL || '/api',
  // By default, we are sending and receiving JSON data
  headers: { 'Content-Type': 'application/json' },
  // If a request takes longer than 15 seconds, give up and throw an error
  timeout: 15000,
});

// ── Request Interceptor (Before a request leaves the browser) ──
// Every single time we ask the server for anything, this block of code runs first.
api.interceptors.request.use(
  (config) => {
    // Check if the user is logged in by looking for their security token
    const token = localStorage.getItem('cv_token');
    // If they have one, attach it to the request like a digital ID card
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor (Before a response reaches our components) ──
// Every single time the server replies, this block of code runs first.
api.interceptors.response.use(
  (response) => response, // If the request was successful, just pass the data along
  (error) => {
    // If the server returns a 401 Unauthorized error (meaning the token is fake or expired)
    if (error.response?.status === 401) {
      // Delete their invalid data
      localStorage.removeItem('cv_token');
      localStorage.removeItem('cv_user');
      // If they aren't already on the login page, redirect them there violently
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    // Pass the error down so the component can show a red warning toast
    return Promise.reject(error);
  }
);

// ── Authentication Endpoints ──
// Grouping our API calls makes them easier to find and use in our components
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'), // Used purely to verify the JWT token
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Certificate Data Endpoints ──
export const certService = {
  verify: (id) => api.get(`/certificates/verify/${id}`), // The public search endpoint
  getAll: (params) => api.get('/certificates', { params }), // Admin dashboard
  create: (data) => api.post('/certificates', data),
  update: (id, data) => api.put(`/certificates/${id}`, data),
  delete: (id) => api.delete(`/certificates/${id}`),
  getStats: () => api.get('/certificates/stats'), // Used for the "Total Certificates" counter
};

// ── Admin-Only Endpoints ──
export const adminService = {
  // Bulk Upload requires a special format called "multipart/form-data" 
  // because we are literally transmitting a physical Excel file, not just JSON text.
  bulkUpload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/admin/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getUsers: () => api.get('/admin/users'),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`), // suspend/unsuspend an account
  getDashboard: () => api.get('/admin/dashboard'), // Admin stats
};

export default api;
