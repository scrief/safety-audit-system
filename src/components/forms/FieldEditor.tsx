'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Plus, Sparkles, Calculator } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FieldType, Field, FieldLogic, FieldScoring } from '@/lib/types';

interface FieldEditorProps {
  field: Field;
  availableFields: Field[];
  onUpdate: (updates: Partial<Field>) => void;
}

export function FieldEditor({ field, availableFields, onUpdate }: FieldEditorProps) {
  const handleLogicChange = (index: number, updates: Partial<FieldLogic>) => {
    const newLogic = [...(field.logic || [])];
    newLogic[index] = { ...newLogic[index], ...updates };
    onUpdate({ logic: newLogic });
  };

  const handleAddLogic = () => {
    const newLogic: FieldLogic = {
      id: crypto.randomUUID(),
      targetFieldId: '',
      condition: 'equals',
      value: '',
      action: 'show'
    };
    onUpdate({ logic: [...(field.logic || []), newLogic] });
  };

  const handleAISettingsUpdate = (updates: Partial<typeof field.settings.aiRecommendation>) => {
    onUpdate({
      settings: {
        ...field.settings,
        aiRecommendation: {
          ...(field.settings?.aiRecommendation || {}),
          ...updates
        }
      }
    });
  };

  const handleScoringUpdate = (updates: Partial<FieldScoring>) => {
    onUpdate({
      scoring: {
        ...(field.scoring || {}),
        ...updates
      }
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Configure Logic
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Logic Rules</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {(field.logic || []).map((logic, index) => (
              <div key={logic.id} className="p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>When Question</Label>
                    <Select
                      value={logic.targetFieldId}
                      onValueChange={(value) => handleLogicChange(index, { targetFieldId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a question..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields
                          .filter(f => f.id !== field.id)
                          .map(f => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.question}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Condition</Label>
                    <Select
                      value={logic.condition}
                      onValueChange={(value) => handleLogicChange(index, { 
                        condition: value as FieldLogic['condition']
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="notEquals">Does Not Equal</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greaterThan">Greater Than</SelectItem>
                        <SelectItem value="lessThan">Less Than</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Value</Label>
                    <Input
                      value={logic.value}
                      onChange={(e) => handleLogicChange(index, { value: e.target.value })}
                      placeholder="Enter value"
                    />
                  </div>

                  <div>
                    <Label>Action</Label>
                    <Select
                      value={logic.action}
                      onValueChange={(value) => handleLogicChange(index, { 
                        action: value as FieldLogic['action']
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show">Show this question</SelectItem>
                        <SelectItem value="hide">Hide this question</SelectItem>
                        <SelectItem value="require">Make this question required</SelectItem>
                        <SelectItem value="skip">Skip this question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={handleAddLogic}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Logic Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {field.type === FieldType.AI_RECOMMENDATION && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Configure AI Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>AI Recommendation Settings</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Custom Prompt</Label>
                <Textarea
                  value={field.settings?.aiRecommendation?.customPrompt || ''}
                  onChange={(e) => handleAISettingsUpdate({ customPrompt: e.target.value })}
                  className="w-full"
                  rows={4}
                  placeholder="Enter custom prompt for AI recommendations..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use {'{answer}'} placeholder to reference answers from linked questions.
                </p>
              </div>

              <div>
                <Label>Linked Questions</Label>
                <div className="space-y-2 mt-2">
                  {availableFields
                    .filter(f => f.id !== field.id)
                    .map(f => (
                      <div key={f.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <Switch
                          checked={field.settings?.aiRecommendation?.linkedQuestionIds?.includes(f.id) || false}
                          onCheckedChange={(checked) => {
                            const currentLinked = field.settings?.aiRecommendation?.linkedQuestionIds || [];
                            handleAISettingsUpdate({
                              linkedQuestionIds: checked
                                ? [...currentLinked, f.id]
                                : currentLinked.filter(id => id !== f.id)
                            });
                          }}
                        />
                        <span className="flex-1">{f.question}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Configure Scoring
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Scoring Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  min="0"
                  value={field.scoring?.points || 0}
                  onChange={(e) => handleScoringUpdate({ points: Number(e.target.value) })}
                />
              </div>

              <div>
                <Label>Weight</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={field.scoring?.weight || 1}
                  onChange={(e) => handleScoringUpdate({ weight: Number(e.target.value) })}
                />
              </div>

              <div className="col-span-2">
                <Label>Scoring Method</Label>
                <Select
                  value={field.scoring?.scoringMethod || 'binary'}
                  onValueChange={(value) => handleScoringUpdate({ 
                    scoringMethod: value as FieldScoring['scoringMethod']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scoring method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binary">All or Nothing</SelectItem>
                    <SelectItem value="partial">Partial Credit</SelectItem>
                    <SelectItem value="custom">Custom Scoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {field.scoring?.scoringMethod === 'partial' && (
                <div className="col-span-2">
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={field.scoring?.passingScore || 70}
                    onChange={(e) => handleScoringUpdate({ passingScore: Number(e.target.value) })}
                  />
                </div>
              )}

              {field.scoring?.scoringMethod === 'custom' && field.type === FieldType.MULTIPLE_CHOICE && (
                <div className="col-span-2 space-y-2">
                  <Label>Custom Points per Option</Label>
                  {field.options?.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="flex-1">{option.text}</span>
                      <Input
                        type="number"
                        className="w-24"
                        value={field.scoring?.customScoring?.[option.id] || 0}
                        onChange={(e) => handleScoringUpdate({
                          customScoring: {
                            ...(field.scoring?.customScoring || {}),
                            [option.id]: Number(e.target.value)
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default FieldEditor;