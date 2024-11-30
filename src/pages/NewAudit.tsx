import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useClients } from '../contexts/ClientContext';
import { templateApi } from '../services/api';
import { Client, Template } from '../types/api';
import { ClientProfile } from '../types/client';
import {
  TextField,
  Autocomplete,
} from '@mui/material';

const NewAudit = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTemplate, setSearchTemplate] = useState('');
  const [auditorInfo, setAuditorInfo] = useState({
    name: '',
    title: '',
    email: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const templatesResponse = await templateApi.getAll();
        setTemplates(templatesResponse.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setTemplates([]);
      }
    };

    fetchData();
  }, []);

  // Filter templates based on selected client
  const filteredTemplates = templates.filter(template => {
    const client = clients.find(c => c.id === selectedClient);
    if (!client) return true; // If no client selected, show all templates
    return client.assignedTemplateIds?.includes(template.id) ?? false;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedTemplate || !auditorInfo.name) {
      alert('Please select a client, template, and enter auditor name');
      return;
    }

    navigate(`/audit/${selectedClient}/${selectedTemplate}`, {
      state: { auditorInfo }
    });
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Start New Audit
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm rounded-lg p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Client</h2>
              
              <Autocomplete
                options={clients || []}
                getOptionLabel={(option: ClientProfile) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                value={clients.find(c => c.id === selectedClient) || null}
                onChange={(_, newValue: ClientProfile | null) => {
                  setSelectedClient(newValue?.id || '');
                  setSelectedTemplate(''); // Reset template when client changes
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Client"
                    variant="filled"
                  />
                )}
                noOptionsText="No clients available"
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Audit Template</h2>
              
              <Autocomplete
                options={filteredTemplates || []}
                getOptionLabel={(option: Template) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                value={templates.find(t => t.id === selectedTemplate) || null}
                onChange={(_, newValue: Template | null) => {
                  setSelectedTemplate(newValue?.id || '');
                }}
                disabled={!selectedClient}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Audit Template"
                    variant="filled"
                  />
                )}
                noOptionsText={selectedClient ? "No templates available" : "Select a client first"}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Auditor Information</h2>
              
              <TextField
                required
                fullWidth
                variant="filled"
                label="Auditor Name"
                value={auditorInfo.name}
                onChange={(e) => setAuditorInfo(prev => ({ ...prev, name: e.target.value }))}
              />

              <TextField
                fullWidth
                variant="filled"
                label="Auditor Title"
                value={auditorInfo.title}
                onChange={(e) => setAuditorInfo(prev => ({ ...prev, title: e.target.value }))}
              />

              <TextField
                fullWidth
                variant="filled"
                type="email"
                label="Auditor Email"
                value={auditorInfo.email}
                onChange={(e) => setAuditorInfo(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/form-responses')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Start Audit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewAudit; 