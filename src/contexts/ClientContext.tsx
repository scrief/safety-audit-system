import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientProfile } from '../types/client';
import { clientApi } from '../services/api';

interface ClientContextType {
  clients: ClientProfile[];
  setClients: (clients: ClientProfile[]) => void;
  addClient: (client: ClientProfile) => void;
  updateClient: (id: string, client: Partial<ClientProfile>) => void;
  removeClient: (id: string) => void;
  getClient: (id: string) => ClientProfile | null;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<ClientProfile[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientApi.getAll();
        if (response.data) {
          setClients(response.data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  const addClient = (client: ClientProfile) => {
    setClients(prev => [...prev, client]);
  };

  const updateClient = (id: string, updatedClient: Partial<ClientProfile>) => {
    setClients(prev =>
      prev.map(client =>
        client.id === id ? { ...client, ...updatedClient } : client
      )
    );
  };

  const removeClient = (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  };

  const getClient = (id: string) => {
    return clients.find(client => client.id === id) || null;
  };

  return (
    <ClientContext.Provider value={{ 
      clients, 
      setClients, 
      addClient, 
      updateClient, 
      removeClient, 
      getClient 
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
}; 