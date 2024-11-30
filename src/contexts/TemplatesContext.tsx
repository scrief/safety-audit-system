import React, { createContext, useContext, useState } from 'react';
import type { FormTemplate } from '../types';

type TemplatesContextType = {
  templates: FormTemplate[];
  addTemplate: (template: FormTemplate) => void;
  deleteTemplate: (id: string) => void;
};

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

export const TemplatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);

  const addTemplate = (template: FormTemplate) => {
    setTemplates(prev => [...prev, template]);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  };

  return (
    <TemplatesContext.Provider value={{ templates, addTemplate, deleteTemplate }}>
      {children}
    </TemplatesContext.Provider>
  );
};

export const useTemplates = () => {
  const context = useContext(TemplatesContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return context;
}; 