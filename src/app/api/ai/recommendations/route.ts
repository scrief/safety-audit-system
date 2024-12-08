import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { observation, industryContext } = await req.json();

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

    const recommendation = response.choices[0]?.message?.content || 'Unable to generate recommendation';
    
    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate safety recommendation' },
      { status: 500 }
    );
  }
}