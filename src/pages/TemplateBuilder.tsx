import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import Navigation from '../components/Navigation';
import { Template } from '../types/api';
import { templateApi } from '../services/api';
import { Trash2, GripVertical, Plus, Copy } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  order: number;
  questions: any[];
}

interface Field {
  id: string;
  sectionId: string;
  type: string;
  question: string;
  order: number;
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
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'company-model';
    maxTokens: number;
    useSpeechToText: boolean;
    buttonLabel: string;
  };
}

const getDefaultAIConfig = () => ({
  sourceFieldIds: [],
  customPrompt: '',
  model: 'gpt-3.5-turbo' as const,
  maxTokens: 150,
  useSpeechToText: false,
  buttonLabel: 'Generate AI Response'
});

const TemplateBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { updateTemplate } = useTemplates();
  const [template, setTemplate] = useState<Template | null>(location.state?.template || null);
  const [sections, setSections] = useState<Section[]>(template?.sections || []);
  const [fields, setFields] = useState<Field[]>(template?.fields || []);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!template && id) {
        try {
          const response = await templateApi.getById(id);
          if (response.data) {
            setTemplate(response.data);
            setSections(response.data.sections || []);
            setFields(response.data.fields || []);
          }
        } catch (error) {
          console.error('Error fetching template:', error);
          navigate('/saved-templates');
        }
      }
    };

    fetchTemplate();
  }, [id, template, navigate]);

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: '',
      order: sections.length,
      questions: []
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
    setFields(fields.filter(field => field.sectionId !== sectionId));
  };

  const addField = (sectionId: string, type: string) => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      sectionId,
      type,
      question: '',
      order: fields.filter(f => f.sectionId === sectionId).length,
      required: false,
      hasNotes: false,
      hasPhoto: false,
      options: type === 'multipleChoice' ? ['Option 1'] : undefined,
      checkboxOptions: type === 'checkbox' ? ['Option 1'] : undefined,
      sliderMin: type === 'slider' ? 0 : undefined,
      sliderMax: type === 'slider' ? 100 : undefined,
      sliderStep: type === 'slider' ? 1 : undefined,
      aiConfig: type === 'aiRecommendation' ? getDefaultAIConfig() : undefined
    };
    setFields([...fields, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<Field>) => {
    setFields(fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const duplicateField = (field: Field) => {
    const newField = {
      ...field,
      id: `field-${Date.now()}`,
      order: fields.filter(f => f.sectionId === field.sectionId).length
    };
    setFields([...fields, newField]);
  };

  const handleSave = async () => {
    if (!template?.id) return;

    try {
      await updateTemplate(template.id, {
        sections,
        fields
      });
      navigate('/saved-templates');
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const renderFieldOptionsEditor = (field: Field) => {
    if (!['multipleChoice', 'checkbox'].includes(field.type)) return null;

    const options = field.type === 'multipleChoice' ? field.options : field.checkboxOptions;
    const setOptions = (newOptions: string[]) => {
      updateField(field.id, {
        [field.type === 'multipleChoice' ? 'options' : 'checkboxOptions']: newOptions
      });
    };

    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2">Options</h4>
        <div className="space-y-2">
          {options?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...(options || [])];
                  newOptions[index] = e.target.value;
                  setOptions(newOptions);
                }}
                className="flex-1 p-2 border rounded"
                placeholder={`Option ${index + 1}`}
              />
              <button
                onClick={() => {
                  const newOptions = [...(options || [])];
                  newOptions.splice(index, 1);
                  setOptions(newOptions);
                }}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setOptions([...(options || []), ''])}
            className="text-blue-500 hover:text-blue-700"
          >
            Add Option
          </button>
        </div>
      </div>
    );
  };

  const renderAIConfigEditor = (field: Field) => {
    if (field.type !== 'aiRecommendation') return null;

    const currentConfig = field.aiConfig || getDefaultAIConfig();
    const availableFields = fields.filter(f => 
      f.id !== field.id && 
      ['text', 'multipleChoice', 'checkbox'].includes(f.type)
    );

    return (
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Fields
          </label>
          <div className="relative">
            <select
              multiple
              className="w-full p-2 border rounded-md max-h-48"
              value={currentConfig.sourceFieldIds}
              onChange={(e) => {
                const options = Array.from(e.target.options);
                const selectedValues = options
                  .filter(option => option.selected)
                  .map(option => option.value);
                
                updateField(field.id, {
                  aiConfig: {
                    ...currentConfig,
                    sourceFieldIds: selectedValues
                  }
                });
              }}
            >
              {availableFields.map((sourceField) => (
                <option 
                  key={sourceField.id} 
                  value={sourceField.id}
                  className="p-2 flex items-center gap-2"
                >
                  {sourceField.question}
                  <span className="text-xs text-gray-500 ml-1">
                    ({sourceField.type})
                  </span>
                </option>
              ))}
              {availableFields.length === 0 && (
                <option disabled value="">
                  No available source fields. Add text or choice fields first.
                </option>
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Prompt
          </label>
          <textarea
            value={currentConfig.customPrompt}
            onChange={(e) => updateField(field.id, {
              aiConfig: {
                ...currentConfig,
                customPrompt: e.target.value
              }
            })}
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Example: Based on the responses to the selected questions, provide a safety recommendation..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            value={currentConfig.model}
            onChange={(e) => updateField(field.id, {
              aiConfig: {
                ...currentConfig,
                model: e.target.value as 'gpt-4' | 'gpt-3.5-turbo' | 'company-model'
              }
            })}
            className="w-full p-2 border rounded-md"
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="company-model">Company Model</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Tokens
          </label>
          <input
            type="number"
            value={currentConfig.maxTokens}
            onChange={(e) => updateField(field.id, {
              aiConfig: {
                ...currentConfig,
                maxTokens: Number(e.target.value)
              }
            })}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateField(field.id, {
              aiConfig: {
                ...currentConfig,
                useSpeechToText: !currentConfig.useSpeechToText
              }
            })}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              currentConfig.useSpeechToText
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Speech to Text
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Button Label
          </label>
          <input
            type="text"
            value={currentConfig.buttonLabel}
            onChange={(e) => updateField(field.id, {
              aiConfig: {
                ...currentConfig,
                buttonLabel: e.target.value
              }
            })}
            className="w-full p-2 border rounded-md"
            placeholder="Generate Recommendation"
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {template?.name || 'Template Builder'}
            </h1>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Template
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                  <GripVertical className="text-gray-400 cursor-move" />
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    className="flex-1 p-2 border rounded-md"
                    placeholder="Enter section title..."
                  />
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="space-y-4 ml-8">
                  {fields
                    .filter(field => field.sectionId === section.id)
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <GripVertical className="text-gray-400 cursor-move" />
                          <input
                            type="text"
                            value={field.question}
                            onChange={(e) => updateField(field.id, { question: e.target.value })}
                            className="flex-1 p-2 border rounded-md"
                            placeholder={field.type === 'instruction' ? "Enter instructions..." : "Enter question..."}
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value })}
                            className="p-2 border rounded-md"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="yesNo">Yes/No</option>
                            <option value="multipleChoice">Multiple Choice</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="date">Date</option>
                            <option value="slider">Slider</option>
                            <option value="instruction">Instructions</option>
                          </select>
                          <button
                            onClick={() => duplicateField(field)}
                            className="p-2 text-gray-500 hover:text-gray-700"
                            title="Duplicate"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => deleteField(field.id)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateField(field.id, { required: !field.required })}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              field.required
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Required
                          </button>
                          <button
                            type="button"
                            onClick={() => updateField(field.id, { hasNotes: !field.hasNotes })}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              field.hasNotes
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Notes
                          </button>
                          <button
                            type="button"
                            onClick={() => updateField(field.id, { hasPhoto: !field.hasPhoto })}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              field.hasPhoto
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Photos
                          </button>
                        </div>

                        {renderFieldOptionsEditor(field)}

                        {field.type === 'slider' && (
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Min</label>
                              <input
                                type="number"
                                value={field.sliderMin}
                                onChange={(e) => updateField(field.id, { sliderMin: Number(e.target.value) })}
                                className="mt-1 p-2 border rounded-md w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Max</label>
                              <input
                                type="number"
                                value={field.sliderMax}
                                onChange={(e) => updateField(field.id, { sliderMax: Number(e.target.value) })}
                                className="mt-1 p-2 border rounded-md w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Step</label>
                              <input
                                type="number"
                                value={field.sliderStep}
                                onChange={(e) => updateField(field.id, { sliderStep: Number(e.target.value) })}
                                className="mt-1 p-2 border rounded-md w-full"
                              />
                            </div>
                          </div>
                        )}

                        {renderAIConfigEditor(field)}
                      </div>
                    ))}

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                    {[
                      { type: 'text', label: 'Text' },
                      { type: 'yesNo', label: 'Yes/No' },
                      { type: 'multipleChoice', label: 'Multiple Choice' },
                      { type: 'checkbox', label: 'Checkbox' },
                      { type: 'number', label: 'Number' },
                      { type: 'date', label: 'Date' },
                      { type: 'slider', label: 'Slider' },
                      { type: 'instruction', label: 'Instructions' },
                      { type: 'aiRecommendation', label: 'AI Recommendation', color: 'violet' }
                    ].map(({ type, label, color = 'blue' }) => (
                      <button
                        key={type}
                        onClick={() => addField(section.id, type)}
                        className={`px-3 py-1 text-sm ${
                          color === 'violet' 
                            ? 'bg-violet-500 hover:bg-violet-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white rounded`}
                      >
                        Add {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addSection}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
            >
              Add Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder; 