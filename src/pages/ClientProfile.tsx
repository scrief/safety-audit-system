import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useClients } from '../contexts/ClientContext';
import { ClientProfile as ClientProfileType } from '../types/client';
import { Template } from '../types/api';
import { templateApi, clientApi } from '../services/api';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
} from '@mui/material';
import axios, { AxiosError } from 'axios';

type FormDataType = Omit<ClientProfileType, 'id' | 'createdAt' | 'updatedAt' | 'totalAuditsCompleted'>;

const ClientProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addClient, updateClient, getClient } = useClients();
  const existingClient = id ? getClient(id) : null;

  const [formData, setFormData] = useState<FormDataType>({
    name: existingClient?.name || '',
    industry: existingClient?.industry || '',
    subIndustry: existingClient?.subIndustry || '',
    employeeCount: existingClient?.employeeCount || 0,
    locations: existingClient?.locations || 0,
    riskLevel: existingClient?.riskLevel || 'Low',
    primaryContact: existingClient?.primaryContact || {
      name: '',
      email: '',
      phone: '',
      title: ''
    },
    address: existingClient?.address || {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    },
    notes: existingClient?.notes || '',
    assignedTemplateIds: existingClient?.assignedTemplateIds || [],
    logoUrl: existingClient?.logoUrl || ''
  });

  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [assignedTemplateIds, setAssignedTemplateIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await templateApi.getAll();
        setAvailableTemplates(response?.data || []);
        if (existingClient) {
          setAssignedTemplateIds(existingClient.assignedTemplateIds || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        setAvailableTemplates([]);
      }
    };

    fetchTemplates();
  }, [existingClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    try {
      const clientData = {
        ...formData,
        employeeCount: Number(formData.employeeCount),
        locations: Number(formData.locations),
        assignedTemplateIds: assignedTemplateIds,
        riskLevel: formData.riskLevel as 'Low' | 'Medium' | 'High',
        totalAuditsCompleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAuditDate: formData.lastAuditDate ? new Date(formData.lastAuditDate).toISOString() : undefined
      };
      
      console.log('Processed client data:', clientData);

      if (existingClient) {
        console.log('Updating existing client:', existingClient.id);
        const updatedClient = await clientApi.update(existingClient.id, clientData);
        console.log('Updated client:', updatedClient);
        updateClient(existingClient.id, updatedClient);
      } else {
        console.log('Creating new client with data:', clientData);
        const newClient = await clientApi.create(clientData);
        console.log('Created client response:', newClient);
        addClient(newClient);
      }

      navigate('/clients');
    } catch (error) {
      console.error('Full error object:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error response data:', error.response?.data);
        alert(`Error saving client: ${error.response?.data?.message || 'Failed to create client'}`);
      } else {
        console.error('Error details:', error);
        alert('Error saving client. Please try again.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...((prev[parentKey as keyof FormDataType] || {}) as Record<string, string>),
          [childKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTemplateAssignment = (value: string[]) => {
    setAssignedTemplateIds(value);
    if (existingClient) {
      updateClient(existingClient.id, {
        ...formData,
        assignedTemplateIds: value
      });
    }
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {existingClient ? 'Edit Client' : 'Create Client'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm rounded-lg p-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry *
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Industry</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Construction">Construction</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Retail">Retail</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Mining">Mining</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Industry
                  </label>
                  <input
                    type="text"
                    name="subIndustry"
                    value={formData.subIndustry}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Count *
                  </label>
                  <input
                    type="number"
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Locations *
                  </label>
                  <input
                    type="number"
                    name="locations"
                    value={formData.locations}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Risk Level *
                  </label>
                  <select
                    name="riskLevel"
                    value={formData.riskLevel}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Primary Contact */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Primary Contact</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="primaryContact.name"
                    value={formData.primaryContact.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="primaryContact.title"
                    value={formData.primaryContact.title}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="primaryContact.email"
                    value={formData.primaryContact.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="primaryContact.phone"
                    value={formData.primaryContact.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Address</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="address.zip"
                    value={formData.address.zip}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border rounded-md"
              />
            </div>

            {/* Assigned Templates */}
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Assigned Audit Templates</InputLabel>
              <Select
                multiple
                value={assignedTemplateIds}
                onChange={(e) => {
                  const value = e.target.value as string[];
                  handleTemplateAssignment(value);
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={availableTemplates.find(t => t.id === value)?.name}
                        onDelete={() => {
                          setAssignedTemplateIds(prev => prev.filter(id => id !== value));
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {availableTemplates?.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Logo Upload */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                {formData.logoUrl && (
                  <div className="mb-2">
                    <img 
                      src={formData.logoUrl} 
                      alt="Company Logo" 
                      className="h-20 object-contain"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Here you would typically upload to your server or cloud storage
                      // For now, we'll use a local URL
                      const url = URL.createObjectURL(file);
                      setFormData(prev => ({
                        ...prev,
                        logoUrl: url
                      }));
                    }
                  }}
                  className="w-full"
                />
              </div>

              {/* Rest of the form fields */}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="px-6 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {existingClient ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile; 