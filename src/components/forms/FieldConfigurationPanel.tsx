import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Field, FieldType } from '@/lib/types';

interface FieldConfigurationPanelProps {
  field: Field;
  onUpdate: (updates: Partial<Field>) => void;
}

export function FieldConfigurationPanel({ field, onUpdate }: FieldConfigurationPanelProps) {
  const handleSettingChange = (settingKey: string, value: boolean) => {
    onUpdate({
      settings: {
        ...field.settings,
        [settingKey]: value,
      },
    });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-md">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${field.id}-required`} className="text-sm font-medium">
          Required
        </Label>
        <Switch
          id={`${field.id}-required`}
          checked={field.required}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor={`${field.id}-ai-enabled`} className="text-sm font-medium">
          AI Enabled
        </Label>
        <Switch
          id={`${field.id}-ai-enabled`}
          checked={field.aiEnabled}
          onCheckedChange={(checked) => onUpdate({ aiEnabled: checked })}
        />
      </div>

      {field.type !== FieldType.INSTRUCTION && (
        <>
          <div className="flex items-center justify-between">
            <Label htmlFor={`${field.id}-allow-photos`} className="text-sm font-medium">
              Allow Photo Attachments
            </Label>
            <Switch
              id={`${field.id}-allow-photos`}
              checked={field.settings?.allowPhotos || false}
              onCheckedChange={(checked) => handleSettingChange('allowPhotos', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`${field.id}-allow-notes`} className="text-sm font-medium">
              Allow Additional Notes
            </Label>
            <Switch
              id={`${field.id}-allow-notes`}
              checked={field.settings?.allowNotes || false}
              onCheckedChange={(checked) => handleSettingChange('allowNotes', checked)}
            />
          </div>
        </>
      )}
    </div>
  );
}