'use client';

import React, { useState } from 'react';
import { Field, FieldType } from '@/types/fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from './ImageUpload';
import { Camera, FileText } from 'lucide-react';

interface QuestionRendererProps {
  field: Field;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function QuestionRenderer({ field, value, onChange, disabled = false }: QuestionRendererProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  const handleValueChange = (newValue: any) => {
    onChange({
      ...value,
      answer: newValue
    });
  };

  const handleNotesChange = (notes: string) => {
    onChange({
      ...value,
      notes
    });
  };

  const handlePhotoChange = (photos: string[]) => {
    onChange({
      ...value,
      photos
    });
  };

  const shouldShowQuestion = () => {
    if (!field.settings?.logic) return true;
    return true;
  };

  if (!shouldShowQuestion()) return null;

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium">
          {field.question}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </h3>

        {field.type === FieldType.TEXT && (
          <div className="space-y-4">
            <Textarea
              value={value?.answer || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              disabled={disabled}
              placeholder="Enter your answer"
              className="w-full"
            />
          </div>
        )}

        {field.type === FieldType.MULTIPLE_CHOICE && (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`${field.id}-${option.id}`}
                  name={field.id}
                  value={option.value}
                  checked={value?.answer === option.value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <label htmlFor={`${field.id}-${option.id}`}>
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        )}

        {field.type === FieldType.CHECKBOX && (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`${field.id}-${option.id}`}
                  value={option.value}
                  checked={value?.answer?.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value?.answer || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    handleValueChange(newValues);
                  }}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <label htmlFor={`${field.id}-${option.id}`}>
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        )}

        {field.type === FieldType.AI_RECOMMENDATION && (
          <div className="space-y-2">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                AI recommendation will be generated based on your answers to the linked questions.
              </p>
            </div>
            {value?.answer && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p>{value.answer}</p>
              </div>
            )}
          </div>
        )}

        {(field.settings?.allowNotes || field.settings?.allowPhotos) && (
          <div className="flex gap-2 mt-4">
            {field.settings?.allowNotes && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNotes(!showNotes)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {showNotes ? 'Hide' : 'Show'} Notes
              </Button>
            )}

            {field.settings?.allowPhotos && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPhotos(!showPhotos)}
              >
                <Camera className="h-4 w-4 mr-2" />
                {showPhotos ? 'Hide' : 'Show'} Photos
              </Button>
            )}
          </div>
        )}

        {showNotes && field.settings?.allowNotes && (
          <div className="mt-4">
            <Textarea
              value={value?.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              disabled={disabled}
              placeholder="Enter additional notes..."
              className="w-full"
            />
          </div>
        )}

        {showPhotos && field.settings?.allowPhotos && (
          <div className="mt-4">
            <ImageUpload
              value={value?.photos || []}
              onChange={handlePhotoChange}
              maxFiles={5}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export default QuestionRenderer;