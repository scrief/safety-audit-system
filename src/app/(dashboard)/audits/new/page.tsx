'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { ClientList } from '@/components/clients/ClientList';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

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

interface Template {
  id: string;
  name: string;
  description: string;
  sections: {
    id: string;
    title: string;
    fields: any[];
  }[];
}

export default function NewAuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAudit, setIsCreatingAudit] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchClients();
    }
  }, [session]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/clients');
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid response from server');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch clients');
      }

      setClients(data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(error instanceof Error ? error.message : 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewAudit = async (client: Client) => {
    if (!templateId) {
      setError('No template selected');
      return;
    }

    try {
      setIsCreatingAudit(true);
      setError(null);

      console.log('Starting new audit with:', { templateId, clientId: client.id });

      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          clientId: client.id
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // First get the response text
      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      // Try to parse it as JSON only if we have a response
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Invalid JSON response from server: ${responseText}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.data?.id) {
        throw new Error('No audit ID returned from server');
      }

      router.push(`/audits/${data.data.id}`);
    } catch (error) {
      console.error('Error creating audit:', error);
      setError(error instanceof Error ? error.message : 'Failed to create audit');
    } finally {
      setIsCreatingAudit(false);
    }
  };

  const handleClientSelect = async (client: Client) => {
    setSelectedClient(client);
    await startNewAudit(client);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">New Safety Audit</h1>
        <Button 
          onClick={() => router.push('/audits')}
          variant="outline"
          disabled={isCreatingAudit}
        >
          Cancel
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
          <p>{error}</p>
          <Button 
            onClick={fetchClients}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Select a Client</h2>
        <ClientList
          clients={clients}
          onSelect={handleClientSelect}
        />
      </div>

      {isCreatingAudit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="p-6 flex items-center space-x-4">
            <Spinner className="w-6 h-6" />
            <p>Creating audit...</p>
          </Card>
        </div>
      )}
    </div>
  );
}