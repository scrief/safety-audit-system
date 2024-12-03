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
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
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
    const response = await api.get<ApiResponse<T>>(url);
    return response;
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function postData<T>(url: string, data: any): Promise<ApiResponse<T>> {
  try {
    const response = await api.post<ApiResponse<T>>(url, data);
    return response;
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function putData<T>(url: string, data: any): Promise<ApiResponse<T>> {
  try {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response;
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await api.delete<ApiResponse<T>>(url);
    return response;
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// Error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
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