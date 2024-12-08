'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Section } from '@/types/fields';

interface ScoringDisplayProps {
  sections: Section[];
  formData: Record<string, any>;
  calculateSectionScore: (section: Section) => { earned: number; total: number; percentage: number };
}

export function ScoringDisplay({ sections, formData, calculateSectionScore }: ScoringDisplayProps) {
  const totalScore = sections.reduce((acc, section) => {
    const score = calculateSectionScore(section);
    acc.earned += score.earned;
    acc.total += score.total;
    return acc;
  }, { earned: 0, total: 0 });

  const overallPercentage = totalScore.total > 0 
    ? (totalScore.earned / totalScore.total) * 100 
    : 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Audit Score</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Score</span>
            <span>{overallPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={overallPercentage} className="h-2" />
          <div className="text-sm text-gray-500">
            {totalScore.earned.toFixed(1)} / {totalScore.total.toFixed(1)} points
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Section Scores</h4>
          {sections.map((section) => {
            const score = calculateSectionScore(section);
            return (
              <div key={section.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{section.title}</span>
                  <span>{score.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={score.percentage} className="h-1.5" />
                <div className="text-xs text-gray-500">
                  {score.earned.toFixed(1)} / {score.total.toFixed(1)} points
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default ScoringDisplay;