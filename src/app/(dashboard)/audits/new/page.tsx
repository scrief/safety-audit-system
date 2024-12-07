'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { ClientList } from '@/components/clients/ClientList';
import { Button } from '@/components/ui/Button';

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

export default function NewAuditPage() {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAudit, setIsCreatingAudit] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);

      const [templatesRes, clientsRes] = await Promise.all([
        fetch('/api/templates/list'),
        fetch('/api/clients/list')
      ]);

      if (!templatesRes.ok) {
        throw new Error('Failed to fetch templates');
      }

      if (!clientsRes.ok) {
        throw new Error('Failed to fetch clients');
      }

      const templatesData = await templatesRes.json();
      const clientsData = await clientsRes.json();

      setTemplates(templatesData.data || []);
      setClients(clientsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const startNewAudit = async (templateId: string) => {
    try {
      if (!selectedClient) {
        setError('Please select a client first');
        return;
      }

      setIsCreatingAudit(true);
      setShowTemplateSelector(false);
      setError(null);

      console.log('Creating audit with:', {
        templateId,
        clientId: selectedClient.id
      });

      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          clientId: selectedClient.id
        })
      });

      const data = await response.json();
      console.log('Audit creation response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create audit');
      }

      // Navigate to the new audit
      console.log('Redirecting to:', `/audits/${data.data.id}`);
      router.push(`/audits/${data.data.id}`);
    } catch (error) {
      console.error('Error creating audit:', error);
      setError(error instanceof Error ? error.message : 'Failed to create audit');
      setShowTemplateSelector(true);
    } finally {
      setIsCreatingAudit(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setShowTemplateSelector(true);
    setError(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
          {error.includes('Failed to load data') && (
            <Button 
              onClick={fetchData}
              variant="outline"
              className="ml-4"
            >
              Retry
            </Button>
          )}
        </div>
      )}
  
      {!selectedClient && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Select a Client to Begin Audit
          </h2>
          <ClientList
            clients={clients}
            onSelect={handleClientSelect}
          />
        </div>
      )}

      {selectedClient && showTemplateSelector && (
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select a Template for {selectedClient.name}</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedClient(null)}
                disabled={isCreatingAudit}
              >
                Change Client
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className="border rounded-lg p-4 text-left cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => !isCreatingAudit && startNewAudit(template.id)}
                  disabled={isCreatingAudit}
                >
                  <h3 className="font-medium mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    {template.sections.length} sections
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {isCreatingAudit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg">Creating audit...</p>
          </div>
        </div>
      )}
    </div>
  );
}