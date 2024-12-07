'use client';

import React, { useState, useEffect } from 'react';
import { Template, Audit, Section, Field } from '@/types/fields';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestionRenderer } from './QuestionRenderer';
import { useNavigationManager } from '@/hooks/useNavigationManager';

interface AuditFormProps {
  template: Template;
  initialData?: Audit;
  onSave: (data: Partial<Audit>) => Promise<void>;
  onComplete: (data: Audit) => Promise<void>;
}

export function AuditForm({ template, initialData, onSave, onComplete }: AuditFormProps) {
  const { setUnsavedChanges } = useNavigationManager();
  const [formData, setFormData] = useState<Record<string, any>>(initialData?.data || {});
  const [currentSection, setCurrentSection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData?.data || {});
    setUnsavedChanges(hasChanges);
  }, [formData, initialData?.data, setUnsavedChanges]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const calculateSectionScore = (section: Section) => {
    let totalPoints = 0;
    let earnedPoints = 0;

    section.fields.forEach(field => {
      if (!field.scoring) return;

      const response = formData[field.id];
      const points = field.scoring.points * (field.scoring.weight || 1);
      totalPoints += points;

      if (!response?.answer) return;

      switch (field.scoring.scoringMethod) {
        case 'binary':
          if (field.options?.find(opt => opt.isCorrect && opt.value === response.answer)) {
            earnedPoints += points;
          }
          break;
        case 'partial':
          const percentCorrect = calculatePercentageCorrect(field, response.answer);
          earnedPoints += (points * percentCorrect) / 100;
          break;
        case 'custom':
          if (field.scoring.customScoring && field.scoring.customScoring[response.answer]) {
            earnedPoints += field.scoring.customScoring[response.answer] * (field.scoring.weight || 1);
          }
          break;
      }
    });

    return {
      earned: earnedPoints,
      total: totalPoints,
      percentage: totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    };
  };

  const calculatePercentageCorrect = (field: Field, answer: any) => {
    return 100;
  };

  const handleSave = async (complete = false) => {
    try {
      setIsSaving(true);
      setError(null);

      const sectionScores = template.sections.map(section => ({
        sectionId: section.id,
        ...calculateSectionScore(section)
      }));

      const totalScore = sectionScores.reduce(
        (acc, score) => {
          acc.earned += score.earned;
          acc.total += score.total;
          return acc;
        },
        { earned: 0, total: 0 }
      );

      const updatedAudit: Partial<Audit> = {
        ...initialData,
        data: formData,
        scores: {
          sections: sectionScores,
          total: totalScore,
          percentage: totalScore.total > 0 ? (totalScore.earned / totalScore.total) * 100 : 0
        }
      };

      if (complete) {
        await onComplete(updatedAudit as Audit);
      } else {
        await onSave(updatedAudit);
      }
    } catch (error) {
      console.error('Error saving audit:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const currentSectionData = template.sections[currentSection];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto py-2">
        {template.sections.map((section, index) => (
          <Button
            key={section.id}
            variant={currentSection === index ? 'default' : 'outline'}
            onClick={() => setCurrentSection(index)}
            className="whitespace-nowrap"
          >
            {section.title}
          </Button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">{currentSectionData.title}</h2>
        {currentSectionData.description && (
          <p className="text-gray-600 mb-6">{currentSectionData.description}</p>
        )}

        <div className="space-y-6">
          {currentSectionData.fields.map((field) => (
            <QuestionRenderer
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={(value) => handleFieldChange(field.id, value)}
              disabled={isSaving}
            />
          ))}
        </div>
      </Card>

      <div className="flex justify-between">
        <div>
          {currentSection > 0 && (
            <Button
              onClick={() => setCurrentSection(prev => prev - 1)}
              variant="outline"
              disabled={isSaving}
            >
              Previous Section
            </Button>
          )}
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => handleSave(false)}
            variant="outline"
            disabled={isSaving}
          >
            Save Progress
          </Button>

          {currentSection < template.sections.length - 1 ? (
            <Button
              onClick={() => setCurrentSection(prev => prev + 1)}
              disabled={isSaving}
            >
              Next Section
            </Button>
          ) : (
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              Complete Audit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditForm;