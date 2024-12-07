"use client";

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Section, Field, Template, FieldType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SortableSection } from './SortableSection';
import { AddSectionDialog } from './AddSectionDialog';
import { useNavigationManager } from '@/hooks/useNavigationManager';

interface FormBuilderProps {
  template: Template;
  onSave: (template: Template) => Promise<void>;
  onCancel: () => void;
}

export function FormBuilder({ template: initialTemplate, onSave, onCancel }: FormBuilderProps) {
  const { setUnsavedChanges, navigate } = useNavigationManager();
  const [sections, setSections] = useState<Section[]>(initialTemplate?.sections || []);
  const [isAddingSections, setIsAddingSections] = useState(false);
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
  const [templateDescription, setTemplateDescription] = useState(initialTemplate?.description || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        tolerance: 5,
        delay: 50,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return items;

        return arrayMove(items, oldIndex, newIndex).map((section, index) => ({
          ...section,
          order: index,
        }));
      });
    }
  };

  const handleAddSection = (section: Omit<Section, 'id' | 'order' | 'fields'>) => {
    const newSection: Section = {
      ...section,
      id: crypto.randomUUID(),
      order: sections.length,
      fields: [],
      weight: section.weight || 1,
    };

    setSections((prev) => [...prev, newSection]);
    setIsAddingSections(false);
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
    console.log('Updating section:', { sectionId, updates });
    setSections((prev) => {
      const newSections = prev.map((section) => {
        if (section.id === sectionId) {
          const updatedSection = {
            ...section,
            ...updates,
            fields: updates.fields || section.fields,
            weight: updates.weight || section.weight || 1,
          };
          console.log('Updated section:', updatedSection);
          return updatedSection;
        }
        return section;
      });
      console.log('Updated sections:', newSections);
      return newSections;
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections((prev) =>
      prev.filter((section) => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))
    );
  };

  const validateTemplate = (): string | null => {
    // Validate template name and description
    if (!templateName.trim()) {
      return 'Template name is required';
    }
    if (!templateDescription.trim()) {
      return 'Template description is required';
    }

    // Validate sections
    if (sections.length === 0) {
      return 'Template must have at least one section';
    }

    // Validate each section and its fields
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      if (!section.title.trim()) {
        return `Section ${i + 1} must have a title`;
      }

      if (section.fields.length === 0) {
        return `Section "${section.title}" must have at least one field`;
      }

      for (let j = 0; j < section.fields.length; j++) {
        const field = section.fields[j];
        
        if (!field.question.trim()) {
          return `Field ${j + 1} in section "${section.title}" must have a question`;
        }

        if (!field.type) {
          return `Field "${field.question}" in section "${section.title}" must have a type`;
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    try {
      setError(null);
      setIsSaving(true);

      // Validate the template
      const validationError = validateTemplate();
      if (validationError) {
        setError(validationError);
        return;
      }

      const updatedTemplate: Template = {
        ...initialTemplate,
        name: templateName.trim(),
        description: templateDescription.trim(),
        sections: sections.map((section, index) => ({
          ...section,
          title: section.title.trim(),
          order: index,
          weight: section.weight || 1,
          fields: section.fields.map((field, fieldIndex) => ({
            ...field,
            question: field.question.trim(),
            order: fieldIndex,
            type: field.type,
            required: Boolean(field.required),
            aiEnabled: Boolean(field.aiEnabled),
            options: field.options || [],
            settings: field.settings || {},
            scoring: field.scoring || {},
          })),
        })),
      };

      await onSave(updatedTemplate);
      setUnsavedChanges(false);
      navigate('/forms', true);
    } catch (error) {
      console.error('Error saving template:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    await navigate('/forms');
  };

  useEffect(() => {
    const hasChanges = sections.some((section, index) => {
      const initialSection = initialTemplate.sections?.[index];
      return (
        section.title !== initialSection?.title ||
        section.description !== initialSection?.description ||
        section.weight !== initialSection?.weight ||
        JSON.stringify(section.fields) !== JSON.stringify(initialSection?.fields)
      );
    }) || templateName !== initialTemplate.name || templateDescription !== initialTemplate.description;

    setUnsavedChanges(hasChanges);
  }, [sections, templateName, templateDescription, initialTemplate, setUnsavedChanges]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {templateName ? `Edit Template: ${templateName}` : 'Create New Template'}
        </h1>
        <div className="space-x-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setError(null);
              }}
              className={`text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 placeholder:pl-0 w-full ${
                error && !templateName.trim() ? 'ring-2 ring-red-500' : ''
              }`}
              placeholder="Enter template name"
            />
            <textarea
              value={templateDescription}
              onChange={(e) => {
                setTemplateDescription(e.target.value);
                setError(null);
              }}
              className={`w-full text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 ${
                error && !templateDescription.trim() ? 'ring-2 ring-red-500' : ''
              }`}
              placeholder="Enter template description"
              rows={2}
            />
          </div>
          <div className="space-x-2">
            <Button onClick={() => setIsAddingSections(true)}>
              Add Section
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onUpdate={handleUpdateSection}
                onDelete={handleDeleteSection}
              />
            ))}
          </SortableContext>
        </DndContext>

        <AddSectionDialog
          isOpen={isAddingSections}
          onClose={() => setIsAddingSections(false)}
          onAdd={handleAddSection}
        />
      </div>
    </div>
  );
}