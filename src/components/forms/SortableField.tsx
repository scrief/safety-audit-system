'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Field } from '@/types/fields';
import { FieldEditor } from './FieldEditor';

interface SortableFieldProps {
  field: Field;
  onUpdate: (field: Field) => void;
  onDelete: (fieldId: string) => void;
  availableFields: Field[];
}

export function SortableField({ field, onUpdate, onDelete, availableFields }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative ${isDragging ? 'z-50' : 'z-0'}`}
    >
      <div
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 cursor-move flex items-center justify-center hover:bg-gray-100 rounded-l"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      <div className="pl-8">
        <FieldEditor
          field={field}
          availableFields={availableFields}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export default SortableField;