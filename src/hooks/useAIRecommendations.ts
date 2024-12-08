import { useState, useCallback } from 'react';
import { Field } from '@/types/fields';

export function useAIRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = useCallback(async (
    observation: string,
    field: Field,
    industryContext?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          observation,
          industryContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendation');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.recommendation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI recommendation');
      return '';
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getRecommendation, isLoading, error };
}
