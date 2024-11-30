import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

interface OpenAIError {
  name?: string;
  message?: string;
  status?: number;
  response?: {
    status?: number;
    data?: any;
  };
}

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    console.log('Initializing AI Service');
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      console.log('OpenAI client initialized with API key');
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      throw error;
    }
  }

  async generateRecommendation(prompt: string, model: string, maxTokens: number): Promise<string> {
    try {
      console.log('Starting AI recommendation generation with:', {
        promptLength: prompt.length,
        model,
        maxTokens,
        hasApiKey: !!this.openai
      });

      if (!this.openai) {
        throw new UnauthorizedException('OpenAI client not initialized');
      }

      const modelToUse = model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo';
      console.log('Using model:', modelToUse);

      const completion = await this.openai.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You are a safety expert providing recommendations based on audit responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens || 150,
        temperature: 0.7,
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No recommendation generated');
      }

      console.log('Generated recommendation:', {
        length: completion.choices[0].message.content.length,
        preview: completion.choices[0].message.content.substring(0, 100)
      });

      return completion.choices[0].message.content;

    } catch (error: unknown) {
      const openAIError = error as OpenAIError;
      
      console.error('OpenAI API error:', {
        name: openAIError?.name,
        message: openAIError?.message,
        status: openAIError?.status,
        response: openAIError?.response?.data
      });

      if (openAIError?.response?.status === 401) {
        throw new UnauthorizedException('Invalid OpenAI API key');
      }

      throw new InternalServerErrorException(
        `Failed to generate recommendation: ${openAIError?.message || 'Unknown error'}`
      );
    }
  }
} 