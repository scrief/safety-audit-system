export async function getAIRecommendation(prompt: string, model: string, maxTokens: number) {
    try {
      console.log('Sending request to AI service:', { prompt, model, maxTokens });
  
      const response = await fetch('/api/ai-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          maxTokens,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('AI service error:', data);
        throw new Error(data.error || data.details || 'Failed to get AI recommendation');
      }
  
      return data.recommendation;
    } catch (error) {
      console.error('AI recommendation error:', error);
      throw error;
    }
  }