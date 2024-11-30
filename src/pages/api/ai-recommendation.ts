import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

type ResponseData = {
  recommendation?: string;
  error?: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug logging
  console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
  console.log('Request body:', req.body);

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { prompt, model = 'gpt-4', maxTokens = 150 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Sending request to OpenAI with prompt:', prompt);

    const systemPrompt = `You are a safety expert providing recommendations for identified hazards. 
    Provide clear, actionable safety recommendations that follow OSHA guidelines and industry best practices. 
    Focus on:
    1. Immediate actions needed
    2. Preventive measures
    3. Required PPE if applicable
    4. Training recommendations if needed`;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    console.log('OpenAI response received:', completion.choices[0].message);

    const recommendation = completion.choices[0].message.content || '';

    res.status(200).json({ recommendation });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      error: 'Error generating recommendation',
      details: error.message || 'Unknown error'
    });
  }
}