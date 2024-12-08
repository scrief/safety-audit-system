"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, useSensors, useSensor, PointerSensor, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Section, FieldType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SortableField } from './SortableField';

interface SortableSectionProps {
  section: Section;
  onUpdate: (sectionId: string, updates: Partial<Section>) => void;
  onDelete: (sectionId: string) => void;
}

export function SortableSection({ section, onUpdate, onDelete }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: section.id,
    data: {
      type: 'section',
      section
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 999 : 'auto'
  };

  const handleAddField = () => {
    const fieldNumber = section.fields.length + 1;
    const newField = {
      id: crypto.randomUUID(),
      sectionId: section.id,
      type: FieldType.TEXT,
      question: `Question ${fieldNumber}`,
      required: false,
      order: section.fields.length,
      aiEnabled: false,
      options: null,
      settings: {
        allowNotes: false,
        allowPhotos: false,
        photoRequired: false,
        notesRequired: false,
        logic: [],
      },
      scoring: {
        points: 0,
        weight: 1,
        scoringMethod: 'binary',
      }
    };

    onUpdate(section.id, {
      fields: [...section.fields, newField]
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = section.fields.findIndex((f) => f.id === active.id);
      const newIndex = section.fields.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(section.fields, oldIndex, newIndex);
        onUpdate(section.id, {
          fields: newFields.map((field, index) => ({ ...field, order: index })),
        });
      }
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-move p-1 hover:bg-gray-100 rounded-md"
              aria-label="Drag handle"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </div>
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdate(section.id, { title: e.target.value })}
              className="text-lg font-semibold bg-transparent border-none focus:outline-none placeholder:pl-0"
              placeholder="Enter Section Title"
            />
          </div>
          <Button variant="destructive" onClick={(e) => {
            e.stopPropagation();
            onDelete(section.id);
          }}>
            Delete Section
          </Button>
        </div>
        
        <input
          type="text"
          value={section.description || ''}
          onChange={(e) => onUpdate(section.id, { description: e.target.value })}
          className="w-full mb-4 text-sm text-gray-500 bg-transparent border-none focus:outline-none placeholder:pl-0"
          placeholder="Enter section description (optional)"
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section Weight
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={section.weight || 1}
            onChange={(e) => onUpdate(section.id, { weight: parseFloat(e.target.value) || 1 })}
            className="w-32 p-1 border rounded"
          />
        </div>

        <DndContext
          sensors={useSensors(
            useSensor(PointerSensor, {
              activationConstraint: {
                distance: 3,
                tolerance: 5,
                delay: 50,
              },
            })
          )}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            <SortableContext
              items={section.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {section.fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  availableFields={section.fields}
                  onUpdate={(updates) =>
                    onUpdate(section.id, {
                      fields: section.fields.map((f) =>
                        f.id === field.id ? { ...f, ...updates } : f
                      ),
                    })
                  }
                  onDelete={() =>
                    onUpdate(section.id, {
                      fields: section.fields.filter((f) => f.id !== field.id),
                    })
                  }
                />
              ))}
            </SortableContext>
            <div>
              <Button
                type="button"
                variant="default"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddField();
                }}
              >
                Add Field
              </Button>
            </div>
          </div>
        </DndContext>
      </Card>
    </div>
  );
}