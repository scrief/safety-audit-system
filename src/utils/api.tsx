// src/utils/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response Interceptor:', response);
    // The response.data should already contain success and data fields from our API
    return response.data;
  },
  (error: AxiosError) => {
    console.error('API Error Interceptor:', error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    console.log('Fetching data from:', url);
    const response = await api.get(url);
    console.log('Raw API response:', response);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return { 
      success: false, 
      error: getErrorMessage(error),
      data: null 
    };
  }
}

export async function postData<T>(url: string, data: any): Promise<ApiResponse<T>> {
  try {
    const response = await api.post(url, data);
    return response;
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error),
      data: null 
    };
  }
}

export async function putData<T>(url: string, data: any): Promise<ApiResponse<T>> {
  try {
    const response = await api.put(url, data);
    return response;
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error),
      data: null 
    };
  }
}

export async function deleteData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await api.delete(url);
    return response;
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error),
      data: null 
    };
  }
}

// Error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.response?.status) {
      return `Server error: ${error.response.status} ${error.response.statusText}`;
    } else if (error.request) {
      return 'No response received from server. Please check your connection.';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
}

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
  },
  clients: {
    base: '/clients',
    single: (id: string) => `/clients/${id}`,
    templates: (id: string) => `/clients/${id}/templates`,
    audits: (id: string) => `/clients/${id}/audits`,
  },
  templates: {
    base: '/templates',
    single: (id: string) => `/templates/${id}`,
    archive: (id: string) => `/templates/${id}/archive`,
    duplicate: (id: string) => `/templates/${id}/duplicate`,
  },
  audits: {
    base: '/audits',
    single: (id: string) => `/audits/${id}`,
    responses: (id: string) => `/audits/${id}/responses`,
    complete: (id: string) => `/audits/${id}/complete`,
  },
  tags: {
    base: '/tags',
    single: (id: string) => `/tags/${id}`,
    categories: '/tags/categories',
  },
  settings: '/settings',
  analytics: {
    summary: '/analytics/summary',
    trends: '/analytics/trends',
    exports: '/analytics/exports',
  },
};

export default api;