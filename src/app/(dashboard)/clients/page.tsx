'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ClientList } from '@/components/clients/ClientList';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Client {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  locations: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  logo?: string;
  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
    title?: string;
  }>;
}

export default function ClientsPage() {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchClients();
    }
  }, [session]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clients/list');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    router.push(`/clients/${client.id}`);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      // Log the response for debugging
      console.log('Delete response:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let errorData;
      if (responseText) {
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response:', e);
        }
      }

      if (!response.ok) {
        throw new Error(errorData?.error || 'Failed to delete client');
      }

      // Remove the client from the local state
      setClients(clients.filter(client => client.id !== clientId));
      
      // Reset selected client if it was the one deleted
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button 
          onClick={() => router.push('/clients/new')}
          variant="primary"
          size="lg"
          className="min-w-[120px]"
        >
          New Client
        </Button>
      </div>

      <ClientList
        clients={clients}
        onSelect={handleClientSelect}
        onEdit={(client) => router.push(`/clients/${client.id}/edit`)}
        onDelete={handleDeleteClient}
      />
    </div>
  );
}