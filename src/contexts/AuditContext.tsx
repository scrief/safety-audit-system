import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audit } from '../types/api';
import { auditApi } from '../services/api';

interface AuditContextType {
  audits: Audit[];
  setAudits: (audits: Audit[]) => void;
  addAudit: (audit: Omit<Audit, 'id'>) => Promise<void>;
  updateAudit: (id: string, audit: Partial<Audit>) => Promise<void>;
  removeAudit: (id: string) => Promise<void>;
  getAudit: (id: string) => Audit | null;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audits, setAudits] = useState<Audit[]>([]);

  useEffect(() => {
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

  const addAudit = async (audit: Omit<Audit, 'id'>) => {
    try {
      console.log('Creating audit:', audit);
      const response = await auditApi.create(audit);
      console.log('Audit created:', response);
      setAudits(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding audit:', error);
      throw error;
    }
  };

  const updateAudit = async (id: string, updatedAudit: Partial<Audit>) => {
    try {
      console.log('Updating audit:', id, updatedAudit);
      const response = await auditApi.update(id, updatedAudit);
      console.log('Audit updated:', response);
      setAudits(prev =>
        prev.map(audit =>
          audit.id === id ? { ...audit, ...response.data } : audit
        )
      );
    } catch (error) {
      console.error('Error updating audit:', error);
      throw error;
    }
  };

  const removeAudit = async (id: string) => {
    try {
      console.log('Removing audit:', id);
      await auditApi.delete(id);
      setAudits(prev => prev.filter(audit => audit.id !== id));
    } catch (error) {
      console.error('Error removing audit:', error);
      throw error;
    }
  };

  const getAudit = (id: string) => {
    return audits.find(audit => audit.id === id) || null;
  };

  return (
    <AuditContext.Provider value={{
      audits,
      setAudits,
      addAudit,
      updateAudit,
      removeAudit,
      getAudit
    }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudits = () => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudits must be used within an AuditProvider');
  }
  return context;
}; 