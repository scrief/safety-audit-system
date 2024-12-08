'use client';

import React, { useState } from 'react';
import { Field, FieldType } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { PhotoUpload } from './PhotoUpload';
import { NotesField } from './NotesField';
import { Camera, FileText } from 'lucide-react';

interface AuditFieldProps {
  field: Field;
  value: any;
  onChange: (value: any) => void;
  onPhotosChange: (photos: File[]) => void;
  onNotesChange: (notes: string) => void;
  photos?: File[];
  notes?: string;
  error?: string;
  disabled?: boolean;
}

export function AuditField({
  field,
  value,
  onChange,
  onPhotosChange,
  onNotesChange,
  photos = [],
  notes = '',
  error,
  disabled = false
}: AuditFieldProps) {
  const [showPhotos, setShowPhotos] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const renderFieldInput = () => {
    switch (field.type) {
      case FieldType.TEXT:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer"
            disabled={disabled}
          />
        );

      case FieldType.NUMBER:
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter a number"
            disabled={disabled}
          />
        );

      case FieldType.YES_NO:
        return (
          <div className="flex items-center gap-4">
            <Button
              variant={value === true ? "default" : "outline"}
              onClick={() => onChange(true)}
              disabled={disabled}
            >
              Yes
            </Button>
            <Button
              variant={value === false ? "default" : "outline"}
              onClick={() => onChange(false)}
              disabled={disabled}
            >
              No
            </Button>
          </div>
        );

      case FieldType.MULTIPLE_CHOICE:
        return (
          <Select
            value={value}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case FieldType.CHECKBOX:
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`field-${field.id}`}
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
            <Label
              htmlFor={`field-${field.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.question}
            </Label>
          </div>
        );

      case FieldType.DATE:
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );

      case FieldType.SLIDER:
        const settings = field.settings?.slider || { min: 0, max: 100, step: 1 };
        const sliderValue = typeof value === 'number' ? value : settings.min;
        return (
          <div className="space-y-4">
            <Slider
              type="range"
              value={sliderValue}
              min={settings.min}
              max={settings.max}
              step={settings.step}
              onChange={(e) => onChange(Number(e.target.value))}
              disabled={disabled}
            />
            <div className="text-sm text-gray-500 text-center">
              Value: {sliderValue}
            </div>
          </div>
        );

      case FieldType.INSTRUCTION:
        return (
          <div className="text-gray-600 italic">
            {field.question}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            {field.question}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {field.type !== FieldType.INSTRUCTION && (
            <div className="flex items-center gap-2">
              {field.settings?.allowPhotos && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPhotos(!showPhotos)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {photos.length > 0 ? `Photos (${photos.length})` : 'Add Photos'}
                </Button>
              )}
              
              {field.settings?.allowNotes && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {notes ? 'Edit Notes' : 'Add Notes'}
                </Button>
              )}
            </div>
          )}
        </div>

        {renderFieldInput()}

        {error && (
          <div className="text-red-500 text-sm mt-1">
            {error}
          </div>
        )}

        {showPhotos && field.settings?.allowPhotos && (
          <div className="mt-4">
            <PhotoUpload
              fieldId={field.id}
              maxPhotos={field.settings?.maxPhotos || 5}
              value={photos}
              onPhotosChange={onPhotosChange}
            />
          </div>
        )}

        {showNotes && field.settings?.allowNotes && (
          <div className="mt-4">
            <NotesField
              fieldId={field.id}
              label={field.settings?.notesLabel || 'Additional Notes'}
              value={notes}
              onChange={onNotesChange}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export default AuditField;