import axios, { AxiosError } from 'axios';
import { AuthResponse, Zone, LocationUpdate } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      
      if (status === 401) {
        // Unauthorized - clear auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login/signup page
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/signup')) {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        console.error('Access forbidden');
      } else if (status === 429) {
        // Too many requests - rate limited
        console.error('Too many requests. Please try again later.');
      } else if (status >= 500) {
        console.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: (email: string | null, studentId: string | null, password: string, fullName: string) =>
    api.post<AuthResponse>('/auth/signup', { email, studentId, password, fullName }),
  login: (email: string, studentId: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, studentId, password }),
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Location APIs
export const locationAPI = {
  updateLocation: (update: LocationUpdate) =>
    api.post('/location/update', update),
  getCrowdStatus: () =>
    api.get<Zone[]>('/location/crowd'),
  getQuietestZone: () =>
    api.get<Zone>('/location/quiet'),
};

// Recommendation APIs
export const recommendationAPI = {
  getBestRecommendation: () =>
    api.get<Zone>('/recommend/best'),
  getRankedZones: () =>
    api.get<Zone[]>('/recommend/ranked'),
};

export default api;
