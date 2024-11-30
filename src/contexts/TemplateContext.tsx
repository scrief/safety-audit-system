import React, { createContext, useContext, useState, useEffect } from 'react';
import { Template } from '../types/api';
import { templateApi } from '../services/api';

interface TemplateContextType {
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
  addTemplate: (template: Omit<Template, 'id'>) => Promise<Template>;
  updateTemplate: (id: string, template: Partial<Template>) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
  getTemplate: (id: string) => Template | null;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await templateApi.getAll();
        if (response.data) {
          setTemplates(response.data);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  const addTemplate = async (template: Omit<Template, 'id'>): Promise<Template> => {
    try {
      const savedTemplate = await templateApi.create(template);
      setTemplates(prev => [...prev, savedTemplate]);
      return savedTemplate;
    } catch (error) {
      console.error('Error adding template:', error);
      throw error;
    }
  };

  const updateTemplate = async (id: string, updatedTemplate: Partial<Template>) => {
    try {
      const savedTemplate = await templateApi.update(id, updatedTemplate);
      setTemplates(prev =>
        prev.map(template =>
          template.id === id ? savedTemplate : template
        )
      );
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  };

  const removeTemplate = async (id: string) => {
    try {
      await templateApi.delete(id);
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (error) {
      console.error('Error removing template:', error);
      throw error;
    }
  };

  const getTemplate = (id: string) => {
    return templates.find(template => template.id === id) || null;
  };

  return (
    <TemplateContext.Provider value={{
      templates,
      setTemplates,
      addTemplate,
      updateTemplate,
      removeTemplate,
      getTemplate
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
}; 