"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Field } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SortableFieldProps {
  field: Field;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
}

export function SortableField({ field, onUpdate, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: field.id,
    data: {
      type: 'field',
      field
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 'auto'
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-move p-1 hover:bg-gray-100 rounded-md flex-shrink-0"
              aria-label="Drag handle"
            >
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </div>
            {/* Question input container */}
            <div className="w-[740px]">
              <input
                type="text"
                value={field.question}
                onChange={(e) => onUpdate({ question: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-400 bg-white"
                placeholder="Enter question"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={field.type}
              onChange={(e) => onUpdate({ type: e.target.value as Field['type'] })}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
              <option value="date">Date</option>
              <option value="file">File Upload</option>
            </select>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`required-${field.id}`}
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`required-${field.id}`} className="text-sm text-gray-600">
                Required
              </label>
            </div>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
        {field.type === 'select' && (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={field.options?.join(', ') || ''}
                onChange={(e) => onUpdate({ options: e.target.value.split(',').map(s => s.trim()) })}
                className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter options (comma-separated)"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
