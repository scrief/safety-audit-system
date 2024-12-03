import OpenAI from 'openai';
import { Field } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSafetyRecommendation(
  observation: string,
  field: Field,
  industryContext?: string
): Promise<string> {
  try {
    const prompt = `As a safety expert, provide a specific, actionable recommendation for the following safety observation in ${industryContext || 'an industrial'} setting. Focus on OSHA compliance and industry best practices.

Observation: ${observation}

Consider:
1. Immediate corrective actions
2. Preventive measures
3. Relevant safety standards
4. Risk reduction strategies

Provide a concise, professional recommendation in 2-3 sentences:`;

    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 150,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    return response.choices[0]?.message?.content || 'Unable to generate recommendation';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate safety recommendation');
  }
}
