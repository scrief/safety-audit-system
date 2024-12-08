import React from 'react';
import { Label } from '@/components/ui/label';

interface NotesFieldProps {
  fieldId: string;
  label?: string;
  value?: string;
  onChange: (value: string) => void;
}

export function NotesField({ fieldId, label = 'Additional Notes', value = '', onChange }: NotesFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`notes-${fieldId}`} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <textarea
        id={`notes-${fieldId}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter any additional notes or observations..."
      />
    </div>
  );
}