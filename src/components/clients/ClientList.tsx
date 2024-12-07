import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

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

interface ClientListProps {
  clients: Client[];
  onSelect: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => Promise<void>;
}

export function ClientList({ clients, onSelect, onEdit, onDelete }: ClientListProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (clients.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">No clients found.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <Card key={client.id} className="hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  {client.logo && (
                    <img
                      src={client.logo}
                      alt={`${client.name} logo`}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.industry}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Employees:</span>
                    <span>{client.employeeCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Locations:</span>
                    <span>{client.locations}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Risk Level:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getRiskLevelColor(client.riskLevel)}`}>
                      {client.riskLevel}
                    </span>
                  </div>
                </div>

                {client.contacts[0] && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium">Primary Contact:</h4>
                    <div className="text-sm text-gray-500">
                      <p>{client.contacts[0].name}</p>
                      <p>{client.contacts[0].email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
            <Button
              variant="secondary"
              onClick={() => onSelect(client)}
            >
              Select
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="iconSm"
                onClick={() => onEdit(client)}
                title="Edit Client"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="iconSm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this client?')) {
                    onDelete(client.id);
                  }
                }}
                title="Delete Client"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}