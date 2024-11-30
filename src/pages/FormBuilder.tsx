import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import Navigation from '../components/Navigation';

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { addTemplate } = useTemplates();
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Template form submitted');
    
    try {
      console.log('About to make API call');
      const templateData = {
        name: templateName,
        description: description,
        sections: [],
        fields: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Template data:', templateData);
      const savedTemplate = await addTemplate(templateData);
      console.log('Template saved successfully:', savedTemplate);
      
      // Navigate to template builder with the saved template
      if (savedTemplate && savedTemplate.id) {
        navigate(`/template-builder/${savedTemplate.id}`, { 
          state: { 
            template: savedTemplate,
            mode: 'edit'
          } 
        });
      } else {
        console.error('No template ID received');
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Create New Template
          </h1>
          
          <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/saved-templates')}
                className="px-6 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Continue to Builder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder; 