import { useState, useCallback } from 'react';
import { Field } from '@/types';
import { generateSafetyRecommendation } from '@/lib/openai';

export function useAIRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = useCallback(async (
    value: string,
    field: Field
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const recommendation = await generateSafetyRecommendation(value, field);
      return recommendation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI recommendation');
      return '';
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getRecommendation, isLoading, error };
}
