// src/components/forms/FormSection.tsx
'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Section, Field, FieldType } from '@/lib/types'
import { SortableField } from './SortableField'

interface FormSectionProps {
  section: Section
  onUpdate: (section: Section) => void
  onDelete: (sectionId: string) => void
}

export function FormSection({ section, onUpdate, onDelete }: FormSectionProps) {
  const addField = () => {
    console.log('Add Field button clicked');
    // Create new field with explicit FieldType.TEXT
    const newField: Field = {
      id: crypto.randomUUID(),
      sectionId: section.id,
      type: FieldType.TEXT as FieldType, // Explicit type casting
      question: '',
      required: false,
      order: section.fields.length,
      aiEnabled: false,
      options: null,
      settings: null,
      scoring: null
    }
    console.log('New field created:', newField);
    
    // Validate the field type
    if (!Object.values(FieldType).includes(newField.type)) {
      console.error('Invalid field type created:', newField.type);
      return;
    }
    
    console.log('Current section:', section);
    onUpdate({
      ...section,
      fields: [...section.fields, newField]
    })
    console.log('Update called with new field');
  }

  return (
    <Card>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            className="text-lg font-medium p-2 border rounded-md"
          />
          <div className="space-x-2">
            <Button
              onClick={addField}
              variant="default"
            >
              Add Field
            </Button>
            <Button
              onClick={() => onDelete(section.id)}
              variant="destructive"
            >
              Delete Section
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {section.fields.map((field) => (
            <SortableField
              key={field.id}
              field={field}
              onUpdate={(updatedField) => {
                onUpdate({
                  ...section,
                  fields: section.fields.map(f =>
                    f.id === updatedField.id ? updatedField : f
                  )
                })
              }}
              onDelete={(fieldId) => {
                onUpdate({
                  ...section,
                  fields: section.fields.filter(f => f.id !== fieldId)
                })
              }}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}