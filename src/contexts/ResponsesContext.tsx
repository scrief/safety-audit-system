import React, { createContext, useContext, useState } from 'react';
import { Audit } from '../types/api';
import { auditApi } from '../services/api';

interface ResponsesContextType {
  responses: Record<string, any>;
  setResponses: (responses: Record<string, any>) => void;
  updateResponse: (questionId: string, value: any) => void;
  clearResponses: () => void;
  audits: Audit[];
  addAudit: (audit: Omit<Audit, 'id'>) => Promise<void>;
  updateAudit: (id: string, audit: Partial<Audit>) => Promise<void>;
  deleteAudit: (id: string) => Promise<void>;
}

const ResponsesContext = createContext<ResponsesContextType | undefined>(undefined);

export const ResponsesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [audits, setAudits] = useState<Audit[]>([]);

  React.useEffect(() => {
    const fetchAudits = async () => {
      try {
        const response = await auditApi.getAll();
        if (response.data) {
          setAudits(response.data);
        }
      } catch (error) {
        console.error('Error fetching audits:', error);
      }
    };

    fetchAudits();
  }, []);

  const updateResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const clearResponses = () => {
    setResponses({});
  };

  const addAudit = async (audit: Omit<Audit, 'id'>) => {
    try {
      const response = await auditApi.create(audit);
      setAudits(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding audit:', error);
      throw error;
    }
  };

  const updateAudit = async (id: string, auditData: Partial<Audit>) => {
    try {
      const response = await auditApi.update(id, auditData);
      setAudits(prev =>
        prev.map(audit =>
          audit.id === id ? response.data : audit
        )
      );
    } catch (error) {
      console.error('Error updating audit:', error);
      throw error;
    }
  };

  const deleteAudit = async (id: string) => {
    try {
      await auditApi.delete(id);
      setAudits(prev => prev.filter(audit => audit.id !== id));
    } catch (error) {
      console.error('Error deleting audit:', error);
      throw error;
    }
  };

  return (
    <ResponsesContext.Provider value={{
      responses,
      setResponses,
      updateResponse,
      clearResponses,
      audits,
      addAudit,
      updateAudit,
      deleteAudit
    }}>
      {children}
    </ResponsesContext.Provider>
  );
};

export const useResponses = () => {
  const context = useContext(ResponsesContext);
  if (context === undefined) {
    throw new Error('useResponses must be used within a ResponsesProvider');
  }
  return context;
}; 