import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useClients } from '../contexts/ClientContext';
import { useResponses } from '../contexts/ResponsesContext';
import Navigation from '../components/Navigation';
import { Template } from '../types/api';
import { templateApi } from '../services/api';
import { Loader2 } from 'lucide-react';
import { aiApi } from '../services/api';
import { Trash2 } from 'lucide-react';
import { X } from 'lucide-react';
import { DocumentGeneratorRequest } from '../types/api';
import { documentApi } from '../services/api';

interface Field {
  id: string;
  type: string;
  question: string;
  sectionId: string;
  required?: boolean;
  hasNotes?: boolean;
  hasPhoto?: boolean;
  options?: string[];
  checkboxOptions?: string[];
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  aiConfig?: {
    sourceFieldIds: string[];
    customPrompt: string;
    model: string;
    maxTokens: number;
    buttonLabel?: string;
  };
}

interface PhotoModalProps {
  photoUrl: string;
  onClose: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photoUrl, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="max-w-4xl max-h-[90vh] relative">
        <img
          src={photoUrl}
          alt="Preview"
          className="max-w-full max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

const AuditForm = () => {
  const { clientId, templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getClient } = useClients();
  const [template, setTemplate] = useState<Template | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const { addAudit, updateAudit } = useResponses();
  const client = getClient(clientId!);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Get the audit data if in edit mode
  const editAudit = location.state?.audit;
  const isEditMode = !!editAudit;

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      
      try {
        console.log('Fetching template:', templateId);
        const response = await templateApi.getById(templateId);
        console.log('Template response:', response);
        
        if (response.data) {
          console.log('Setting template:', response.data);
          setTemplate(response.data);
          
          // If in edit mode, set the responses from the audit
          if (isEditMode && editAudit.responses) {
            console.log('Setting responses from audit:', editAudit.responses);
            setResponses(editAudit.responses);
          }
        } else {
          console.error('No template data received');
          navigate('/new-audit');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        navigate('/new-audit');
      }
    };

    fetchTemplate();
  }, [templateId, navigate, isEditMode, editAudit]);

  const handleSaveDraft = async () => {
    if (!template || !client) return;

    try {
      // Ensure responses are properly structured
      const sanitizedResponses = Object.entries(responses).reduce((acc, [fieldId, response]) => {
        // Handle both string values and object values
        if (typeof response === 'string') {
          acc[fieldId] = {
            value: response,
            photos: [],
            notes: ''
          };
        } else if (response && typeof response === 'object') {
          acc[fieldId] = {
            value: response.value || '',
            photos: Array.isArray(response.photos) ? response.photos : [],
            notes: response.notes || ''
          };
        } else {
          acc[fieldId] = {
            value: '',
            photos: [],
            notes: ''
          };
        }
        return acc;
      }, {} as Record<string, any>);

      // Ensure all required fields are present in the audit data
      const auditData = {
        clientId: client.id,
        templateId: template.id,
        templateName: template.name,
        status: 'draft' as const,
        responses: sanitizedResponses,
        sections: template.sections.map(section => ({
          id: section.id,
          title: section.title
        })),
        fields: template.fields.map(field => ({
          id: field.id,
          sectionId: field.sectionId,
          question: field.question,
          type: field.type,
          required: field.required
        })),
        auditorName: location.state?.auditorInfo?.name || '',
        auditorTitle: location.state?.auditorInfo?.title || '',
        auditorEmail: location.state?.auditorInfo?.email || '',
        createdAt: isEditMode ? editAudit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: undefined
      };

      console.log('Saving audit data:', auditData);

      if (isEditMode && editAudit?.id) {
        console.log('Updating existing audit:', editAudit.id);
        await updateAudit(editAudit.id, auditData);
      } else {
        console.log('Creating new audit');
        await addAudit(auditData);
      }

      navigate('/form-responses');
    } catch (error) {
      console.error('Error saving draft:', error);
      if (error instanceof Error) {
        alert(`Error saving draft: ${error.message}`);
      } else {
        alert('Error saving draft. Please try again.');
      }
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !client) return;

    // Check if all required fields are filled
    const requiredFields = template.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => {
      const response = responses[field.id];
      return !response || (typeof response === 'object' && !response.value);
    });

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n${missingFields.map(f => f.question).join('\n')}`);
      return;
    }

    try {
      // Use the same response sanitization as in handleSaveDraft
      const sanitizedResponses = Object.entries(responses).reduce((acc, [fieldId, response]) => {
        if (typeof response === 'string') {
          acc[fieldId] = {
            value: response,
            photos: [],
            notes: ''
          };
        } else if (response && typeof response === 'object') {
          acc[fieldId] = {
            value: response.value || '',
            photos: Array.isArray(response.photos) ? response.photos : [],
            notes: response.notes || ''
          };
        } else {
          acc[fieldId] = {
            value: '',
            photos: [],
            notes: ''
          };
        }
        return acc;
      }, {} as Record<string, any>);

      const auditData = {
        clientId: client.id,
        templateId: template.id,
        templateName: template.name,
        status: 'completed' as const,
        responses: sanitizedResponses,
        sections: template.sections.map(section => ({
          id: section.id,
          title: section.title
        })),
        fields: template.fields.map(field => ({
          id: field.id,
          sectionId: field.sectionId,
          question: field.question,
          type: field.type,
          required: field.required
        })),
        auditorName: location.state?.auditorInfo?.name || '',
        auditorTitle: location.state?.auditorInfo?.title || '',
        auditorEmail: location.state?.auditorInfo?.email || '',
        createdAt: isEditMode ? editAudit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      console.log('Saving completed audit:', auditData);

      if (isEditMode && editAudit?.id) {
        await updateAudit(editAudit.id, auditData);
      } else {
        await addAudit(auditData);
      }

      navigate('/form-responses');
    } catch (error) {
      console.error('Error completing audit:', error);
      if (error instanceof Error) {
        alert(`Error completing audit: ${error.message}`);
      } else {
        alert('Error completing audit. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    if (Object.keys(responses).length > 0) {
      if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        navigate('/form-responses');
      }
    } else {
      navigate('/form-responses');
    }
  };

  const handleAIRecommendation = async (field: Field) => {
    if (!field.aiConfig?.sourceFieldIds?.length) {
      alert('Please select source fields for AI recommendation');
      return;
    }

    setAiLoading(prev => ({ ...prev, [field.id]: true }));

    try {
      // Gather text from all selected source fields
      const sourceTexts = field.aiConfig.sourceFieldIds.map((sourceId: string) => {
        const sourceField = template?.fields.find(f => f.id === sourceId);
        const response = responses[sourceId];
      
        // Check if the response is an object and extract the value from it
        const responseText = response && typeof response === 'object' && 'value' in response ? response.value : response || '';
      
        return `${sourceField?.question || ''}: ${responseText}`;
      }).filter(Boolean);

      if (sourceTexts.length === 0) {
        throw new Error('No responses found for selected source fields');
      }

      // Combine texts and add custom prompt
      const prompt = `
        Based on the following responses:
        ${sourceTexts.join('\n')}
        
        ${field.aiConfig.customPrompt || 'Please provide a safety recommendation.'}
      `.trim();

      // Use the backend API endpoint only
      const response = await aiApi.generate({
        prompt,
        model: field.aiConfig.model || 'gpt-3.5-turbo',
        maxTokens: field.aiConfig.maxTokens || 150,
      });

      console.log('AI response:', response);

      if (response?.data?.recommendation) {
        setResponses(prev => ({
          ...prev,
          [field.id]: response.data.recommendation
        }));
      } else {
        throw new Error('No recommendation received in the response');
      }

    } catch (error) {
      console.error('Error generating AI recommendation:', error);
      alert(error instanceof Error ? error.message : 'Error generating recommendation. Please try again.');
    } finally {
      setAiLoading(prev => ({ ...prev, [field.id]: false }));
    }
  };

  const renderField = (
    field: Field,
    responses: Record<string, any>,
    setResponses: React.Dispatch<React.SetStateAction<Record<string, any>>>
  ) => {
    return (
      <div className="space-y-4">
        {/* Main field input */}
        {renderMainField(field, responses, setResponses)}

        {/* Photo upload section */}
        {field.hasPhoto && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            <div className="space-y-4">
              {/* Display existing photos */}
              {responses[field.id]?.photos?.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {responses[field.id].photos.map((photo: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={`data:image/jpeg;base64,${photo}`}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                        onClick={() => setSelectedPhoto(`data:image/jpeg;base64,${photo}`)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newPhotos = [...responses[field.id].photos];
                          newPhotos.splice(index, 1);
                          setResponses(prev => ({
                            ...prev,
                            [field.id]: { ...prev[field.id], photos: newPhotos }
                          }));
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full 
                          hover:bg-red-600 transition-all duration-200 shadow-lg"
                        title="Delete photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Photo upload input */}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  const photoPromises = files.map(file => {
                    return new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64String = (reader.result as string)
                          .replace('data:image/jpeg;base64,', '')
                          .replace('data:image/png;base64,', '');
                        resolve(base64String);
                      };
                      reader.readAsDataURL(file);
                    });
                  });

                  const newPhotos = await Promise.all(photoPromises);
                  const existingPhotos = responses[field.id]?.photos || [];
                  const existingValue = responses[field.id]?.value || responses[field.id] || '';
                  
                  setResponses(prev => ({
                    ...prev,
                    [field.id]: {
                      value: existingValue,
                      photos: [...existingPhotos, ...newPhotos]
                    }
                  }));
                }}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
          </div>
        )}

        {/* Notes section */}
        {field.hasNotes && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={responses[field.id]?.notes || ''}
              onChange={(e) => {
                setResponses(prev => ({
                  ...prev,
                  [field.id]: { ...prev[field.id], notes: e.target.value }
                }));
              }}
              className="w-full p-2 border rounded-md min-h-[100px]"
              placeholder="Enter any additional notes here..."
            />
          </div>
        )}
      </div>
    );
  };

  // Helper function to render the main field input
  const renderMainField = (
    field: Field,
    responses: Record<string, any>,
    setResponses: React.Dispatch<React.SetStateAction<Record<string, any>>>
  ) => {
    const getValue = (fieldId: string) => {
      const response = responses[fieldId];
      if (response === null || response === undefined) return '';
      if (typeof response === 'object' && response.value !== undefined) {
        return response.value;
      }
      if (typeof response === 'object' && !response.value && !response.photos && !response.notes) {
        return '';
      }
      return response;
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={getValue(field.id) || ''}
            onChange={(e) => setResponses(prev => ({
              ...prev,
              [field.id]: {
                ...prev[field.id],
                value: e.target.value
              }
            }))}
            className="w-full p-2 border rounded-md"
            required={field.required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={getValue(field.id) || ''}
            onChange={(e) => setResponses(prev => ({
              ...prev,
              [field.id]: {
                ...prev[field.id],
                value: e.target.value
              }
            }))}
            className="w-full p-2 border rounded-md"
            required={field.required}
          />
        );
      case 'yesNo':
        return (
          <select
            value={getValue(field.id) || ''}
            onChange={(e) => setResponses(prev => ({
              ...prev,
              [field.id]: {
                ...prev[field.id],
                value: e.target.value
              }
            }))}
            className="w-full p-2 border rounded-md"
            required={field.required}
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        );
      case 'multipleChoice':
        return (
          <select
            value={getValue(field.id) || ''}
            onChange={(e) => setResponses(prev => ({
              ...prev,
              [field.id]: {
                ...prev[field.id],
                value: e.target.value
              }
            }))}
            className="w-full p-2 border rounded-md"
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.checkboxOptions?.map((option: string) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={getValue(field.id)?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = getValue(field.id) || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    setResponses(prev => ({
                      ...prev,
                      [field.id]: {
                        ...prev[field.id],
                        value: newValues
                      }
                    }));
                  }}
                  className="rounded border-gray-300"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            value={getValue(field.id) || ''}
            onChange={(e) => setResponses(prev => ({
              ...prev,
              [field.id]: {
                ...prev[field.id],
                value: e.target.value
              }
            }))}
            className="w-full p-2 border rounded-md"
            required={field.required}
          />
        );
      case 'slider':
        return (
          <input
            type="range"
            min={field.sliderMin || 0}
            max={field.sliderMax || 100}
            step={field.sliderStep || 1}
            value={getValue(field.id) || field.sliderMin || 0}
            onChange={(e) => setResponses(prev => ({
              ...prev,
              [field.id]: {
                ...prev[field.id],
                value: e.target.value
              }
            }))}
            className="w-full"
            required={field.required}
          />
        );
      case 'instruction':
        return (
          <div className="text-gray-600 italic">
            {field.question}
          </div>
        );
      case 'aiRecommendation':
        return (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleAIRecommendation(field)}
              disabled={aiLoading[field.id]}
              className={`px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-600 disabled:bg-violet-300 flex items-center gap-2`}
            >
              {aiLoading[field.id] && <Loader2 className="animate-spin" size={16} />}
              {field.aiConfig?.buttonLabel || 'Generate AI Response'}
            </button>
            <div className="text-gray-600 bg-gray-50 p-4 rounded-md">
              {getValue(field.id) || 'No recommendation generated yet'}
            </div>
          </div>
        );
      default:
        return <div>Unsupported field type: {field.type}</div>;
    }
  };

  const handleExportDocument = async () => {
    if (!template || !client) return;
    
    setIsExporting(true);
    try {
      const documentData: DocumentGeneratorRequest = {
        templateName: template.name,
        clientName: client.name,
        auditorName: location.state?.auditorInfo?.name || 'N/A',
        auditorTitle: location.state?.auditorInfo?.title || 'N/A',
        auditorEmail: location.state?.auditorInfo?.email || 'N/A',
        completedAt: new Date().toISOString(),
        sections: template.sections,
        fields: template.fields,
        responses
      };

      const blob = await documentApi.generateDocument(documentData);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}-${new Date().toLocaleDateString()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting document:', error);
      alert('Error exporting document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!template || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-gray-600">
            {!template ? 'Loading template...' : 'Loading client data...'}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {`Template ID: ${templateId}, Client ID: ${clientId}`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isEditMode ? 'Edit Audit' : template?.name}
              </h1>
              <p className="text-gray-600">
                Client: {client?.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Status: {isEditMode ? editAudit.status : 'New'}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                title="Save your progress without marking the audit as complete"
              >
                Save Draft
              </button>
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                title="Complete the audit - all required fields must be filled"
              >
                {isEditMode ? 'Update Audit' : 'Complete Audit'}
              </button>
              <button
                onClick={handleExportDocument}
                disabled={isExporting}
                className={`px-4 py-2 ${
                  isExporting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                } text-white rounded-md flex items-center gap-2`}
                title="Export audit as Word document"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Exporting...
                  </>
                ) : (
                  'Export Document'
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleComplete} className="space-y-8">
            {template.sections.map((section, sectionIndex) => (
              <div key={section.id} className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {template.fields
                    .filter(field => field.sectionId === section.id)
                    .map((field, fieldIndex) => (
                      <div key={field.id} className="space-y-2">
                        <label className="block font-medium text-gray-700">
                          {field.question}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderField(field, responses, setResponses)}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </form>
        </div>
      </div>
      {selectedPhoto && (
        <PhotoModal
          photoUrl={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};

export default AuditForm; 