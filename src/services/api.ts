import axios, { AxiosError } from 'axios';
import { Client, Audit, Template, ApiResponse, DocumentGeneratorRequest } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Client endpoints
export const clientApi = {
  getAll: async (): Promise<ApiResponse<Client[]>> => {
    const response = await api.get('/clients');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Client>> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  create: async (client: Omit<Client, 'id'>): Promise<Client> => {
    console.log('Creating client with data:', client);
    try {
      const response = await api.post('/clients', client);
      console.log('Create client response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Client creation error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Error response:', axiosError.response?.data);
      }
      throw error;
    }
  },

  update: async (id: string, client: Partial<Client>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, client);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  }
};

// Audit endpoints
export const auditApi = {
  getAll: async (): Promise<ApiResponse<Audit[]>> => {
    const response = await api.get('/audits');
    return response.data;
  },

  getByClient: async (clientId: string): Promise<ApiResponse<Audit[]>> => {
    const response = await api.get(`/audits?clientId=${clientId}`);
    return response.data;
  },

  create: async (audit: Omit<Audit, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Audit>> => {
    const response = await api.post('/audits', audit);
    return response.data;
  },

  update: async (id: string, audit: Partial<Audit>): Promise<ApiResponse<Audit>> => {
    const response = await api.put(`/audits/${id}`, audit);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/audits/${id}`);
    return response.data;
  }
};

// Template endpoints
export const templateApi = {
  getAll: async (): Promise<ApiResponse<Template[]>> => {
    console.log('Fetching all templates');
    const response = await api.get('/templates');
    console.log('Templates response:', response.data);
    return response.data;
  },

  create: async (template: Omit<Template, 'id'>): Promise<Template> => {
    console.log('Creating template:', template);
    const response = await api.post('/templates', template);
    console.log('Create template response:', response.data);
    return response.data;
  },

  update: async (id: string, template: Partial<Template>): Promise<Template> => {
    console.log('Updating template:', template);
    const response = await api.put(`/templates/${id}`, template);
    console.log('Update template response:', response.data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    console.log('Deleting template:', id);
    await api.delete(`/templates/${id}`);
    console.log('Template deleted');
  },

  getById: async (id: string): Promise<ApiResponse<Template>> => {
    console.log('Fetching template:', id);
    const response = await api.get(`/templates/${id}`);
    console.log('Template response:', response.data);
    return response.data;
  }
};

// Add this to your api.ts
export const aiApi = {
  generate: async (data: { prompt: string; model: string; maxTokens: number }) => {
    console.log('Generating AI recommendation with:', data);
    try {
      const response = await api.post<{ success: boolean; data: { recommendation: string } }>('/ai/generate', data);
      
      // Validate response structure
      if (!response.data?.data?.recommendation) {
        throw new Error('Invalid AI response format');
      }
      
      return response.data;
    } catch (error) {
      console.error('AI API error:', error);
      throw error;
    }
  }
};

// Add to your existing api.ts
export const documentApi = {
  generateDocument: async (auditData: DocumentGeneratorRequest): Promise<Blob> => {
    try {
      const response = await api.post('/exports/word', auditData, {
        responseType: 'blob',
        timeout: 30000, // Increase timeout for large documents
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });
      
      // Verify the response is actually a Word document
      if (response.headers['content-type'] !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        throw new Error('Invalid document format received');
      }
      
      return response.data;
    } catch (error) {
      console.error('Document generation error:', error);
      throw new Error('Failed to generate document. Please try again.');
    }
  }
};

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.response?.status === 429) {
      // Rate limiting handling
    }
    if (!navigator.onLine) {
      // Offline handling
    }
    return Promise.reject(error);
  }
);

// Add basic request caching
const cache = new Map();
const getCachedData = async (key: string) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  // Fetch and cache
};

export default api; 