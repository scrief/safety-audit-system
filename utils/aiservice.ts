export async function getAIRecommendation(prompt: string, model: string, maxTokens: number) {
    try {
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
  
      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.recommendation;
    } catch (error) {
      console.error('AI recommendation error:', error);
      throw error;
    }
  }
  
  export async function convertSpeechToText(audioBlob: Blob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
  
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Speech to text error: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Speech to text error:', error);
      throw error;
    }
  }