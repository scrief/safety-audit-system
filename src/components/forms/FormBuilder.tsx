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
import { toast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface FormBuilderProps {
  template: Template;
  onSave: (template: Template) => Promise<void>;
  onCancel: () => void;
}

export function FormBuilder({ template: initialTemplate, onSave, onCancel }: FormBuilderProps) {
  const { data: session } = useSession();
  const { setUnsavedChanges } = useNavigationManager();
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
    setUnsavedChanges(true);
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections((prev) => {
      const newSections = prev.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            ...updates,
            fields: updates.fields || section.fields,
            weight: updates.weight || section.weight || 1,
          };
        }
        return section;
      });
      return newSections;
    });
    setUnsavedChanges(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections((prev) =>
      prev.filter((section) => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))
    );
    setUnsavedChanges(true);
  };

  const validateTemplate = (): string | null => {
    try {
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
        
        if (!section.title?.trim()) {
          return `Section ${i + 1} must have a title`;
        }

        if (section.fields.length === 0) {
          return `Section "${section.title}" must have at least one field`;
        }

        for (let j = 0; j < section.fields.length; j++) {
          const field = section.fields[j];
          
          if (!field.question?.trim()) {
            return `Field ${j + 1} in section "${section.title}" must have a question`;
          }

          if (!field.type) {
            return `Field "${field.question}" in section "${section.title}" must have a type`;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Validation error:', error);
      return 'An error occurred during validation';
    }
  };

  const handleSave = async () => {
    try {
      console.log('[FormBuilder] Starting save process...');
      console.log('Session data:', session); // Log session data
      setError(null);
      setIsSaving(true);

      // Validate the template first
      console.log('[FormBuilder] Validating template...');
      const validationError = validateTemplate();
      if (validationError) {
        throw new Error(validationError);
      }

      // Retrieve userId from session
      const userId = session?.user?.id;
      console.log('User ID:', userId); // Log userId
      if (!userId) {
        throw new Error('User ID is not available');
      }

      // Create the updated template
      console.log('[FormBuilder] Creating updated template...');
      const updatedTemplate: Template = {
        id: initialTemplate.id,
        name: templateName,
        description: templateDescription,
        userId: userId, // Use userId from session
        sections: sections.map(section => ({
          id: section.id,
          title: section.title,
          description: section.description,
          weight: section.weight,
          fields: section.fields.map(field => ({
            id: field.id,
            type: field.type,
            question: field.question,
            description: field.description,
            required: field.required,
            aiEnabled: field.aiEnabled,
            options: Array.isArray(field.options) ? field.options : [],
            settings: field.settings,
            scoring: field.scoring
          }))
        }))
      };

      // Log the template data for debugging
      console.log('[FormBuilder] Template to save:', JSON.stringify(updatedTemplate, null, 2));

      // Call the save function
      console.log('[FormBuilder] Calling onSave function...');
      await onSave(updatedTemplate);

      // Success notification
      console.log('[FormBuilder] Save successful');
      toast({
        title: "Success",
        description: "Template saved successfully",
      });

      setUnsavedChanges(false);
    } catch (error) {
      console.error('[FormBuilder] Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!hasUnsavedChanges || window.confirm('Are you sure you want to discard your changes?')) {
      setUnsavedChanges(false);
      onCancel();
    }
  };

  const hasUnsavedChanges = sections.some((section, index) => {
    const initialSection = initialTemplate.sections?.[index];
    return (
      section.title !== initialSection?.title ||
      section.description !== initialSection?.description ||
      section.weight !== initialSection?.weight ||
      JSON.stringify(section.fields) !== JSON.stringify(initialSection?.fields)
    );
  }) || templateName !== initialTemplate.name || templateDescription !== initialTemplate.description;

  useEffect(() => {
    setUnsavedChanges(hasUnsavedChanges);
  }, [sections, templateName, templateDescription, initialTemplate, setUnsavedChanges, hasUnsavedChanges]);

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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
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