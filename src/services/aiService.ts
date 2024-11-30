import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const openaiAxios = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export const getAIRecommendation = async (
  prompt: string,
  model: string = 'gpt-3.5-turbo',
  maxTokens: number = 150
): Promise<string> => {
  try {
    console.log('Making OpenAI request with:', { prompt, model, maxTokens });
    
    const response = await openaiAxios.post('/chat/completions', {
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a safety expert. Provide specific safety recommendations based on the hazard or issue described."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    console.log('OpenAI response:', response.data);
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(`Failed to generate AI recommendation: ${error.message}`);
  }
};