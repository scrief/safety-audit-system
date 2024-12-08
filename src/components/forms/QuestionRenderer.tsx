'use client';

import React, { useState } from 'react';
import { Field, FieldType } from '@/types/fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { ImageUpload } from './ImageUpload';
import { AlertCircle, Calendar, Camera, Check, FileText, Info, Wand } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface QuestionRendererProps {
  field: Field;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function QuestionRenderer({ field, value, onChange, disabled = false }: QuestionRendererProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { getRecommendation, isLoading, error } = useAIRecommendations();
  const [editableRecommendation, setEditableRecommendation] = useState(value?.aiRecommendation || '');

  const handleValueChange = (newValue: any) => {
    onChange({
      ...value,
      fieldId: field.id,
      value: newValue
    });
  };

  const handleNotesChange = (notes: string) => {
    onChange({
      ...value,
      fieldId: field.id,
      notes
    });
  };

  const handlePhotosChange = (photos: string[]) => {
    onChange({
      ...value,
      fieldId: field.id,
      photos
    });
  };

  const handleGetRecommendation = async () => {
    if (!value?.value) return;

    try {
      const recommendation = await getRecommendation(value.value, field);
      setEditableRecommendation(recommendation);
      onChange({
        ...value,
        fieldId: field.id,
        aiRecommendation: recommendation
      });
    } catch (err) {
      console.error('Error getting AI recommendation:', err);
    }
  };

  const handleSaveEdit = () => {
    onChange({
      ...value,
      fieldId: field.id,
      aiRecommendation: editableRecommendation
    });
    setIsEditing(false);
  };

  const renderField = () => {
    switch (field.type) {
      case FieldType.TEXT:
        return (
          <Textarea
            value={value?.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter your answer"
            className="w-full"
          />
        );

      case FieldType.NUMBER:
        return (
          <Input
            type="number"
            value={value?.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter a number"
            min={field.settings?.min}
            max={field.settings?.max}
            step={field.settings?.step || 1}
            className="w-full"
          />
        );

      case FieldType.YES_NO:
        return (
          <div className="flex gap-4">
            <Button
              type="button"
              variant={value?.value === 'yes' ? 'default' : 'outline'}
              onClick={() => handleValueChange('yes')}
              disabled={disabled}
              className="flex-1 sm:flex-none"
            >
              {value?.value === 'yes' && (
                <Check className="mr-2 h-4 w-4" />
              )}
              Yes
            </Button>
            <Button
              type="button"
              variant={value?.value === 'no' ? 'default' : 'outline'}
              onClick={() => handleValueChange('no')}
              disabled={disabled}
              className="flex-1 sm:flex-none"
            >
              {value?.value === 'no' && (
                <Check className="mr-2 h-4 w-4" />
              )}
              No
            </Button>
          </div>
        );

      case FieldType.MULTIPLE_CHOICE:
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => {
              const isSelected = value?.value === option.value;
              return (
                <Button
                  key={`${field.id}-${option.value || index}`}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleValueChange(option.value)}
                  disabled={disabled}
                  className="w-full justify-start"
                >
                  {isSelected && (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {option.label || option.value}
                </Button>
              );
            })}
          </div>
        );

      case FieldType.CHECKLIST:
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => {
              const currentValues = Array.isArray(value?.value) ? value.value : [];
              const isChecked = currentValues.includes(option.value);
              return (
                <Button
                  key={`${field.id}-${option.value || index}`}
                  type="button"
                  onClick={() => {
                    const newValues = isChecked
                      ? currentValues.filter((v: string) => v !== option.value)
                      : [...currentValues, option.value];
                    handleValueChange(newValues);
                  }}
                  disabled={disabled}
                  variant={isChecked ? 'default' : 'outline'}
                  className="w-full justify-start"
                >
                  {isChecked && (
                    <Check className="mr-2 h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{option.label || option.value}</span>
                </Button>
              );
            })}
          </div>
        );

      case FieldType.CHECKBOX:
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value?.value || false}
              onCheckedChange={(checked) => handleValueChange(checked)}
              disabled={disabled}
            />
            <Label className="text-sm font-medium">
              {field.question}
            </Label>
          </div>
        );

      case FieldType.DATE:
        return (
          <div className="relative">
            <Input
              type="date"
              value={value?.value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              disabled={disabled}
              className="w-full"
              min={field.settings?.minDate}
              max={field.settings?.maxDate}
            />
            <Calendar className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        );

      case FieldType.SLIDER:
        const sliderSettings = field.settings?.slider || { min: 0, max: 100, step: 1 };
        return (
          <div className="space-y-4">
            <div>
              <Slider
                value={[value?.value ?? sliderSettings.min]}
                min={sliderSettings.min}
                max={sliderSettings.max}
                step={sliderSettings.step}
                onValueChange={([val]) => handleValueChange(val)}
                disabled={disabled}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{sliderSettings.minLabel || sliderSettings.min}</span>
              <span>{sliderSettings.maxLabel || sliderSettings.max}</span>
            </div>
          </div>
        );

      case FieldType.INSTRUCTION:
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              {field.question}
            </div>
          </div>
        );

      default:
        return <div>Unsupported field type: {field.type}</div>;
    }
  };

  if (!field) return null;

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        {field.type !== FieldType.INSTRUCTION && (
          <h3 className="font-medium">
            {field.question}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        )}

        {renderField()}

        {field.type !== FieldType.INSTRUCTION && field.aiEnabled && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleGetRecommendation}
                disabled={disabled || isLoading || !value?.value}
                className="flex items-center gap-2"
              >
                <Wand className="h-4 w-4" />
                {isLoading ? 'Generating...' : 'Get AI Recommendation'}
              </Button>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            {value?.aiRecommendation && (
              <div className="bg-blue-50 p-4 rounded-md">
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editableRecommendation}
                      onChange={(e) => setEditableRecommendation(e.target.value)}
                      className="w-full"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditableRecommendation(value.aiRecommendation);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>{value.aiRecommendation}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="mt-2"
                    >
                      Edit Recommendation
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {field.type !== FieldType.INSTRUCTION && (field.settings?.allowNotes || field.settings?.allowPhotos) && (
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
              onChange={(photos) => handlePhotosChange(photos)}
              maxFiles={5}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export default QuestionRenderer;