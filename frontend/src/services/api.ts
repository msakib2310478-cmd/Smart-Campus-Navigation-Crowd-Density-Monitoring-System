import axios from 'axios';
import { AuthResponse, Zone, LocationUpdate } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: (email: string, studentId: string, password: string, fullName: string) =>
    api.post<AuthResponse>('/auth/signup', { email, studentId, password, fullName }),
  login: (email: string, studentId: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, studentId, password }),
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
