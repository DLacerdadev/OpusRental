import axios from 'axios';
import { toast } from '@/hooks/use-toast';

// Global token storage (in memory only)
let globalAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  globalAuthToken = token;
  console.log('[API] Token set:', token ? 'Success' : 'Cleared');
}

export function getAuthToken(): string | null {
  return globalAuthToken;
}

// Create Axios instance
const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to ALL requests automatically
api.interceptors.request.use(
  (config) => {
    if (globalAuthToken) {
      config.headers.Authorization = `Bearer ${globalAuthToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      globalAuthToken = null;
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast({
        title: 'Access Denied',
        description: "You don't have permission to access this resource.",
        variant: 'destructive',
      });
    }
    return Promise.reject(error);
  }
);

export default api;
