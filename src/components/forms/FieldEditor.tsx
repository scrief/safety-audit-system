'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Camera, FileText, Trash2, Award, GitBranch } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Field, FieldType, FieldOption } from '@/lib/types';

interface FieldEditorProps {
  field: Field;
  onUpdate: (field: Field) => void;
  onDelete: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onUpdate, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');

  const handleTypeChange = (newType: FieldType) => {
    onUpdate({
      ...field,
      type: newType,
      options: newType === FieldType.MULTIPLE_CHOICE ? [] : null
    });
  };

  const addOption = () => {
    if (!newOptionText.trim()) return;
    
    const newOption: FieldOption = {
      id: crypto.randomUUID(),
      text: newOptionText,
      value: newOptionText.toLowerCase().replace(/\s+/g, '_'),
      isCorrect: false
    };

    onUpdate({
      ...field,
      options: [...(field.options || []), newOption]
    });

    setNewOptionText('');
  };

  const removeOption = (optionId: string) => {
    onUpdate({
      ...field,
      options: field.options?.filter(opt => opt.id !== optionId) || []
    });
  };

  const toggleOptionCorrect = (optionId: string) => {
    onUpdate({
      ...field,
      options: field.options?.map(opt => 
        opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      ) || []
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-4">
          <div>
            <Label>Question</Label>
            <Input
              defaultValue={field.question}
              onChange={(e) => onUpdate({ ...field, question: e.target.value })}
              placeholder="Enter your question"
            />
          </div>

          <div>
            <Label>Field Type</Label>
            <Select 
              defaultValue={field.type}
              onValueChange={(value) => handleTypeChange(value as FieldType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FieldType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ ...field, required: checked })}
              />
              <Label>Required</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={field.aiEnabled}
                onCheckedChange={(checked) => onUpdate({ ...field, aiEnabled: checked })}
              />
              <Label>AI Enabled</Label>
            </div>
          </div>

          {field.type === FieldType.MULTIPLE_CHOICE && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      defaultValue={option.text}
                      onChange={(e) => {
                        onUpdate({
                          ...field,
                          options: field.options?.map(opt =>
                            opt.id === option.id
                              ? { ...opt, text: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }
                              : opt
                          )
                        });
                      }}
                    />
                    <Switch
                      checked={option.isCorrect}
                      onCheckedChange={() => toggleOptionCorrect(option.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    defaultValue={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="New option"
                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                  />
                  <Button onClick={addOption}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default FieldEditor;
