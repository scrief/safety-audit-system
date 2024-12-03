// src/components/forms/AuditForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Audit, Template, AuditResponse, Field } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { ImageUpload } from './ImageUpload';

interface AuditFormProps {
  template: Template;
  initialData?: Audit;
  onSave: (data: Partial<Audit>) => Promise<void>;
  onComplete: (data: Audit) => Promise<void>;
}

export function AuditForm({ template, initialData, onSave, onComplete }: AuditFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<Audit>({
    defaultValues: initialData || {
      responses: {},
      status: 'draft',
    },
  });

  const [activeSection, setActiveSection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { getRecommendation } = useAIRecommendations();

  const handleSave = async (data: Audit) => {
    setIsSaving(true);
    try {
      await onSave(data);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (data: Audit) => {
    const confirmed = window.confirm('Are you sure you want to complete this audit?');
    if (confirmed) {
      await onComplete(data);
    }
  };

  const handleAIRecommendation = async (field: Field, value: string) => {
    if (field.aiEnabled && value) {
      const recommendation = await getRecommendation(value, field);
      setValue(`responses.${field.id}.aiRecommendation`, recommendation);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleComplete)} className="space-y-6">
      {/* Section Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-4">
        {template.sections.map((section, index) => (
          <Button
            key={section.id}
            variant={activeSection === index ? 'default' : 'outline'}
            onClick={() => setActiveSection(index)}
            type="button"
          >
            {section.title}
          </Button>
        ))}
      </div>

      {/* Active Section */}
      <Card>
        <h2 className="text-xl font-bold mb-4">
          {template.sections[activeSection].title}
        </h2>

        <div className="space-y-6">
          {template.sections[activeSection].fields.map((field) => (
            <div key={field.id} className="space-y-4">
              <label className="block">
                <span className="text-gray-700">
                  {field.question}
                  {field.required && <span className="text-red-500">*</span>}
                </span>

                {/* Field Input Based on Type */}
                {renderField(field, {
                  register,
                  watch,
                  setValue,
                  onAIRecommendation: handleAIRecommendation,
                })}
              </label>

              {/* AI Recommendation Display */}
              {field.aiEnabled && watch(`responses.${field.id}.aiRecommendation`) && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-800">AI Safety Recommendation:</h4>
                  <p className="text-blue-700">
                    {watch(`responses.${field.id}.aiRecommendation`)}
                  </p>
                </div>
              )}

              {/* Image Upload */}
              <ImageUpload
                value={watch(`responses.${field.id}.photos`) || []}
                onChange={(urls) => setValue(`responses.${field.id}.photos`, urls)}
                maxFiles={5}
              />

              {/* Notes */}
              <textarea
                {...register(`responses.${field.id}.notes`)}
                placeholder="Additional notes..."
                className="w-full p-2 border rounded"
                rows={2}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Navigation and Actions */}
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button
            type="button"
            variant="outline"
            disabled={activeSection === 0}
            onClick={() => setActiveSection(prev => prev - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={activeSection === template.sections.length - 1}
            onClick={() => setActiveSection(prev => prev + 1)}
          >
            Next
          </Button>
        </div>

        <div className="space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(handleSave)()}
            disabled={isSaving}
          >
            Save Draft
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
          >
            Complete Audit
          </Button>
        </div>
      </div>
    </form>
  );
}

// Helper function to render different field types
function renderField(
  field: Field,
  {
    register,
    watch,
    setValue,
    onAIRecommendation,
  }: {
    register: any;
    watch: any;
    setValue: any;
    onAIRecommendation: (field: Field, value: string) => Promise<void>;
  }
) {
  const baseProps = {
    ...register(`responses.${field.id}.value`, {
      required: field.required,
    }),
    className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50",
  };

  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          {...baseProps}
          onChange={(e) => {
            baseProps.onChange(e);
            onAIRecommendation(field, e.target.value);
          }}
        />
      );

    case 'number':
      return <input type="number" {...baseProps} />;

    case 'yesNo':
      return (
        <select {...baseProps}>
          <option value="">Select...</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      );

    case 'multipleChoice':
      return (
        <select {...baseProps}>
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          {field.settings?.checkboxOptions?.map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                value={option}
                {...register(`responses.${field.id}.value`)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2">{option}</span>
            </label>
          ))}
        </div>
      );

    case 'date':
      return <input type="date" {...baseProps} />;

    case 'slider':
      return (
        <div className="space-y-2">
          <input
            type="range"
            min={field.settings?.sliderMin ?? 0}
            max={field.settings?.sliderMax ?? 100}
            step={field.settings?.sliderStep ?? 1}
            {...baseProps}
          />
          <div className="text-sm text-gray-500">
            Value: {watch(`responses.${field.id}.value`) ?? field.settings?.sliderMin ?? 0}
          </div>
        </div>
      );

    case 'instruction':
      return (
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-gray-700">{field.question}</p>
        </div>
      );

    default:
      return null;
  }
}