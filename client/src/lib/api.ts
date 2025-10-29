import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import i18n from '@/i18n';

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

// Error message translations
const errorMessages = {
  'en-US': {
    unauthorized: 'You need to be logged in to access this page',
    accessDenied: 'Access Denied',
    accessDeniedDesc: "You don't have permission to access this resource.",
    networkError: 'Network Error',
    networkErrorDesc: 'Unable to connect to the server. Please check your internet connection.',
    serverError: 'Server Error',
    serverErrorDesc: 'An error occurred on the server. Please try again later.',
  },
  'pt-BR': {
    unauthorized: 'Você precisa estar logado para acessar esta página',
    accessDenied: 'Acesso Negado',
    accessDeniedDesc: 'Você não tem permissão para acessar este recurso.',
    networkError: 'Erro de Conexão',
    networkErrorDesc: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
    serverError: 'Erro no Servidor',
    serverErrorDesc: 'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.',
  },
};

function getErrorMessage(key: keyof typeof errorMessages['en-US']): string {
  const lang = i18n.language as 'en-US' | 'pt-BR';
  return errorMessages[lang]?.[key] || errorMessages['en-US'][key];
}

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      globalAuthToken = null;
      if (!window.location.pathname.includes('/login')) {
        toast({
          title: getErrorMessage('unauthorized'),
          variant: 'destructive',
        });
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast({
        title: getErrorMessage('accessDenied'),
        description: getErrorMessage('accessDeniedDesc'),
        variant: 'destructive',
      });
    } else if (!error.response) {
      // Network error
      toast({
        title: getErrorMessage('networkError'),
        description: getErrorMessage('networkErrorDesc'),
        variant: 'destructive',
      });
    } else if (error.response?.status >= 500) {
      // Server error
      toast({
        title: getErrorMessage('serverError'),
        description: getErrorMessage('serverErrorDesc'),
        variant: 'destructive',
      });
    }
    return Promise.reject(error);
  }
);

export default api;
