'use client';

import React, { useState, useEffect } from 'react';
import { Template, Audit, Section, Field } from '@/types/fields';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestionRenderer } from './QuestionRenderer';
import { ScoringDisplay } from './ScoringDisplay';
import { useNavigationManager } from '@/hooks/useNavigationManager';

interface AuditFormProps {
  template: Template;
  initialData?: Audit;
  onSave: (data: Partial<Audit>) => Promise<void>;
  onComplete?: (data: Audit) => Promise<void>;
}

export function AuditForm({ template, initialData, onSave, onComplete }: AuditFormProps) {
  const { setUnsavedChanges } = useNavigationManager();
  
  // Initialize form data from responses
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (!initialData?.responses) return {};
    
    return initialData.responses.reduce((acc, response) => ({
      ...acc,
      [response.fieldId]: {
        id: response.id, // Keep track of response ID
        fieldId: response.fieldId,
        value: response.value || '',
        notes: response.notes || '',
        photos: response.photos || [],
        aiRecommendation: response.aiRecommendation || null
      }
    }), {});
  });

  const [currentSection, setCurrentSection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScoring, setShowScoring] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanges = Object.keys(formData).some(fieldId => {
      const currentValue = formData[fieldId];
      const initialResponse = initialData?.responses?.find(r => r.fieldId === fieldId);
      
      if (!initialResponse) return true;
      
      return JSON.stringify({
        value: currentValue.value,
        notes: currentValue.notes,
        photos: currentValue.photos,
        aiRecommendation: currentValue.aiRecommendation
      }) !== JSON.stringify({
        value: initialResponse.value || '',
        notes: initialResponse.notes || '',
        photos: initialResponse.photos || [],
        aiRecommendation: initialResponse.aiRecommendation || null
      });
    });
    
    setUnsavedChanges(hasChanges);
  }, [formData, initialData?.responses, setUnsavedChanges]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        fieldId,
        value: value?.value ?? value,
        notes: value?.notes || '',
        photos: value?.photos || [],
        aiRecommendation: value?.aiRecommendation || null
      }
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

      if (!response?.value) return;

      switch (field.scoring.scoringMethod) {
        case 'binary':
          if (field.options?.find(opt => opt.isCorrect && opt.value === response.value)) {
            earnedPoints += points;
          }
          break;
        case 'partial':
          const percentCorrect = calculatePercentageCorrect(field, response.value);
          earnedPoints += (points * percentCorrect) / 100;
          break;
        case 'custom':
          if (field.scoring.customScoring && field.scoring.customScoring[response.value]) {
            earnedPoints += field.scoring.customScoring[response.value] * (field.scoring.weight || 1);
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
    // Implement your partial scoring logic here
    return 100;
  };

  const handleSave = async (complete = false) => {
    try {
      setIsSaving(true);
      setError(null);

      // Transform form data into responses format
      const responses = Object.entries(formData).map(([fieldId, data]) => ({
        id: data.id, // Include response ID if it exists
        fieldId,
        value: data.value?.toString() || '', // Ensure value is string as per schema
        notes: data.notes || '',
        photos: data.photos || [],
        aiRecommendation: data.aiRecommendation || null
      }));

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
        status: complete ? 'COMPLETED' : 'DRAFT',
        responses,
        scoring: {
          sections: sectionScores,
          total: totalScore,
          percentage: totalScore.total > 0 ? (totalScore.earned / totalScore.total) * 100 : 0
        },
        completedAt: complete ? new Date().toISOString() : null
      };

      // Log the data being sent
      console.log('Saving audit data:', updatedAudit);

      if (complete) {
        await handleComplete();
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

  const handleComplete = async () => {
    try {
      if (!onComplete) return;  // Early return if no onComplete handler
      
      const auditData = {
        ...initialData,
        responses: Object.values(formData).map(response => ({
          id: response.id,
          fieldId: response.fieldId,
          value: response.value,
          notes: response.notes || '',
          photos: response.photos || [],
          aiRecommendation: response.aiRecommendation
        }))
      } as Audit;

      await onComplete(auditData);
    } catch (error) {
      console.error('Error completing audit:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete audit');
    }
  };

  const currentSectionData = template.sections[currentSection];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 justify-between items-center">
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
        
        <Button
          variant="outline"
          onClick={() => setShowScoring(!showScoring)}
        >
          {showScoring ? 'Hide Score' : 'Show Score'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
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
        </div>

        {showScoring && (
          <div className="md:col-span-1">
            <ScoringDisplay
              sections={template.sections}
              formData={formData}
              calculateSectionScore={calculateSectionScore}
            />
          </div>
        )}
      </div>

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