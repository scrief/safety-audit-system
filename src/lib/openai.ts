import OpenAI from 'openai';

// Create OpenAI instance for server-side use only
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});